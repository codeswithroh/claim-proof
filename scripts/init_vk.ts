/**
 * Initialize the Groth16 verifying key on the ClaimProof Soroban contract.
 *
 * Usage:
 *   ADMIN_SECRET_KEY=S... CONTRACT_ID=C... ts-node scripts/init_vk.ts
 *
 * This reads circuits/build/verification_key.json (produced by snarkjs) and
 * encodes it as the VerifyingKey structure expected by the Soroban contract,
 * then calls init_vk(admin, vk).
 */
import * as fs from "fs";
import * as path from "path";
import {
  Contract,
  Keypair,
  SorobanRpc,
  TransactionBuilder,
  Networks,
  BASE_FEE,
  nativeToScVal,
  xdr,
} from "@stellar/stellar-sdk";

const VK_PATH = path.join(__dirname, "../circuits/build/verification_key.json");
const NETWORK = (process.env.STELLAR_NETWORK ?? "testnet") as "testnet" | "mainnet";
const RPC_URL =
  process.env.STELLAR_RPC_URL ??
  (NETWORK === "testnet"
    ? "https://soroban-testnet.stellar.org"
    : "https://horizon.stellar.org");
const CONTRACT_ID = process.env.CONTRACT_ID ?? process.env.CLAIMPROOF_CONTRACT_ID ?? "";
const SECRET_KEY = process.env.ADMIN_SECRET_KEY ?? "";

if (!CONTRACT_ID || !SECRET_KEY) {
  console.error("CONTRACT_ID and ADMIN_SECRET_KEY must be set");
  process.exit(1);
}

/** Convert a hex string to a 0-padded Buffer */
function hexToBuf(hex: string, len: number): Buffer {
  const clean = hex.replace(/^0x/, "").padStart(len * 2, "0");
  return Buffer.from(clean, "hex");
}

/**
 * G1 affine point from snarkjs JSON [x, y] (decimal strings) → 64-byte big-endian buffer.
 * snarkjs stores values as decimal strings on BN254.
 */
function g1ToBytes64(pt: [string, string]): Buffer {
  const x = BigInt(pt[0]);
  const y = BigInt(pt[1]);
  const buf = Buffer.alloc(64);
  buf.writeBigUInt64BE(x >> 192n, 0);
  buf.writeBigUInt64BE((x >> 128n) & 0xffffffffffffffffn, 8);
  buf.writeBigUInt64BE((x >> 64n) & 0xffffffffffffffffn, 16);
  buf.writeBigUInt64BE(x & 0xffffffffffffffffn, 24);
  buf.writeBigUInt64BE(y >> 192n, 32);
  buf.writeBigUInt64BE((y >> 128n) & 0xffffffffffffffffn, 40);
  buf.writeBigUInt64BE((y >> 64n) & 0xffffffffffffffffn, 48);
  buf.writeBigUInt64BE(y & 0xffffffffffffffffn, 56);
  return buf;
}

/**
 * G2 affine point from snarkjs JSON [[x0,x1],[y0,y1]] → 128-byte big-endian buffer.
 * G2 coordinates in BN254 are Fp2 elements: x = x[0] + x[1]*u.
 */
function g2ToBytes128(pt: [[string, string], [string, string]]): Buffer {
  const buf = Buffer.alloc(128);
  let offset = 0;
  for (const coord of [pt[0][0], pt[0][1], pt[1][0], pt[1][1]]) {
    const v = BigInt(coord);
    buf.writeBigUInt64BE(v >> 192n, offset);
    buf.writeBigUInt64BE((v >> 128n) & 0xffffffffffffffffn, offset + 8);
    buf.writeBigUInt64BE((v >> 64n) & 0xffffffffffffffffn, offset + 16);
    buf.writeBigUInt64BE(v & 0xffffffffffffffffn, offset + 24);
    offset += 32;
  }
  return buf;
}

function bytesNVal(buf: Buffer): xdr.ScVal {
  return xdr.ScVal.scvBytes(buf);
}

async function main() {
  const vkJson = JSON.parse(fs.readFileSync(VK_PATH, "utf-8"));

  const alpha1: Buffer = g1ToBytes64(vkJson.vk_alpha_1 as [string, string]);
  const beta2: Buffer = g2ToBytes128(vkJson.vk_beta_2 as [[string, string], [string, string]]);
  const gamma2: Buffer = g2ToBytes128(vkJson.vk_gamma_2 as [[string, string], [string, string]]);
  const delta2: Buffer = g2ToBytes128(vkJson.vk_delta_2 as [[string, string], [string, string]]);

  const icBufs: Buffer[] = (vkJson.IC as [string, string][]).map(g1ToBytes64);

  // Build the Soroban VerifyingKey map
  const icVec = xdr.ScVal.scvVec(icBufs.map(bytesNVal));
  const vkMap = xdr.ScVal.scvMap([
    new xdr.ScMapEntry({ key: xdr.ScVal.scvSymbol("alpha_1"), val: bytesNVal(alpha1) }),
    new xdr.ScMapEntry({ key: xdr.ScVal.scvSymbol("beta_2"), val: bytesNVal(beta2) }),
    new xdr.ScMapEntry({ key: xdr.ScVal.scvSymbol("delta_2"), val: bytesNVal(delta2) }),
    new xdr.ScMapEntry({ key: xdr.ScVal.scvSymbol("gamma_2"), val: bytesNVal(gamma2) }),
    new xdr.ScMapEntry({ key: xdr.ScVal.scvSymbol("ic"), val: icVec }),
  ]);

  const kp = Keypair.fromSecret(SECRET_KEY);
  const server = new SorobanRpc.Server(RPC_URL);
  const account = await server.getAccount(kp.publicKey());
  const networkPassphrase = NETWORK === "mainnet" ? Networks.PUBLIC : Networks.TESTNET;

  const contract = new Contract(CONTRACT_ID);
  const adminScVal = nativeToScVal(kp.publicKey(), { type: "address" });

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase,
  })
    .addOperation(contract.call("init_vk", adminScVal, vkMap))
    .setTimeout(30)
    .build();

  const simResult = await server.simulateTransaction(tx);
  if (SorobanRpc.Api.isSimulationError(simResult)) {
    console.error("Simulation failed:", simResult.error);
    process.exit(1);
  }

  const assembled = SorobanRpc.assembleTransaction(tx, simResult).build();
  assembled.sign(kp);

  console.log("Submitting init_vk transaction...");
  const sendResult = await server.sendTransaction(assembled);
  console.log("TX hash:", sendResult.hash);

  let pollResult;
  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setTimeout(r, 3000));
    pollResult = await server.getTransaction(sendResult.hash);
    if (pollResult.status !== "NOT_FOUND") break;
  }

  if (pollResult?.status === "SUCCESS") {
    console.log("✓ Verifying key initialized on contract", CONTRACT_ID);
  } else {
    console.error("TX failed:", pollResult);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
