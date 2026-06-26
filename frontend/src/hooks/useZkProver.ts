/**
 * ZK prover hook — generates Groth16 proofs in the browser via snarkjs.
 * The WASM circuit and zkey are loaded from /circuits/ (served as static assets).
 */
import { useState, useCallback } from "react";
import type { ZkProof } from "../types";

export interface ProofInput {
  oracleValue: bigint;   // private: the oracle reading
  salt: bigint;          // private: random nonce
  threshold: bigint;     // public: policy trigger
  policyId: bigint;      // public: field-reduced policy ID
  conditionType: 0 | 1;  // public: 0=LTE, 1=GTE
}

export interface ProofResult {
  proof: ZkProof;
  publicSignals: string[];
}

type ProverState =
  | { status: "idle" }
  | { status: "generating"; progress: string }
  | { status: "done"; result: ProofResult }
  | { status: "error"; error: string };

export function useZkProver() {
  const [state, setState] = useState<ProverState>({ status: "idle" });

  const generateProof = useCallback(async (input: ProofInput) => {
    setState({ status: "generating", progress: "Loading circuit WASM..." });

    try {
      // Dynamic import snarkjs to keep initial bundle small
      const snarkjs = await import("snarkjs");

      setState({ status: "generating", progress: "Computing witness..." });

      const circuitInputs = {
        oracle_value: input.oracleValue.toString(),
        salt: input.salt.toString(),
        threshold: input.threshold.toString(),
        policy_id: input.policyId.toString(),
        condition_type: input.conditionType.toString(),
      };

      // WASM and zkey served from public/circuits/
      const wasmPath = "/circuits/condition_check.wasm";
      const zkeyPath = "/circuits/condition_check_final.zkey";

      setState({ status: "generating", progress: "Generating ZK proof (this takes ~2s)..." });

      const { proof, publicSignals } = await snarkjs.groth16.fullProve(
        circuitInputs,
        wasmPath,
        zkeyPath
      );

      setState({ status: "done", result: { proof: proof as ZkProof, publicSignals } });
      return { proof: proof as ZkProof, publicSignals };
    } catch (err) {
      const raw = String(err);
      // Translate low-level errors into language a user can act on
      let msg = "Proof generation failed. Please try again.";
      if (raw.includes("magic word") || raw.includes("WebAssembly.compile") || raw.includes("fetch")) {
        msg = "Could not load the ZK circuit. Check your connection and reload the page.";
      } else if (raw.includes("Cannot read") || raw.includes("undefined") || raw.includes("null")) {
        msg = "Invalid input. Make sure the oracle value is a positive number.";
      } else if (raw.includes("timeout") || raw.includes("Timeout")) {
        msg = "Proof generation timed out. Your device may be too slow for in-browser proving.";
      } else if (raw.includes("witness") || raw.includes("constraint")) {
        msg = "The oracle value does not satisfy the circuit constraints. Verify your input and try again.";
      }
      setState({ status: "error", error: msg });
      throw new Error(msg);
    }
  }, []);

  const reset = useCallback(() => setState({ status: "idle" }), []);

  return { state, generateProof, reset };
}
