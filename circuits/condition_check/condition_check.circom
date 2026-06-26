pragma circom 2.1.4;

include "../node_modules/circomlib/circuits/comparators.circom";
include "../node_modules/circomlib/circuits/poseidon.circom";
include "../node_modules/circomlib/circuits/bitify.circom";

/*
 * ClaimProof — Parametric Insurance Condition Circuit
 *
 * Proves: "I know an oracle_value such that:
 *   - oracle_value ≤ threshold  (for LTE / price-drop protection), OR
 *   - oracle_value ≥ threshold  (for GTE / yield/rainfall protection)
 *   - bound to a specific policy_id
 *   - with a salt for oracle commitment (anti-replay)"
 *
 * Public inputs  : threshold, policy_id, condition_type (0=LTE, 1=GTE)
 * Private inputs : oracle_value, salt
 * Public outputs : triggered (1 = condition met), oracle_commitment
 *
 * The oracle_commitment = Poseidon(oracle_value, salt) lets the insurer
 * publish the oracle reading as a commitment on-chain, and the prover
 * shows they know the pre-image — without revealing the exact value.
 */
template ConditionCheck() {
    // ── Private inputs ────────────────────────────────────────────────────────
    signal input oracle_value;   // The oracle reading (e.g. price * 1e8)
    signal input salt;           // Random nonce for oracle commitment

    // ── Public inputs ─────────────────────────────────────────────────────────
    signal input threshold;      // Policy trigger level
    signal input policy_id;      // Unique policy identifier (field element)
    signal input condition_type; // 0 = LTE (price drop), 1 = GTE (price rise)

    // ── Outputs (also public) ─────────────────────────────────────────────────
    signal output triggered;         // 1 if condition met, 0 otherwise
    signal output oracle_commitment; // Poseidon(oracle_value, salt)

    // ── Oracle commitment ─────────────────────────────────────────────────────
    // Commits the oracle value without revealing it on-chain.
    component commit = Poseidon(2);
    commit.inputs[0] <== oracle_value;
    commit.inputs[1] <== salt;
    oracle_commitment <== commit.out;

    // ── Range check ───────────────────────────────────────────────────────────
    // Ensure oracle_value and threshold fit in 64 bits (prices are ≤ 1e19).
    component oracle_bits = Num2Bits(64);
    oracle_bits.in <== oracle_value;

    component threshold_bits = Num2Bits(64);
    threshold_bits.in <== threshold;

    // ── LTE: oracle_value ≤ threshold ─────────────────────────────────────────
    // LessEqThan(n) checks a <= b for n-bit numbers
    component lte = LessEqThan(64);
    lte.in[0] <== oracle_value;
    lte.in[1] <== threshold;

    // ── GTE: oracle_value ≥ threshold ─────────────────────────────────────────
    component gte = GreaterEqThan(64);
    gte.in[0] <== oracle_value;
    gte.in[1] <== threshold;

    // ── Condition mux ─────────────────────────────────────────────────────────
    // condition_type must be 0 or 1
    condition_type * (1 - condition_type) === 0;

    // triggered = (1 - condition_type) * lte.out + condition_type * gte.out
    signal lte_part <== (1 - condition_type) * lte.out;
    signal gte_part <== condition_type * gte.out;
    triggered <== lte_part + gte_part;

    // ── Policy binding ────────────────────────────────────────────────────────
    // Force policy_id into the constraint system so the proof is bound to
    // this specific policy and cannot be replayed on another.
    signal policy_bind <== policy_id * policy_id;
    _ <== policy_bind;
}

component main {
    public [threshold, policy_id, condition_type]
} = ConditionCheck();
