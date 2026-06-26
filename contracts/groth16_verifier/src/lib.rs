//! Standalone BN254 Groth16 verifier contract for Stellar Soroban.
//! Protocol 25/26 CAP-0074/0075 host functions.

#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype,
    crypto::bn254::{Bn254Fr, Bn254G1Affine, Bn254G2Affine},
    symbol_short, vec, BytesN, Env, Vec, U256,
};

#[contracttype]
#[derive(Clone)]
pub struct VerifyingKey {
    pub alpha_1: BytesN<64>,
    pub beta_2: BytesN<128>,
    pub gamma_2: BytesN<128>,
    pub delta_2: BytesN<128>,
    pub ic: Vec<BytesN<64>>,
}

#[contracttype]
#[derive(Clone)]
pub struct Proof {
    pub a: BytesN<64>,
    pub b: BytesN<128>,
    pub c: BytesN<64>,
}

#[contract]
pub struct Groth16Verifier;

#[contractimpl]
impl Groth16Verifier {
    pub fn initialize(env: Env, vk: VerifyingKey) {
        env.storage().instance().set(&symbol_short!("VK"), &vk);
    }

    pub fn verify(env: Env, proof: Proof, public_inputs: Vec<BytesN<32>>) -> bool {
        let vk: VerifyingKey = env
            .storage()
            .instance()
            .get(&symbol_short!("VK"))
            .expect("VK not set");

        let bn254 = env.crypto().bn254();
        let ic_len = vk.ic.len();
        let input_len = public_inputs.len();
        assert!(ic_len == input_len + 1, "IC/input length mismatch");

        // vk_x = IC[0] + sum(IC[i+1] * input[i]) via MSM
        let mut pts: Vec<Bn254G1Affine> = vec![&env];
        let mut scalars: Vec<Bn254Fr> = vec![&env];

        pts.push_back(Bn254G1Affine::from_bytes(vk.ic.get(0).expect("IC[0]")));
        scalars.push_back(fr_one(&env));

        for i in 0..input_len {
            pts.push_back(Bn254G1Affine::from_bytes(
                vk.ic.get(i + 1).expect("IC point"),
            ));
            scalars.push_back(fr_from_b32(
                &env,
                public_inputs.get(i).expect("input"),
            ));
        }

        let vk_x = bn254.g1_msm(pts, scalars);
        let neg_a = -Bn254G1Affine::from_bytes(proof.a);

        let g1s = vec![
            &env,
            neg_a,
            Bn254G1Affine::from_bytes(vk.alpha_1),
            vk_x,
            Bn254G1Affine::from_bytes(proof.c),
        ];
        let g2s = vec![
            &env,
            Bn254G2Affine::from_bytes(proof.b),
            Bn254G2Affine::from_bytes(vk.beta_2),
            Bn254G2Affine::from_bytes(vk.gamma_2),
            Bn254G2Affine::from_bytes(vk.delta_2),
        ];

        bn254.pairing_check(g1s, g2s)
    }

    pub fn get_vk(env: Env) -> VerifyingKey {
        env.storage()
            .instance()
            .get(&symbol_short!("VK"))
            .expect("VK not set")
    }
}

fn fr_one(env: &Env) -> Bn254Fr {
    let mut arr = [0u8; 32];
    arr[31] = 1;
    fr_from_b32(env, BytesN::<32>::from_array(env, &arr))
}

fn fr_from_b32(env: &Env, b: BytesN<32>) -> Bn254Fr {
    Bn254Fr::from_u256(U256::from_be_bytes(env, &b.into()))
}
