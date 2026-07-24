(function () {
    const { useEffect, useMemo, useState } = React;

    const currency = new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR"
    });

    const time = new Intl.DateTimeFormat("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
    });

    function App() {
        const [mesh, setMesh] = useState({ devices: [], idempotencyCacheSize: 0 });
        const [accounts, setAccounts] = useState([]);
        const [transactions, setTransactions] = useState([]);
        const [logLines, setLogLines] = useState(["Ready. Compose a payment to inject an encrypted packet into the mesh."]);
        const [busyAction, setBusyAction] = useState("");
        const [error, setError] = useState("");
        const [form, setForm] = useState({
            senderVpa: "alice@demo",
            receiverVpa: "bob@demo",
            amount: "500",
            pin: "1234"
        });

        const totals = useMemo(() => {
            const packetCount = mesh.devices.reduce((sum, device) => sum + Number(device.packetCount || 0), 0);
            const bridgeCount = mesh.devices.filter((device) => device.hasInternet).length;
            return { packetCount, bridgeCount, transactionCount: transactions.length };
        }, [mesh.devices, transactions.length]);

        useEffect(() => {
            refresh();
            const timer = window.setInterval(refresh, 3000);
            return () => window.clearInterval(timer);
        }, []);

        async function api(path, options) {
            const response = await fetch(path, options);
            if (!response.ok) {
                throw new Error(`${response.status} ${response.statusText}`);
            }
            return response.json();
        }

        async function refresh() {
            try {
                const [meshState, accountList, txList] = await Promise.all([
                    api("/api/mesh/state"),
                    api("/api/accounts"),
                    api("/api/transactions")
                ]);
                setMesh(meshState);
                setAccounts(accountList);
                setTransactions(txList);
                setError("");
            } catch (err) {
                setError(`Could not refresh dashboard: ${err.message}`);
            }
        }

        function addLog(message) {
            setLogLines((current) => [`[${time.format(new Date())}] ${message}`, ...current].slice(0, 80));
        }

        function updateForm(event) {
            const { name, value } = event.target;
            setForm((current) => ({ ...current, [name]: value }));
        }

        async function runAction(name, action) {
            setBusyAction(name);
            setError("");
            try {
                await action();
                await refresh();
            } catch (err) {
                setError(err.message);
                addLog(`${name} failed: ${err.message}`);
            } finally {
                setBusyAction("");
            }
        }

        function sendPacket() {
            runAction("Inject packet", async () => {
                const body = {
                    senderVpa: form.senderVpa,
                    receiverVpa: form.receiverVpa,
                    amount: Number(form.amount),
                    pin: form.pin,
                    ttl: 5,
                    startDevice: "phone-alice"
                };
                const result = await api("/api/demo/send", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(body)
                });
                addLog(`Packet ${result.packetId.substring(0, 8)} encrypted and injected at ${result.injectedAt}.`);
                addLog(`Ciphertext preview: ${result.ciphertextPreview}`);
            });
        }

        function gossip() {
            runAction("Run gossip", async () => {
                const result = await api("/api/mesh/gossip", { method: "POST" });
                addLog(`Gossip moved ${result.transfers} packet transfer(s): ${JSON.stringify(result.deviceCounts)}.`);
            });
        }

        function flushBridges() {
            runAction("Bridge upload", async () => {
                const result = await api("/api/mesh/flush", { method: "POST" });
                addLog(`${result.uploadsAttempted} bridge upload(s) attempted.`);
                result.results.forEach((upload) => {
                    const reason = upload.reason ? ` (${upload.reason})` : "";
                    addLog(`${upload.bridgeNode} uploaded packet ${upload.packetId}: ${upload.outcome}${reason}.`);
                });
            });
        }

        function resetMesh() {
            runAction("Reset mesh", async () => {
                await api("/api/mesh/reset", { method: "POST" });
                addLog("Mesh and idempotency cache cleared.");
            });
        }

        return React.createElement("main", { className: "app" },
            error ? React.createElement("div", { className: "notice" }, error) : null,
            React.createElement("section", { className: "hero" },
                React.createElement("div", { className: "hero-copy" },
                    React.createElement("p", { className: "eyebrow" }, "Offline payment simulator"),
                    React.createElement("h1", null, "UPI Offline Mesh"),
                    React.createElement("p", { className: "hero-text" },
                        "Send money without internet, gossip encrypted packets between nearby devices, then settle exactly once when a bridge node reconnects."
                    ),
                    React.createElement("div", { className: "metrics" },
                        React.createElement(Metric, { value: mesh.devices.length, label: "Devices" }),
                        React.createElement(Metric, { value: totals.packetCount, label: "Held packets" }),
                        React.createElement(Metric, { value: mesh.idempotencyCacheSize, label: "Idempotency cache" })
                    )
                ),
                React.createElement(PaymentPanel, {
                    form,
                    busyAction,
                    onChange: updateForm,
                    onSend: sendPacket,
                    onGossip: gossip,
                    onFlush: flushBridges,
                    onReset: resetMesh
                })
            ),
            React.createElement("section", { className: "workflow" },
                React.createElement(Step, { number: "1", title: "Compose", text: "The sender phone creates an encrypted payment instruction." }),
                React.createElement(Step, { number: "2", title: "Gossip", text: "Nearby devices copy packets and reduce time-to-live as they hop." }),
                React.createElement(Step, { number: "3", title: "Bridge", text: "Online nodes upload packets in parallel while the backend drops duplicates." })
            ),
            React.createElement("section", { className: "content-grid" },
                React.createElement("div", { className: "stack" },
                    React.createElement(DevicePanel, { devices: mesh.devices, bridgeCount: totals.bridgeCount }),
                    React.createElement(AccountPanel, { accounts })
                ),
                React.createElement("div", { className: "stack" },
                    React.createElement(TransactionPanel, { transactions }),
                    React.createElement(LogPanel, { logLines })
                )
            )
        );
    }

    function Metric({ value, label }) {
        return React.createElement("div", { className: "metric" },
            React.createElement("strong", null, value),
            React.createElement("span", null, label)
        );
    }

    function PaymentPanel({ form, busyAction, onChange, onSend, onGossip, onFlush, onReset }) {
        return React.createElement("aside", { className: "panel payment-panel" },
            React.createElement("div", { className: "panel-header" },
                React.createElement("div", null,
                    React.createElement("h2", null, "Demo controls"),
                    React.createElement("p", null, "Run the full offline-to-online settlement path.")
                ),
                React.createElement("span", { className: "status-pill" }, busyAction || "Live")
            ),
            React.createElement("div", { className: "form-grid" },
                React.createElement(Field, { label: "Sender", name: "senderVpa", value: form.senderVpa, onChange, options: ["alice@demo", "bob@demo", "carol@demo"] }),
                React.createElement(Field, { label: "Receiver", name: "receiverVpa", value: form.receiverVpa, onChange, options: ["bob@demo", "carol@demo", "alice@demo", "dave@demo"] }),
                React.createElement("label", null, "Amount",
                    React.createElement("input", { name: "amount", type: "number", min: "1", step: "1", value: form.amount, onChange })
                ),
                React.createElement("label", null, "PIN",
                    React.createElement("input", { name: "pin", type: "password", inputMode: "numeric", maxLength: "4", value: form.pin, onChange })
                )
            ),
            React.createElement("div", { className: "actions" },
                React.createElement("button", { disabled: Boolean(busyAction), onClick: onSend }, "Inject"),
                React.createElement("button", { disabled: Boolean(busyAction), className: "secondary", onClick: onGossip }, "Gossip"),
                React.createElement("button", { disabled: Boolean(busyAction), className: "secondary", onClick: onFlush }, "Bridge upload"),
                React.createElement("button", { disabled: Boolean(busyAction), className: "danger", onClick: onReset }, "Reset")
            )
        );
    }

    function Field({ label, name, value, onChange, options }) {
        return React.createElement("label", null, label,
            React.createElement("select", { name, value, onChange },
                options.map((option) => React.createElement("option", { key: option, value: option }, option))
            )
        );
    }

    function Step({ number, title, text }) {
        return React.createElement("div", { className: "panel step" },
            React.createElement("div", { className: "step-number" }, number),
            React.createElement("div", null,
                React.createElement("h3", null, title),
                React.createElement("p", null, text)
            )
        );
    }

    function DevicePanel({ devices, bridgeCount }) {
        return React.createElement("section", { className: "panel section" },
            React.createElement("div", { className: "section-title" },
                React.createElement("h2", null, "Mesh devices"),
                React.createElement("span", null, `${bridgeCount} online bridge node(s)`)
            ),
            React.createElement("div", { className: "device-list" },
                devices.map((device) => React.createElement("article", {
                    className: `device ${device.hasInternet ? "bridge" : "offline"}`,
                    key: device.deviceId
                },
                    React.createElement("div", { className: "device-top" },
                        React.createElement("span", { className: "device-name" }, device.deviceId),
                        React.createElement("span", { className: `badge ${device.hasInternet ? "badge-online" : "badge-offline"}` },
                            device.hasInternet ? "4G bridge" : "Offline"
                        )
                    ),
                    React.createElement("div", { className: "packet-row" },
                        device.packetIds.length
                            ? device.packetIds.map((packetId) => React.createElement("span", { className: "packet-id", key: packetId }, packetId))
                            : React.createElement("span", { className: "empty" }, "No packets held")
                    )
                ))
            )
        );
    }

    function AccountPanel({ accounts }) {
        return React.createElement("section", { className: "panel section" },
            React.createElement("div", { className: "section-title" },
                React.createElement("h2", null, "Account balances"),
                React.createElement("span", null, `${accounts.length} accounts`)
            ),
            React.createElement("div", { className: "table-wrap" },
                React.createElement("table", null,
                    React.createElement("thead", null,
                        React.createElement("tr", null,
                            React.createElement("th", null, "VPA"),
                            React.createElement("th", null, "Holder"),
                            React.createElement("th", null, "Balance")
                        )
                    ),
                    React.createElement("tbody", null,
                        accounts.map((account) => React.createElement("tr", { key: account.vpa },
                            React.createElement("td", { className: "mono" }, account.vpa),
                            React.createElement("td", null, account.holderName),
                            React.createElement("td", { className: "balance" }, currency.format(Number(account.balance)))
                        ))
                    )
                )
            )
        );
    }

    function TransactionPanel({ transactions }) {
        return React.createElement("section", { className: "panel section" },
            React.createElement("div", { className: "section-title" },
                React.createElement("h2", null, "Transaction ledger"),
                React.createElement("span", null, "Latest 20")
            ),
            React.createElement("div", { className: "table-wrap" },
                React.createElement("table", null,
                    React.createElement("thead", null,
                        React.createElement("tr", null,
                            ["ID", "From", "To", "Amount", "Status", "Bridge", "Hops", "Settled"].map((heading) =>
                                React.createElement("th", { key: heading }, heading)
                            )
                        )
                    ),
                    React.createElement("tbody", null,
                        transactions.length
                            ? transactions.map((tx) => React.createElement("tr", { key: tx.id },
                                React.createElement("td", { className: "mono" }, tx.id),
                                React.createElement("td", { className: "mono" }, tx.senderVpa),
                                React.createElement("td", { className: "mono" }, tx.receiverVpa),
                                React.createElement("td", { className: "balance" }, currency.format(Number(tx.amount))),
                                React.createElement("td", null,
                                    React.createElement("span", { className: `status status-${String(tx.status).toLowerCase()}` }, tx.status)
                                ),
                                React.createElement("td", null, tx.bridgeNodeId || "-"),
                                React.createElement("td", null, tx.hopCount),
                                React.createElement("td", null, tx.settledAt ? time.format(new Date(tx.settledAt)) : "-")
                            ))
                            : React.createElement("tr", null,
                                React.createElement("td", { colSpan: "8", className: "empty" }, "No transactions yet")
                            )
                    )
                )
            )
        );
    }

    function LogPanel({ logLines }) {
        return React.createElement("section", { className: "panel section" },
            React.createElement("div", { className: "section-title" },
                React.createElement("h2", null, "Activity log"),
                React.createElement("span", null, `${logLines.length} entries`)
            ),
            React.createElement("div", { className: "log" }, logLines.join("\n"))
        );
    }

    ReactDOM.createRoot(document.getElementById("root")).render(React.createElement(App));
})();
