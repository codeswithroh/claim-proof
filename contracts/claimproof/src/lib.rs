//! ClaimProof — ZK-triggered parametric insurance on Stellar Soroban.
//!
//! Flow:
//!  1. Admin calls `init_vk` with the Groth16 verification key for the circuit.
//!  2. User calls `create_policy` — deposits payout collateral.
//!  3. When oracle condition triggers, user generates a ZK proof in-browser (snarkjs).
//!  4. User calls `claim` with the proof — contract verifies on-chain and pays out.

#![no_std]

mod verifier;

use soroban_sdk::{
    contract, contractimpl, contracttype,
    symbol_short,
    token::Client as TokenClient,
    Address, Bytes, BytesN, Env, Vec,
};

pub use verifier::{Proof, VerifyingKey};

// ── Domain types ──────────────────────────────────────────────────────────────

#[contracttype]
#[derive(Clone, PartialEq)]
pub enum Condition {
    Lte, // payout when oracle_value ≤ threshold (price drop protection)
    Gte, // payout when oracle_value ≥ threshold (yield / rainfall protection)
}

#[contracttype]
#[derive(Clone, PartialEq)]
pub enum PolicyStatus {
    Active,
    Claimed,
    Expired,
    Cancelled,
}

#[contracttype]
#[derive(Clone)]
pub struct Policy {
    pub id: BytesN<32>,
    pub insured: Address,
    pub beneficiary: Address,
    pub token: Address,
    pub payout_amount: i128,
    pub threshold: u64,
    pub condition: Condition,
    pub expiry_ledger: u32,
    pub status: PolicyStatus,
}

/// Bundle passed to `claim`.
#[contracttype]
#[derive(Clone)]
pub struct ClaimBundle {
    pub proof_a: BytesN<64>,
    pub proof_b: BytesN<128>,
    pub proof_c: BytesN<64>,
    /// Public signals: [threshold_be32, policy_id_field_be32, condition_type_be32]
    pub public_inputs: Vec<BytesN<32>>,
}

// ── Contract ──────────────────────────────────────────────────────────────────

#[contract]
pub struct ClaimProof;

#[contractimpl]
impl ClaimProof {
    // ── Admin ─────────────────────────────────────────────────────────────────

    /// Initialize: store the Groth16 verification key for the condition_check circuit.
    pub fn init_vk(env: Env, admin: Address, vk: VerifyingKey) {
        admin.require_auth();
        env.storage().instance().set(&symbol_short!("ADMIN"), &admin);
        env.storage().instance().set(&symbol_short!("CNT"), &0u32);
        verifier::store_vk(&env, vk);
    }

    // ── Policy lifecycle ──────────────────────────────────────────────────────

    /// Create a policy. The insured deposits `payout_amount` of `token` as
    /// collateral. Returns the 32-byte policy ID.
    pub fn create_policy(
        env: Env,
        insured: Address,
        beneficiary: Address,
        token: Address,
        payout_amount: i128,
        threshold: u64,
        condition: Condition,
        expiry_ledger: u32,
    ) -> BytesN<32> {
        insured.require_auth();
        assert!(payout_amount > 0, "payout > 0");
        assert!(expiry_ledger > env.ledger().sequence(), "expiry in past");

        // Pull collateral from insured
        TokenClient::new(&env, &token).transfer(
            &insured,
            &env.current_contract_address(),
            &payout_amount,
        );

        let policy_id = gen_policy_id(&env);
        let policy = Policy {
            id: policy_id.clone(),
            insured,
            beneficiary,
            token,
            payout_amount,
            threshold,
            condition,
            expiry_ledger,
            status: PolicyStatus::Active,
        };

        env.storage()
            .persistent()
            .set(&(symbol_short!("P"), policy_id.clone()), &policy);

        env.events().publish(
            (symbol_short!("created"),),
            (policy_id.clone(), threshold, payout_amount),
        );

        policy_id
    }

    /// Submit a ZK proof to claim a payout.
    ///
    /// The circuit's public inputs must be:
    ///   [0] threshold encoded as 32-byte BE
    ///   [1] policy_id field-reduced to BN254 scalar, encoded as 32-byte BE
    ///   [2] condition_type: 0=LTE, 1=GTE, encoded as 32-byte BE
    pub fn claim(env: Env, policy_id: BytesN<32>, bundle: ClaimBundle) -> bool {
        let key = (symbol_short!("P"), policy_id.clone());
        let mut policy: Policy = env
            .storage()
            .persistent()
            .get(&key)
            .expect("policy not found");

        assert!(policy.status == PolicyStatus::Active, "not active");
        assert!(
            env.ledger().sequence() <= policy.expiry_ledger,
            "expired"
        );
        // Circuit public signals order (matches snarkjs output order):
        //   [0] triggered         — 1 if condition met, 0 otherwise (OUTPUT)
        //   [1] oracle_commitment — Poseidon(oracle_value, salt)     (OUTPUT)
        //   [2] threshold         — policy trigger level             (INPUT)
        //   [3] policy_id         — field-reduced policy identifier  (INPUT)
        //   [4] condition_type    — 0=LTE, 1=GTE                     (INPUT)
        assert!(bundle.public_inputs.len() >= 5, "need 5 public inputs");

        // ── Verify condition was actually triggered ────────────────────────────
        let triggered_in: BytesN<32> = bundle.public_inputs.get(0).expect("i0");
        assert_eq!(
            triggered_in,
            u64_to_b32(&env, 1u64),
            "condition not triggered"
        );

        // ── Validate public inputs match policy ───────────────────────────────
        let threshold_in: BytesN<32> = bundle.public_inputs.get(2).expect("i2");
        assert_eq!(
            threshold_in,
            u64_to_b32(&env, policy.threshold),
            "threshold mismatch"
        );

        let pid_in: BytesN<32> = bundle.public_inputs.get(3).expect("i3");
        assert_eq!(
            pid_in,
            field_reduce(&env, &policy_id),
            "policy_id mismatch"
        );

        let cond_in: BytesN<32> = bundle.public_inputs.get(4).expect("i4");
        let cond_val: u64 = match policy.condition {
            Condition::Lte => 0,
            Condition::Gte => 1,
        };
        assert_eq!(cond_in, u64_to_b32(&env, cond_val), "condition mismatch");

        // ── Verify ZK proof on-chain ──────────────────────────────────────────
        let proof = Proof {
            a: bundle.proof_a,
            b: bundle.proof_b,
            c: bundle.proof_c,
        };
        assert!(
            verifier::verify_proof(&env, &proof, &bundle.public_inputs),
            "invalid ZK proof"
        );

        // ── Mark claimed and transfer payout ──────────────────────────────────
        policy.status = PolicyStatus::Claimed;
        env.storage().persistent().set(&key, &policy);

        TokenClient::new(&env, &policy.token).transfer(
            &env.current_contract_address(),
            &policy.beneficiary,
            &policy.payout_amount,
        );

        env.events().publish(
            (symbol_short!("claimed"),),
            (policy_id, policy.payout_amount),
        );

        true
    }

    /// Cancel an active policy (insured only). Returns collateral.
    pub fn cancel(env: Env, policy_id: BytesN<32>) {
        let key = (symbol_short!("P"), policy_id.clone());
        let mut policy: Policy = env
            .storage()
            .persistent()
            .get(&key)
            .expect("policy not found");

        policy.insured.require_auth();
        assert!(policy.status == PolicyStatus::Active, "not active");

        policy.status = PolicyStatus::Cancelled;
        env.storage().persistent().set(&key, &policy);

        TokenClient::new(&env, &policy.token).transfer(
            &env.current_contract_address(),
            &policy.insured,
            &policy.payout_amount,
        );
    }

    /// Mark an expired policy and return collateral (permissionless).
    pub fn expire(env: Env, policy_id: BytesN<32>) {
        let key = (symbol_short!("P"), policy_id.clone());
        let mut policy: Policy = env
            .storage()
            .persistent()
            .get(&key)
            .expect("policy not found");

        assert!(
            env.ledger().sequence() > policy.expiry_ledger,
            "not yet expired"
        );
        assert!(policy.status == PolicyStatus::Active, "resolved");

        policy.status = PolicyStatus::Expired;
        env.storage().persistent().set(&key, &policy);

        TokenClient::new(&env, &policy.token).transfer(
            &env.current_contract_address(),
            &policy.insured,
            &policy.payout_amount,
        );
    }

    // ── Views ─────────────────────────────────────────────────────────────────

    pub fn get_policy(env: Env, policy_id: BytesN<32>) -> Policy {
        env.storage()
            .persistent()
            .get(&(symbol_short!("P"), policy_id))
            .expect("not found")
    }

    pub fn get_vk(env: Env) -> VerifyingKey {
        verifier::load_vk(&env)
    }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

fn u64_to_b32(env: &Env, val: u64) -> BytesN<32> {
    let mut arr = [0u8; 32];
    arr[24..32].copy_from_slice(&val.to_be_bytes());
    BytesN::<32>::from_array(env, &arr)
}

/// Reduce a 32-byte ID into the BN254 scalar field by clearing the top 3 bits.
fn field_reduce(env: &Env, id: &BytesN<32>) -> BytesN<32> {
    let mut arr = id.to_array();
    arr[0] &= 0x1f;
    BytesN::<32>::from_array(env, &arr)
}

fn gen_policy_id(env: &Env) -> BytesN<32> {
    let count: u32 = env
        .storage()
        .instance()
        .get(&symbol_short!("CNT"))
        .unwrap_or(0u32);
    env.storage()
        .instance()
        .set(&symbol_short!("CNT"), &(count + 1));

    // Must be deterministic at simulation AND execution time so the footprint key
    // computed during simulation matches the key written during execution.
    // Using only the counter (never ledger.sequence / ledger.timestamp — those
    // change between simulation and the ledger the TX lands on, which would make
    // the persistent-storage key differ and cause a footprint-miss trap).
    let mut pre = Bytes::new(env);
    pre.append(&Bytes::from_slice(env, b"cp_policy:"));
    pre.append(&Bytes::from_slice(env, &count.to_be_bytes()));

    env.crypto().sha256(&pre).into()
}
