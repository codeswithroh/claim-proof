//! BN254 Groth16 proof verification embedded in the ClaimProof contract.
//! Uses Stellar Protocol 25/26 native BN254 host functions (CAP-0074/0075).
//!
//! Verification equation:
//!   e(−A, B) · e(α, β) · e(vk_x, γ) · e(C, δ) = 1
//! where  vk_x = IC[0] + Σ IC[i+1] · public_input[i]

use soroban_sdk::{
    contracttype,
    crypto::bn254::{Bn254Fr, Bn254G1Affine, Bn254G2Affine},
    symbol_short, vec, BytesN, Env, Vec, U256,
};

// ── Types stored in contract instance storage ─────────────────────────────────

#[contracttype]
#[derive(Clone)]
pub struct VerifyingKey {
    pub alpha_1: BytesN<64>,
    pub beta_2: BytesN<128>,
    pub gamma_2: BytesN<128>,
    pub delta_2: BytesN<128>,
    /// IC[0], IC[1], ... — number of IC entries = number of public inputs + 1
    pub ic: Vec<BytesN<64>>,
}

#[contracttype]
#[derive(Clone)]
pub struct Proof {
    pub a: BytesN<64>,
    pub b: BytesN<128>,
    pub c: BytesN<64>,
}

// ── Storage ───────────────────────────────────────────────────────────────────

pub fn store_vk(env: &Env, vk: VerifyingKey) {
    env.storage().instance().set(&symbol_short!("VK"), &vk);
}

pub fn load_vk(env: &Env) -> VerifyingKey {
    env.storage()
        .instance()
        .get(&symbol_short!("VK"))
        .expect("VK not initialized")
}

// ── Verification ──────────────────────────────────────────────────────────────

/// Verify a Groth16 proof against the stored verification key.
/// `public_inputs`: 32-byte BE field scalars in circuit order.
pub fn verify_proof(env: &Env, proof: &Proof, public_inputs: &Vec<BytesN<32>>) -> bool {
    let vk = load_vk(env);
    let bn254 = env.crypto().bn254();

    // 1. vk_x = IC[0] * 1 + IC[1] * input[0] + ... via MSM
    let ic_len = vk.ic.len();
    let input_len = public_inputs.len();
    assert!(
        ic_len == input_len + 1,
        "public_inputs length mismatch"
    );

    let mut pts: Vec<Bn254G1Affine> = vec![env];
    let mut scalars: Vec<Bn254Fr> = vec![env];

    pts.push_back(g1_from_bytes(env, vk.ic.get(0).expect("IC[0]")));
    scalars.push_back(fr_one(env));

    for i in 0..input_len {
        pts.push_back(g1_from_bytes(
            env,
            vk.ic.get(i + 1).expect("IC[i+1]"),
        ));
        scalars.push_back(fr_from_bytes32(
            env,
            public_inputs.get(i).expect("input[i]"),
        ));
    }

    let vk_x = bn254.g1_msm(pts, scalars);

    // 2. Negate proof.A
    let neg_a = -g1_from_bytes(env, proof.a.clone());

    // 3. Pairing check: e(−A,B) · e(α,β) · e(vk_x,γ) · e(C,δ) = 1
    let g1s = vec![
        env,
        neg_a,
        g1_from_bytes(env, vk.alpha_1),
        vk_x,
        g1_from_bytes(env, proof.c.clone()),
    ];
    let g2s = vec![
        env,
        g2_from_bytes(env, proof.b.clone()),
        g2_from_bytes(env, vk.beta_2),
        g2_from_bytes(env, vk.gamma_2),
        g2_from_bytes(env, vk.delta_2),
    ];

    bn254.pairing_check(g1s, g2s)
}

// ── Helpers ───────────────────────────────────────────────────────────────────

fn g1_from_bytes(env: &Env, b: BytesN<64>) -> Bn254G1Affine {
    let _ = env;
    Bn254G1Affine::from_bytes(b)
}

fn g2_from_bytes(env: &Env, b: BytesN<128>) -> Bn254G2Affine {
    let _ = env;
    Bn254G2Affine::from_bytes(b)
}

fn fr_one(env: &Env) -> Bn254Fr {
    let mut arr = [0u8; 32];
    arr[31] = 1;
    fr_from_bytes32(env, BytesN::<32>::from_array(env, &arr))
}

fn fr_from_bytes32(env: &Env, b: BytesN<32>) -> Bn254Fr {
    let u = U256::from_be_bytes(env, &b.into());
    Bn254Fr::from_u256(u)
}
