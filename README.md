# Offline UPI Mesh Network Simulator

A Spring Boot based simulation of an Offline UPI payment system where encrypted payment packets are propagated through a Bluetooth Mesh-like network and eventually delivered to the backend by internet-enabled bridge nodes.

## Features

- RSA-2048 + AES-256-GCM Hybrid Encryption
- Offline Mesh Network Simulation
- Idempotency Protection
- Replay Attack Prevention
- Transactional Settlement
- Optimistic Locking
- Interactive Dashboard
- Concurrency Testing
- Tamper Detection

---

## Architecture

```text
Sender Device
     │
     ▼
PaymentInstruction
     │
     ▼
Hybrid Encryption
(RSA + AES-GCM)
     │
     ▼
MeshPacket
     │
     ▼
Mesh Network
     │
     ▼
Bridge Device
     │
     ▼
BridgeIngestionService
     │
 ┌───┼────────────────────┐
 ▼   ▼                    ▼
Hash Packet       Idempotency Check
                         │
                         ▼
                  Duplicate?
                 /         \
               Yes         No
               ▼            ▼
             Drop       Decrypt
                              │
                              ▼
                     Freshness Check
                              │
                              ▼
                     SettlementService
                              │
                              ▼
                     Transaction Ledger
```

## Tech Stack

- Java 17
- Spring Boot 3
- Spring Data JPA
- Hibernate
- H2 Database
- Maven
- Thymeleaf
- JUnit 5

---

## Project Structure

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

## Payment Flow

### 1. Create Payment

Alice sends ₹500 to Bob.

```text
Alice → Bob ₹500
```

A PaymentInstruction is created containing:

- senderVpa
- receiverVpa
- amount
- pinHash
- nonce
- signedAt

---

### 2. Encrypt

The payload is encrypted using:

```text
AES-256-GCM
```

The AES key is encrypted using:

```text
RSA-2048 OAEP
```

---

### 3. Mesh Propagation

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

### 4. Bridge Upload

Bridge nodes upload packets to backend.

---

### 5. Idempotency Check

Ciphertext is hashed using SHA-256.

```java
putIfAbsent(packetHash)
```

Ensures exactly-once settlement.

---

### 6. Decrypt & Validate

Backend:

- Decrypts packet
- Checks freshness
- Rejects stale packets
- Rejects tampered packets

---

### 7. Settlement

Balances update atomically.

```text
Alice ₹5000 → ₹4500
Bob ₹1000 → ₹1500
```

Transaction stored in ledger.

---

## Security Features

### Hybrid Encryption

- RSA-2048 OAEP
- AES-256-GCM

### Replay Protection

Packets contain signedAt timestamps.

### Tamper Detection

AES-GCM authentication tags detect modification.

### Idempotency

Multiple bridge uploads result in:

```text
SETTLED
DUPLICATE_DROPPED
DUPLICATE_DROPPED
```

### Optimistic Locking

Uses:

```java
@Version
```

to prevent lost updates.

---

## Testing

### Concurrent Settlement Test

Simulates:

```text
3 bridges
1 packet
same time
```

Verifies exactly one settlement.

### Tampered Packet Test

Verifies invalid ciphertext is rejected.

### Encryption Round Trip Test

Verifies:

```text
Encrypt
↓
Decrypt
↓
Same Data
```

---

## API Endpoints

### Server Key

```http
GET /api/server-key
```

### Create Payment

```http
POST /api/demo/send
```

### Run Gossip

```http
POST /api/mesh/gossip
```

### Flush Bridges

```http
POST /api/mesh/flush
```

### View Mesh State

```http
GET /api/mesh/state
```

### Accounts

```http
GET /api/accounts
```

### Transactions

```http
GET /api/transactions
```

---

## Run Locally

```bash
git clone https://github.com/your-username/offline-upi-mesh.git
cd offline-upi-mesh
mvn spring-boot:run
```

Open:

```text
http://localhost:8080
```

---

## Future Improvements

- PostgreSQL
- Redis Idempotency Cache
- JWT Authentication
- Docker Deployment
- Kafka Integration
- Android BLE Client
- WebSocket Updates

---

## Author

**Aryan Bagchi**

Java | Spring Boot | Backend Development | Competitive Programming
