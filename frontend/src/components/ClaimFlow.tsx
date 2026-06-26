import React, { useState } from "react";
import { Lock, Cpu, CheckCircle2, ArrowRight, AlertCircle, Loader2, RotateCcw } from "lucide-react";
import { useZkProver } from "../hooks/useZkProver";
import type { Policy } from "../types";

interface Props {
  policy: Policy;
  onClaimed?: () => void;
}

const ORACLE_LABELS: Record<string, string> = {
  price_btc: "BTC/USD",
  price_eth: "ETH/USD",
  price_xlm: "XLM/USD",
};

export default function ClaimFlow({ policy, onClaimed }: Props) {
  const { state, generateProof, reset } = useZkProver();
  const [oracleValue, setOracleValue] = useState("");
  const [error, setError] = useState("");
  const [claimState, setClaimState] = useState<"idle" | "proven" | "submitting" | "done">("idle");
  const [claimTxHash, setClaimTxHash] = useState("");

  const thresholdUsd = (Number(policy.threshold) / 1e6).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });

  const conditionLabel =
    policy.condition === "lte"
      ? `price falls below ${thresholdUsd}`
      : `price rises above ${thresholdUsd}`;

  const handleGenerateProof = async () => {
    setError("");
    try {
      const oracleScaled = BigInt(Math.round(parseFloat(oracleValue) * 1_000_000));
      const threshold = BigInt(policy.threshold);
      const idBytes = Uint8Array.from(
        (policy.onChainId.replace("0x", "").match(/.{2}/g) ?? []).map((h: string) => parseInt(h, 16))
      );
      idBytes[0] &= 0x1f;
      const policyIdBigInt = idBytes.reduce((acc, b) => (acc << 8n) | BigInt(b), 0n);
      const salt = BigInt(Math.floor(Math.random() * 1e15));

      const result = await generateProof({
        oracleValue: oracleScaled,
        salt,
        threshold,
        policyId: policyIdBigInt,
        conditionType: policy.condition === "lte" ? 0 : 1,
      });

      // publicSignals[0] = triggered; 0 means the condition was not met
      if (result.publicSignals[0] !== "1") {
        reset();
        setError(
          policy.condition === "lte"
            ? `Condition not met. The value $${parseFloat(oracleValue).toLocaleString()} is above the threshold ${thresholdUsd}. A claim is only valid when the condition is triggered.`
            : `Condition not met. The value $${parseFloat(oracleValue).toLocaleString()} is below the threshold ${thresholdUsd}. A claim is only valid when the condition is triggered.`
        );
        return;
      }

      setClaimState("proven");
    } catch (err) {
      setError(String(err));
    }
  };

  const handleSubmitClaim = async () => {
    if (state.status !== "done") return;
    setClaimState("submitting");
    setError("");
    try {
      const res = await fetch(`/api/policies/${policy.onChainId}/claim`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proof: state.result.proof,
          publicSignals: state.result.publicSignals,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setClaimTxHash(data.txHash ?? "");
      setClaimState("done");
      onClaimed?.();
    } catch (err) {
      setError(String(err));
      setClaimState("proven");
    }
  };

  if (claimState === "done") {
    return (
      <div className="text-center py-10">
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ background: "rgba(45,125,70,0.1)" }}
        >
          <CheckCircle2 className="w-7 h-7" style={{ color: "#2d7d46" }} />
        </div>
        <h3 className="font-display text-2xl font-light mb-2" style={{ color: "#141414" }}>
          Claim Successful
        </h3>
        <p className="text-sm mb-4" style={{ color: "#878680" }}>
          {(Number(policy.payoutAmount) / 1e7).toLocaleString()} USDC transferred to your beneficiary.
          Verified on Stellar Soroban via Groth16 proof.
        </p>
        {claimTxHash && (
          <div
            className="rounded-lg p-3 text-left"
            style={{ background: "#f5f4ef", border: "1px solid #e5e4df" }}
          >
            <div className="text-xs font-medium tracking-wider uppercase mb-1" style={{ color: "#878680" }}>
              Transaction
            </div>
            <div className="font-mono text-xs break-all" style={{ color: "#878680" }}>
              {claimTxHash}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Policy summary */}
      <div className="rounded-lg p-4" style={{ background: "#f5f4ef", border: "1px solid #e5e4df" }}>
        <div className="text-xs font-medium tracking-wider uppercase mb-1" style={{ color: "#878680" }}>
          Policy Condition
        </div>
        <div className="text-sm" style={{ color: "#141414" }}>
          Pays{" "}
          <span className="font-medium">
            {(Number(policy.payoutAmount) / 1e7).toFixed(2)} USDC
          </span>{" "}
          when{" "}
          <span className="font-medium">
            {ORACLE_LABELS[policy.oracleType] ?? policy.oracleType}
          </span>{" "}
          {conditionLabel}
        </div>
      </div>

      {/* Step 1 */}
      <div>
        <label className="block text-xs font-medium tracking-wider uppercase mb-2" style={{ color: "#878680" }}>
          Step 1 — Enter Oracle Value (USD)
        </label>
        <p className="text-xs mb-3" style={{ color: "#b0afa9" }}>
          The exact value stays private. Only the ZK proof is submitted on-chain.
        </p>
        <div className="relative">
          <span
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm"
            style={{ color: "#878680" }}
          >
            $
          </span>
          <input
            type="number"
            value={oracleValue}
            onChange={(e) => setOracleValue(e.target.value)}
            placeholder="e.g. 45000"
            disabled={state.status === "generating" || claimState === "proven"}
            className="w-full pl-8 pr-4 py-3 rounded-lg text-sm transition-colors"
            style={{
              background: "#ffffff",
              border: "1px solid #e5e4df",
              color: "#141414",
              outline: "none",
            }}
            onFocus={(e) => (e.target.style.borderColor = "#141414")}
            onBlur={(e) => (e.target.style.borderColor = "#e5e4df")}
          />
        </div>
      </div>

      {/* Step 2: Generate */}
      {claimState === "idle" && (
        <button
          onClick={handleGenerateProof}
          disabled={!oracleValue || state.status === "generating"}
          className="w-full py-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-opacity"
          style={{
            background: "#141414",
            color: "#ffffff",
            opacity: !oracleValue || state.status === "generating" ? 0.4 : 1,
          }}
        >
          {state.status === "generating" ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {(state as { status: "generating"; progress: string }).progress}
            </>
          ) : (
            <>
              <Cpu className="w-4 h-4" />
              Step 2 — Generate ZK Proof
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      )}

      {/* Proof result + submit */}
      {state.status === "done" && (claimState === "proven" || claimState === "submitting") && (
        <>
          <div
            className="rounded-lg p-4"
            style={{ background: "rgba(45,125,70,0.05)", border: "1px solid rgba(45,125,70,0.2)" }}
          >
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-4 h-4" style={{ color: "#2d7d46" }} />
              <span className="text-sm font-medium" style={{ color: "#2d7d46" }}>
                Proof generated. Condition verified.
              </span>
            </div>
            <p className="text-xs mb-3" style={{ color: "#878680" }}>
              The proof confirms the oracle condition was met without revealing the exact value on-chain.
            </p>
            <div
              className="rounded p-2 font-mono text-xs overflow-hidden"
              style={{ background: "#f5f4ef", color: "#b0afa9" }}
            >
              Public signals: {state.result.publicSignals.slice(0, 3).join(", ")}...
            </div>
          </div>

          <button
            onClick={handleSubmitClaim}
            disabled={claimState === "submitting"}
            className="w-full py-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-opacity"
            style={{
              background: "#141414",
              color: "#ffffff",
              opacity: claimState === "submitting" ? 0.6 : 1,
            }}
          >
            {claimState === "submitting" ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Submitting proof to Stellar...
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                Step 3 — Submit Proof and Claim Payout
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </>
      )}

      {/* Errors */}
      {(state.status === "error" || error) && (
        <div
          className="rounded-lg p-3 flex items-start gap-2 text-sm"
          style={{ background: "rgba(155,28,28,0.05)", border: "1px solid rgba(155,28,28,0.2)", color: "#9b1c1c" }}
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>
            {state.status === "error"
              ? (state as { status: "error"; error: string }).error
              : error}
          </span>
          <button onClick={reset} className="ml-auto flex-shrink-0">
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
