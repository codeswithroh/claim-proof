#!/usr/bin/env node
/**
 * init_vk.js — Plain Node.js version. Initialises the Groth16 VK on the ClaimProof contract.
 * Usage:
 *   ADMIN_SECRET_KEY=S... CONTRACT_ID=C... node scripts/init_vk.js
 */
const fs = require("fs");
const path = require("path");

const CONTRACT_ID = process.env.CONTRACT_ID || process.env.CLAIMPROOF_CONTRACT_ID;
const SECRET_KEY  = process.env.ADMIN_SECRET_KEY;
const RPC_URL     = process.env.STELLAR_RPC_URL || "https://soroban-testnet.stellar.org";

if (!CONTRACT_ID || !SECRET_KEY) {
  console.error("CONTRACT_ID and ADMIN_SECRET_KEY must be set");
  process.exit(1);
}

const {
  Contract, Keypair, Networks, rpc,
  TransactionBuilder, BASE_FEE, xdr, nativeToScVal,
} = require("@stellar/stellar-sdk");
const SorobanRpc = rpc;

const VK_PATH = path.join(__dirname, "../circuits/build/verification_key.json");
const vkJson  = JSON.parse(fs.readFileSync(VK_PATH, "utf-8"));

// ── Encoding helpers ──────────────────────────────────────────────────────────

function write32BE(val, buf, offset) {
  buf.writeBigUInt64BE(val >> 192n, offset);
  buf.writeBigUInt64BE((val >> 128n) & 0xffffffffffffffffn, offset + 8);
  buf.writeBigUInt64BE((val >> 64n)  & 0xffffffffffffffffn, offset + 16);
  buf.writeBigUInt64BE(val           & 0xffffffffffffffffn, offset + 24);
}

function g1ToBytes64(pt) {
  const buf = Buffer.alloc(64);
  write32BE(BigInt(pt[0]), buf, 0);
  write32BE(BigInt(pt[1]), buf, 32);
  return buf;
}

function g2ToBytes128(pt) {
  const buf = Buffer.alloc(128);
  let offset = 0;
  // snarkjs: pt[i] = [c1, c0]; Stellar expects c0 || c1 for each coordinate
  for (const coord of [pt[0][1], pt[0][0], pt[1][1], pt[1][0]]) {
    write32BE(BigInt(coord), buf, offset);
    offset += 32;
  }
  return buf;
}

const bytesNVal = (buf) => xdr.ScVal.scvBytes(buf);

// ── Build VK ──────────────────────────────────────────────────────────────────

const alpha1 = g1ToBytes64(vkJson.vk_alpha_1);
const beta2  = g2ToBytes128(vkJson.vk_beta_2);
const gamma2 = g2ToBytes128(vkJson.vk_gamma_2);
const delta2 = g2ToBytes128(vkJson.vk_delta_2);
const icBufs = vkJson.IC.map(g1ToBytes64);

const icVec = xdr.ScVal.scvVec(icBufs.map(bytesNVal));
// Keys must be in lexicographic order: alpha_1 < beta_2 < delta_2 < gamma_2 < ic
const vkMap = xdr.ScVal.scvMap([
  new xdr.ScMapEntry({ key: xdr.ScVal.scvSymbol("alpha_1"), val: bytesNVal(alpha1) }),
  new xdr.ScMapEntry({ key: xdr.ScVal.scvSymbol("beta_2"),  val: bytesNVal(beta2)  }),
  new xdr.ScMapEntry({ key: xdr.ScVal.scvSymbol("delta_2"), val: bytesNVal(delta2) }),
  new xdr.ScMapEntry({ key: xdr.ScVal.scvSymbol("gamma_2"), val: bytesNVal(gamma2) }),
  new xdr.ScMapEntry({ key: xdr.ScVal.scvSymbol("ic"),      val: icVec             }),
]);

// ── Submit ────────────────────────────────────────────────────────────────────

async function main() {
  const kp      = Keypair.fromSecret(SECRET_KEY);
  const server  = new SorobanRpc.Server(RPC_URL);
  const account = await server.getAccount(kp.publicKey());

  const contract   = new Contract(CONTRACT_ID);
  const adminScVal = nativeToScVal(kp.publicKey(), { type: "address" });

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(contract.call("init_vk", adminScVal, vkMap))
    .setTimeout(60)
    .build();

  const sim = await server.simulateTransaction(tx);
  if (sim.error) { console.error("Simulation failed:", sim.error); process.exit(1); }

  const assembled = SorobanRpc.assembleTransaction(tx, sim).build();
  assembled.sign(kp);

  console.log("Submitting init_vk...");
  const send = await server.sendTransaction(assembled);
  console.log("TX hash:", send.hash);
  if (send.status === "ERROR") { console.error("Send error:", send.errorResult); process.exit(1); }

  let result;
  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 3000));
    result = await server.getTransaction(send.hash);
    if (result.status !== "NOT_FOUND") break;
  }

  if (result.status === "SUCCESS") {
    console.log("✓ Verifying key initialized on", CONTRACT_ID);
  } else {
    console.error("TX failed:", result.status, result);
    process.exit(1);
  }
}

main().catch(err => { console.error(err); process.exit(1); });
