# ClaimProof

**Parametric insurance on Stellar Soroban, settled by zero-knowledge proofs.**

ClaimProof lets anyone write a decentralized insurance policy against a real-world condition (price, weather, yield) and collect the payout trustlessly -- without ever revealing the oracle reading on-chain. The oracle value stays private; only a Groth16 ZK proof that the condition was triggered is submitted.

Built for the [Real-World ZK on Stellar Hackathon](https://stellar.org/).

---

## How It Works

```
Insured deposits collateral  →  Policy created on Soroban
        ↓
Oracle condition triggers (e.g. BTC < $50,000)
        ↓
User generates Groth16 proof in-browser (snarkjs)
        ↓
Contract verifies proof using BN254 native host functions
        ↓
Payout transferred to beneficiary automatically
```

The oracle value itself never appears on-chain. The ZK circuit proves the condition was met using a Poseidon commitment to the private reading, verified against the on-chain policy parameters.

---

## Architecture

| Layer | Technology |
|---|---|
| Smart contract | Rust, Soroban SDK 26, `wasm32v1-none` |
| ZK proof system | Circom 2 + snarkjs, Groth16 over BN254 |
| On-chain verifier | Stellar native BN254 host functions (CAP-0074/0075) |
| Backend | Node.js, Express, TypeScript, MongoDB |
| Frontend | React 19, Vite 8, Tailwind CSS v4 |
| Wallet | Freighter (Stellar browser extension) |

### Circuit: `condition_check`

`circuits/condition_check/condition_check.circom`

Public signals (in order):
| Index | Signal | Description |
|---|---|---|
| 0 | `triggered` | 1 if condition met, 0 otherwise |
| 1 | `oracle_commitment` | Poseidon(oracle_value, salt) |
| 2 | `threshold` | Policy trigger level |
| 3 | `policy_id` | Field-reduced policy identifier |
| 4 | `condition_type` | 0 = LTE, 1 = GTE |

Supports two condition types:
- **LTE** (less-than-or-equal): pays when `oracle_value <= threshold` (e.g. price crash protection)
- **GTE** (greater-than-or-equal): pays when `oracle_value >= threshold` (e.g. yield trigger)

### Contract: `ClaimProof`

`contracts/claimproof/src/lib.rs`

| Function | Description |
|---|---|
| `init_vk(admin, vk)` | One-time setup: store Groth16 verifying key |
| `create_policy(insured, beneficiary, token, amount, threshold, condition, expiry)` | Deposit collateral, mint policy |
| `claim(policy_id, bundle)` | Submit ZK proof, receive payout |
| `cancel(policy_id)` | Insured withdraws collateral before expiry |
| `expire(policy_id)` | Anyone can settle an expired policy (collateral returned) |

Deployed on Stellar Testnet: [`CCRLUFFB2AUBYF3MTROJGILRDSQL4M5PTQCBSDX6H2V5WL23HB4CZOYL`](https://stellar.expert/explorer/testnet/contract/CCRLUFFB2AUBYF3MTROJGILRDSQL4M5PTQCBSDX6H2V5WL23HB4CZOYL)

---

## Repository Structure

```
.
├── contracts/
│   └── claimproof/          # Soroban smart contract (Rust)
│       └── src/
│           ├── lib.rs        # Policy lifecycle logic
│           └── verifier.rs   # BN254 Groth16 verifier
├── circuits/
│   └── condition_check/      # Circom ZK circuit
│       └── condition_check.circom
├── backend/
│   └── src/
│       ├── routes/           # Express API routes
│       ├── services/
│       │   ├── stellar.ts    # Soroban transaction builder
│       │   ├── proofEncoding.ts  # snarkjs -> Soroban XDR encoder
│       │   └── oracle.ts     # Price feed integration
│       └── models/           # MongoDB schemas
├── frontend/
│   └── src/
│       ├── components/       # React UI components
│       │   ├── CreatePolicy.tsx
│       │   ├── ClaimFlow.tsx  # ZK proof generation + claim submission
│       │   └── PolicyCard.tsx
│       └── hooks/
│           ├── useZkProver.ts # In-browser snarkjs proof generation
│           └── useOracle.ts   # Live price feed hook
└── scripts/
    └── init_vk.js            # One-time VK initialization script
```

---

## Local Development

### Prerequisites

- Rust + `cargo` with `wasm32v1-none` target
- Node.js 20+
- MongoDB (local or Atlas)
- [Stellar CLI](https://developers.stellar.org/docs/tools/stellar-cli)
- [Freighter wallet](https://freighter.app/) browser extension

### 1. Install dependencies

```bash
# Root (concurrently)
npm install

# Backend
cd backend && npm install

# Frontend
cd frontend && npm install
```

### 2. Configure environment

```bash
cp .env.example backend/.env
```

Edit `backend/.env`:

```env
PORT=3001
MONGO_URI=mongodb://localhost:27017/claimproof

STELLAR_NETWORK=testnet
STELLAR_RPC_URL=https://soroban-testnet.stellar.org
CLAIMPROOF_CONTRACT_ID=CCRLUFFB2AUBYF3MTROJGILRDSQL4M5PTQCBSDX6H2V5WL23HB4CZOYL
ADMIN_SECRET_KEY=<your-funded-testnet-secret-key>
USDC_CONTRACT_ID=CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC
```

Get testnet funds: [Stellar Friendbot](https://laboratory.stellar.org/#account-creator?network=test)

### 3. Build and deploy the contract (optional -- testnet deployment already live)

```bash
# Build
cargo build --target wasm32v1-none --release --package claimproof

# Deploy
stellar contract deploy \
  --wasm target/wasm32v1-none/release/claimproof.wasm \
  --source-account <your-key-name> \
  --network testnet

# Initialize the verifying key (one-time)
cd backend
ADMIN_SECRET_KEY=<secret> CONTRACT_ID=<contract-id> node ../scripts/init_vk.js
```

### 4. Start the dev servers

```bash
npm run dev
```

Frontend: [http://localhost:5173](http://localhost:5173)
API: [http://localhost:3001](http://localhost:3001)

---

## ZK Proof Flow (In-Browser)

1. User connects Freighter wallet
2. User selects a policy and enters the private oracle value
3. `useZkProver` hook loads the circuit WASM + proving key from `/public/circuits/`
4. snarkjs generates a Groth16 proof locally -- the oracle value never leaves the browser
5. The proof and public signals are POSTed to `/api/policies/:id/claim`
6. Backend encodes them into Soroban XDR (`proofEncoding.ts`) and submits the `claim` transaction
7. The Soroban contract calls native BN254 MSM + pairing host functions to verify the proof
8. On success, payout is transferred to the beneficiary in the same transaction

---

## API Reference

```
GET  /api/policies              List all policies
GET  /api/policies/:id          Get policy by on-chain ID
POST /api/policies              Create a new policy (calls Soroban)
POST /api/policies/:id/claim    Submit ZK proof and trigger payout
```

**Create policy body:**
```json
{
  "insured": "G...",
  "beneficiary": "G...",
  "payoutAmount": "100000000",
  "threshold": "50000000000",
  "condition": "lte",
  "oracleType": "price_btc",
  "expiryLedger": 10000000
}
```

**Claim body:**
```json
{
  "proof": { "pi_a": [...], "pi_b": [...], "pi_c": [...] },
  "publicSignals": ["1", "<commitment>", "<threshold>", "<policy_id>", "0"]
}
```

---

## Key Technical Notes

**Footprint determinism**: Soroban simulates a transaction to compute its ledger entry footprint before submission. Any storage key derived from non-deterministic values (`env.ledger().sequence()`, `env.ledger().timestamp()`) will differ between simulation and execution, causing `InvokeHostFunctionTrapped`. Policy IDs are generated using only the on-chain counter: `sha256("cp_policy:" || count_be_bytes)`.

**BN254 encoding**: G1 points are 64 bytes (x||y, big-endian). G2 points are 128 bytes (x_c0||x_c1||y_c0||y_c1, big-endian). Public signals are 32-byte big-endian field elements.

**ScMap ordering**: All `#[contracttype]` struct fields and manually constructed ScMaps must have keys in lexicographic order or the host will reject them with `ScMap not sorted`.

**Wasm target**: Rust 1.82+ requires `wasm32v1-none` instead of `wasm32-unknown-unknown` for Soroban contracts. The latter enables unsupported WASM features (reference-types, multi-value) that the Soroban environment rejects.

---

## License

MIT
