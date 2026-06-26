#!/usr/bin/env bash
# ClaimProof full deployment script
# Requirements: stellar CLI, Rust 1.91 with wasm32v1-none target, ts-node
set -euo pipefail

NETWORK=${STELLAR_NETWORK:-testnet}
ADMIN_KEY=${ADMIN_SECRET_KEY:?"ADMIN_SECRET_KEY must be set"}
RPC=${STELLAR_RPC_URL:-"https://soroban-testnet.stellar.org"}

ADMIN_PUB=$(stellar keys public-key --secret "$ADMIN_KEY" 2>/dev/null || \
  node -e "const{Keypair}=require('@stellar/stellar-sdk');console.log(Keypair.fromSecret('$ADMIN_KEY').publicKey())")

echo "=== ClaimProof Deploy ==="
echo "Network:  $NETWORK"
echo "Admin:    $ADMIN_PUB"
echo ""

# ── 1. Build WASM ─────────────────────────────────────────────────────────────
echo "Building Soroban contracts..."
cd "$(dirname "$0")/.."
cargo build --target wasm32v1-none --release \
  --manifest-path contracts/claimproof/Cargo.toml

WASM="target/wasm32v1-none/release/claimproof.wasm"
echo "✓ WASM built: $WASM ($(du -sh "$WASM" | cut -f1))"

# ── 2. Upload & deploy ClaimProof ─────────────────────────────────────────────
echo ""
echo "Deploying ClaimProof contract..."
CONTRACT_ID=$(stellar contract deploy \
  --wasm "$WASM" \
  --source-account "$ADMIN_KEY" \
  --network "$NETWORK" \
  --rpc-url "$RPC" 2>&1 | tail -1)

echo "✓ Deployed: $CONTRACT_ID"
export CLAIMPROOF_CONTRACT_ID="$CONTRACT_ID"

# ── 3. Initialize verifying key ───────────────────────────────────────────────
echo ""
echo "Initializing Groth16 verifying key..."
CONTRACT_ID="$CONTRACT_ID" \
  ADMIN_SECRET_KEY="$ADMIN_KEY" \
  STELLAR_NETWORK="$NETWORK" \
  STELLAR_RPC_URL="$RPC" \
  npx ts-node scripts/init_vk.ts

echo "✓ Verifying key stored on-chain"

# ── 4. Copy circuit artifacts to frontend ─────────────────────────────────────
echo ""
echo "Copying circuit artifacts to frontend..."
mkdir -p frontend/public/circuits
cp circuits/build/condition_check_js/condition_check.wasm frontend/public/circuits/
cp circuits/build/condition_check_final.zkey frontend/public/circuits/
echo "✓ Circuit WASM and zkey in frontend/public/circuits/"

# ── 5. Summary ────────────────────────────────────────────────────────────────
echo ""
echo "══════════════════════════════════════════"
echo " ClaimProof deployed successfully!"
echo "══════════════════════════════════════════"
echo " Contract ID: $CONTRACT_ID"
echo " Network:     $NETWORK"
echo ""
echo " Next steps:"
echo "  1. Copy .env.example to .env and fill in:"
echo "     CLAIMPROOF_CONTRACT_ID=$CONTRACT_ID"
echo "     ADMIN_SECRET_KEY=..."
echo "  2. cd backend && npm run dev"
echo "  3. cd frontend && npm run dev"
echo "══════════════════════════════════════════"
