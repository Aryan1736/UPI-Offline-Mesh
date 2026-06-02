# 🚀 MeshPay – Offline UPI Settlement Network

A Spring Boot based simulation of a **secure offline UPI payment system** where encrypted payment packets travel through a Bluetooth Mesh-like network and are eventually delivered to the backend by internet-enabled bridge devices.

The project demonstrates concepts used in real-world distributed payment systems including **Hybrid Encryption, Idempotency, Replay Protection, Optimistic Locking, Transactional Settlement, Concurrency Handling, and Mesh Networking.**

---

## ✨ Features

### 🔐 Secure Hybrid Encryption
- RSA-2048 + OAEP-SHA256
- AES-256-GCM authenticated encryption
- Per-payment nonce generation
- SHA-256 ciphertext hashing
- Tamper detection via GCM authentication tags

### 📡 Offline Mesh Network Simulation
- Simulated Bluetooth Mesh propagation
- Multiple virtual devices
- TTL-based routing
- Packet deduplication
- Internet-enabled bridge nodes

### 💳 UPI Payment Processing
- Sender & Receiver VPAs
- Secure PIN hashing
- Account balance management
- Transaction ledger
- Exactly-once settlement

### ⚡ Distributed Systems Concepts
- Idempotency cache
- Concurrent bridge uploads
- Replay attack prevention
- Optimistic locking
- Transactional consistency

### 📊 Interactive Dashboard
- Live mesh visualization
- Device monitoring
- Account balances
- Transaction history
- Activity logs

### ✅ Automated Testing
- Concurrent settlement testing
- Tampered packet validation
- Encryption/Decryption verification
- End-to-end integration testing

---

# 🏗️ System Architecture

```text
                    Offline Payment Creation
                               │
                               ▼
                   PaymentInstruction Object
                               │
                               ▼
                RSA + AES-GCM Hybrid Encryption
                               │
                               ▼
                         MeshPacket
                               │
                               ▼
                Bluetooth Mesh Network Simulation
                               │
                               ▼
                      Bridge Device (Internet)
                               │
                               ▼
                   BridgeIngestionService
                               │
          ┌────────────────────┼────────────────────┐
          ▼                    ▼                    ▼
     Hash Packet       Idempotency Check      Decrypt
                               │
                               ▼
                         Duplicate?
                        /          \
                      Yes          No
                      ▼             ▼
                 Drop Packet   Freshness Check
                                      │
                                      ▼
                             SettlementService
                                      │
                                      ▼
                            Transaction Ledger
```

---

# 🛠️ Tech Stack

| Technology | Purpose |
|------------|----------|
| Java 17 | Core Language |
| Spring Boot 3 | Backend Framework |
| Spring Data JPA | ORM |
| Hibernate | Persistence |
| H2 Database | In-Memory Database |
| Maven | Dependency Management |
| Thymeleaf | Dashboard UI |
| JUnit 5 | Testing |
| RSA-2048 | Public Key Encryption |
| AES-256-GCM | Authenticated Encryption |
| ConcurrentHashMap | Idempotency Cache |

---

# 📂 Project Structure

```text
src/main/java/com/demo/upimesh

├── config
│   └── AppConfig.java
│
├── controller
│   ├── ApiController.java
│   └── DashboardController.java
│
├── crypto
│   ├── HybridCryptoService.java
│   └── ServerKeyHolder.java
│
├── model
│   ├── Account.java
│   ├── Transaction.java
│   ├── MeshPacket.java
│   └── PaymentInstruction.java
│
├── repository
│   ├── AccountRepository.java
│   └── TransactionRepository.java
│
├── service
│   ├── DemoService.java
│   ├── VirtualDevice.java
│   ├── MeshSimulatorService.java
│   ├── IdempotencyService.java
│   ├── SettlementService.java
│   └── BridgeIngestionService.java
│
└── UpiMeshApplication.java
```

---

# 🔄 Payment Lifecycle

## 1️⃣ Payment Creation

A user initiates an offline payment:

```text
Alice → Bob ₹500
```

A `PaymentInstruction` is generated containing:

- Sender VPA
- Receiver VPA
- Amount
- PIN Hash
- Nonce
- Signed Timestamp

---

## 2️⃣ Encryption

The payment instruction is encrypted using:

```text
AES-256-GCM
```

The AES key is encrypted using:

```text
RSA-2048 OAEP
```

Final encrypted payload:

```text
RSA(AES_KEY)
+
IV
+
AES_CIPHERTEXT
```

---

## 3️⃣ Mesh Propagation

The packet travels through nearby devices:

```text
phone-alice
      ↓
phone-stranger1
      ↓
phone-stranger2
      ↓
phone-bridge
```

TTL decreases at every hop.

---

## 4️⃣ Bridge Upload

Internet-enabled bridge devices upload packets to the backend.

Multiple bridge devices may upload the same packet simultaneously.

---

## 5️⃣ Idempotency Check

The ciphertext is hashed:

```text
SHA-256(ciphertext)
```

The hash acts as an idempotency key.

```java
putIfAbsent(packetHash)
```

Guarantees:

```text
Exactly One Settlement
```

even if multiple bridges deliver the packet.

---

## 6️⃣ Decryption & Validation

The backend:

✅ Decrypts packet

✅ Verifies integrity

✅ Checks freshness

✅ Rejects stale packets

✅ Rejects tampered packets

---

## 7️⃣ Settlement

Funds move atomically:

```text
Alice ₹5000 → ₹4500
Bob   ₹1000 → ₹1500
```

Transaction recorded:

```text
SETTLED
```

---

# 🔒 Security Features

## 🛡️ Hybrid Encryption

Uses:

```text
RSA-2048 OAEP
+
AES-256-GCM
```

Provides:

- Confidentiality
- Integrity
- Authentication

---

## 🔄 Replay Attack Protection

Each payment contains:

```text
signedAt timestamp
```

Packets older than the configured threshold are automatically rejected.

---

## 🚫 Tamper Detection

AES-GCM authentication tags ensure that:

```text
1-bit modification
        ↓
Decryption Failure
        ↓
Packet Rejected
```

---

## ⚡ Idempotency Protection

Multiple bridge uploads:

```text
Bridge-1
Bridge-2
Bridge-3
```

Result:

```text
SETTLED
DUPLICATE_DROPPED
DUPLICATE_DROPPED
```

Exactly one settlement occurs.

---

## 🔐 Optimistic Locking

Accounts use:

```java
@Version
```

to prevent lost updates during concurrent transactions.

---

# 🧪 Testing

## 🔥 Concurrent Settlement Test

Simulates:

```text
3 Bridges
1 Packet
Same Instant
```

Verifies:

```text
Exactly One Settlement
```

---

## 🛡️ Tampered Packet Test

Corrupts ciphertext and ensures:

```text
INVALID
```

response is returned.

---

## 🔄 Encryption Round Trip Test

Verifies:

```text
Encrypt
   ↓
Decrypt
   ↓
Original Data Restored
```

---

# 🌐 API Endpoints

### 🔑 Get Server Public Key

```http
GET /api/server-key
```

---

### 📤 Create Offline Payment

```http
POST /api/demo/send
```

---

### 🔄 Run Gossip Round

```http
POST /api/mesh/gossip
```

---

### 📡 Upload Bridge Packets

```http
POST /api/mesh/flush
```

---

### 📊 View Mesh State

```http
GET /api/mesh/state
```

---

### 💳 View Accounts

```http
GET /api/accounts
```

---

### 📜 View Transactions

```http
GET /api/transactions
```

---

# ▶️ Running Locally

### Clone Repository

```bash
git clone https://github.com/yourusername/meshpay.git
```

### Navigate

```bash
cd meshpay
```

### Run Application

```bash
mvn spring-boot:run
```

### Open Dashboard

```text
http://localhost:8080
```

---

# 🎬 Demo Scenario

### Step 1

Create Payment:

```text
Alice → Bob ₹500
```

### Step 2

Inject Packet:

```text
phone-alice
```

receives encrypted packet.

### Step 3

Run Gossip:

```text
Alice
 ↓
Stranger
 ↓
Bridge
```

### Step 4

Bridge Upload:

Packet reaches backend.

### Step 5

Settlement:

```text
Alice ₹5000 → ₹4500
Bob ₹1000 → ₹1500
```

Transaction appears in ledger.

---

# 🎯 Key Concepts Demonstrated

- Spring Boot Architecture
- REST APIs
- JPA & Hibernate
- Database Transactions
- Optimistic Locking
- Cryptography
- Distributed Systems
- Idempotency
- Concurrency
- Thread Safety
- Replay Protection
- Integration Testing
- System Design Fundamentals

---

# 🚀 Future Enhancements

- PostgreSQL Integration
- Redis-based Idempotency Cache
- JWT Authentication
- Docker Deployment
- Kafka Event Streaming
- Android BLE Client
- WebSocket Updates
- Prometheus Monitoring
- Grafana Dashboards

---

# 👨‍💻 Author

**Aryan Bagchi**

Backend Developer | Java | Spring Boot | Competitive Programming

⭐ If you found this project interesting, consider giving it a star!
