/**
 * Converts snarkjs Groth16 proof output (decimal BigInt strings) into the
 * byte formats expected by the Soroban claimproof contract:
 *   G1 affine point  → 64 bytes  (x || y, each 32 bytes big-endian)
 *   G2 affine point  → 128 bytes (x_c0 || x_c1 || y_c0 || y_c1, each 32 bytes BE)
 *   public signal    → 32 bytes  (field element, big-endian)
 *
 * Encoding matches init_vk.ts exactly so the VK and proofs use the same representation.
 */
import { xdr } from "@stellar/stellar-sdk";

type G1Point = [string, string];
type G2Point = [[string, string], [string, string]];

function write32BE(val: bigint, buf: Buffer, offset: number): void {
  buf.writeBigUInt64BE(val >> 192n, offset);
  buf.writeBigUInt64BE((val >> 128n) & 0xffffffffffffffffn, offset + 8);
  buf.writeBigUInt64BE((val >> 64n) & 0xffffffffffffffffn, offset + 16);
  buf.writeBigUInt64BE(val & 0xffffffffffffffffn, offset + 24);
}

/** snarkjs G1 [x, y] decimal strings → BytesN<64> */
export function g1ToBytes64(pt: G1Point): Buffer {
  const buf = Buffer.alloc(64);
  write32BE(BigInt(pt[0]), buf, 0);
  write32BE(BigInt(pt[1]), buf, 32);
  return buf;
}

/** snarkjs G2 [[x_c0,x_c1],[y_c0,y_c1]] decimal strings → BytesN<128> */
export function g2ToBytes128(pt: G2Point): Buffer {
  const buf = Buffer.alloc(128);
  let offset = 0;
  for (const coord of [pt[0][0], pt[0][1], pt[1][0], pt[1][1]]) {
    write32BE(BigInt(coord), buf, offset);
    offset += 32;
  }
  return buf;
}

/** BN254 field element (decimal string) → BytesN<32> */
export function signalToBytes32(signal: string): Buffer {
  const buf = Buffer.alloc(32);
  write32BE(BigInt(signal), buf, 0);
  return buf;
}

export interface SnarkjsProof {
  pi_a: [string, string, string];
  pi_b: [[string, string], [string, string], [string, string]];
  pi_c: [string, string, string];
}

/**
 * Build the ClaimBundle ScMap arg for the Soroban contract's `claim` function.
 *
 * ClaimBundle is a #[contracttype] struct — serialises as a sorted ScMap.
 * Keys in lexicographic order: proof_a, proof_b, proof_c, public_inputs.
 */
export function buildClaimBundle(proof: SnarkjsProof, publicSignals: string[]): xdr.ScVal {
  const proofA = g1ToBytes64([proof.pi_a[0], proof.pi_a[1]]);
  const proofB = g2ToBytes128([proof.pi_b[0], proof.pi_b[1]]);
  const proofC = g1ToBytes64([proof.pi_c[0], proof.pi_c[1]]);

  const inputsVec = xdr.ScVal.scvVec(
    publicSignals.map((s) => xdr.ScVal.scvBytes(signalToBytes32(s)))
  );

  return xdr.ScVal.scvMap([
    new xdr.ScMapEntry({ key: xdr.ScVal.scvSymbol("proof_a"), val: xdr.ScVal.scvBytes(proofA) }),
    new xdr.ScMapEntry({ key: xdr.ScVal.scvSymbol("proof_b"), val: xdr.ScVal.scvBytes(proofB) }),
    new xdr.ScMapEntry({ key: xdr.ScVal.scvSymbol("proof_c"), val: xdr.ScVal.scvBytes(proofC) }),
    new xdr.ScMapEntry({ key: xdr.ScVal.scvSymbol("public_inputs"), val: inputsVec }),
  ]);
}

/** "0x<hex>" or bare hex → BytesN<32> ScVal */
export function policyIdToScVal(onChainId: string): xdr.ScVal {
  const hex = onChainId.replace(/^0x/, "").padStart(64, "0");
  return xdr.ScVal.scvBytes(Buffer.from(hex, "hex"));
}
