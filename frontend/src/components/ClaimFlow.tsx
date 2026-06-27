import React, { useState, useEffect } from "react";
import { Lock, Cpu, CheckCircle2, ArrowRight, AlertCircle, Loader2, RotateCcw, TrendingDown, TrendingUp } from "lucide-react";
import { useZkProver } from "../hooks/useZkProver";
import { useOracle } from "../hooks/useOracle";
import type { Policy } from "../types";

const C = {
  bg:     "#0d0b06",
  card:   "#1a1610",
  card2:  "#221e14",
  text:   "#f0e6c8",
  gold:   "#c9a84c",
  muted:  "#a89060",
  faint:  "#6e5c3a",
  border: "rgba(201,168,76,0.22)",
};

interface Props { policy: Policy; onClaimed?: () => void; }

const ORACLE_LABELS: Record<string, string> = {
  price_btc: "BTC/USD",
  price_eth: "ETH/USD",
  price_xlm: "XLM/USD",
};

export default function ClaimFlow({ policy, onClaimed }: Props) {
  const { state, generateProof, reset } = useZkProver();
  const { prices } = useOracle(30_000);
  const [oracleValue, setOracleValue] = useState("");
  const [error, setError]             = useState("");
  const [claimState, setClaimState]   = useState<"idle" | "proven" | "submitting" | "done">("idle");
  const [claimTxHash, setClaimTxHash] = useState("");

  useEffect(() => {
    if (!prices || oracleValue) return;
    const raw = prices[policy.oracleType as keyof typeof prices]?.raw;
    if (!raw) return;
    setOracleValue((Number(raw) / 1_000_000).toFixed(2));
  }, [prices, policy.oracleType]);

  const liveRaw          = prices?.[policy.oracleType as keyof typeof prices]?.raw;
  const livePrice        = liveRaw ? Number(liveRaw) / 1_000_000 : null;
  const threshold        = Number(policy.threshold) / 1_000_000;
  const liveConditionMet = livePrice !== null &&
    (policy.condition === "lte" ? livePrice <= threshold : livePrice >= threshold);

  const thresholdUsd   = (Number(policy.threshold) / 1e6).toLocaleString("en-US", { style: "currency", currency: "USD" });
  const conditionLabel = policy.condition === "lte"
    ? `price falls below ${thresholdUsd}`
    : `price rises above ${thresholdUsd}`;

  const handleGenerateProof = async () => {
    setError("");
    try {
      const oracleScaled = BigInt(Math.round(parseFloat(oracleValue) * 1_000_000));
      const thr          = BigInt(policy.threshold);
      const idBytes      = Uint8Array.from(
        (policy.onChainId.replace("0x", "").match(/.{2}/g) ?? []).map((h: string) => parseInt(h, 16))
      );
      idBytes[0] &= 0x1f;
      const policyIdBigInt = idBytes.reduce((acc, b) => (acc << 8n) | BigInt(b), 0n);
      const salt           = BigInt(Math.floor(Math.random() * 1e15));

      const result = await generateProof({
        oracleValue: oracleScaled, salt, threshold: thr,
        policyId: policyIdBigInt, conditionType: policy.condition === "lte" ? 0 : 1,
      });

      if (result.publicSignals[0] !== "1") {
        reset();
        setError(policy.condition === "lte"
          ? `Condition not met. The value $${parseFloat(oracleValue).toLocaleString()} is above the threshold ${thresholdUsd}.`
          : `Condition not met. The value $${parseFloat(oracleValue).toLocaleString()} is below the threshold ${thresholdUsd}.`);
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
        body: JSON.stringify({ proof: state.result.proof, publicSignals: state.result.publicSignals }),
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

  // ── Done ──────────────────────────────────────────────────────────────────
  if (claimState === "done") {
    return (
      <div style={{ textAlign: "center", padding: "32px 0" }}>
        <div style={{ width: 52, height: 52, border: `1px solid rgba(201,168,76,0.4)`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
          <CheckCircle2 size={24} style={{ color: C.gold }} />
        </div>
        <h3 className="font-display" style={{ fontSize: 22, fontWeight: 700, color: C.text, marginBottom: 8 }}>Claim Successful</h3>
        <p style={{ fontFamily: "sans-serif", fontSize: 13, color: C.muted, lineHeight: 1.7, marginBottom: 20 }}>
          {(Number(policy.payoutAmount) / 1e7).toLocaleString()} USDC transferred to your beneficiary.
          Verified on Stellar Soroban via Groth16 proof.
        </p>
        {claimTxHash && (
          <div style={{ padding: "12px 16px", background: C.card2, border: `1px solid ${C.border}`, textAlign: "left" }}>
            <div style={{ fontFamily: "sans-serif", fontSize: 9, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: C.faint, marginBottom: 6 }}>Transaction</div>
            <div style={{ fontFamily: "monospace", fontSize: 11, color: C.muted, wordBreak: "break-all" }}>{claimTxHash}</div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Policy summary */}
      <div style={{ padding: "14px 16px", background: C.card2, border: `1px solid ${C.border}` }}>
        <div style={{ fontFamily: "sans-serif", fontSize: 9, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: C.faint, marginBottom: 6 }}>Policy Condition</div>
        <div style={{ fontFamily: "sans-serif", fontSize: 13, color: C.text }}>
          Pays <span style={{ fontWeight: 600, color: C.gold }}>{(Number(policy.payoutAmount) / 1e7).toFixed(2)} USDC</span>{" "}
          when <span style={{ fontWeight: 600 }}>{ORACLE_LABELS[policy.oracleType] ?? policy.oracleType}</span> {conditionLabel}
        </div>
      </div>

      {/* Live price status */}
      {livePrice !== null && (
        <div style={{
          padding: "12px 16px", display: "flex", alignItems: "center", gap: 10,
          background: liveConditionMet ? "rgba(110,231,183,0.05)" : C.card2,
          border: liveConditionMet ? "1px solid rgba(110,231,183,0.25)" : `1px solid ${C.border}`,
        }}>
          {liveConditionMet
            ? <TrendingDown size={14} style={{ color: "#6ee7b7", flexShrink: 0 }} />
            : <TrendingUp   size={14} style={{ color: C.faint,   flexShrink: 0 }} />}
          <div style={{ fontFamily: "sans-serif", fontSize: 13 }}>
            <span style={{ fontWeight: 600, color: liveConditionMet ? "#6ee7b7" : C.text }}>
              Live {ORACLE_LABELS[policy.oracleType] ?? policy.oracleType}: ${livePrice.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            {" — "}
            <span style={{ color: liveConditionMet ? "#6ee7b7" : "#fca5a5" }}>
              {liveConditionMet ? "Condition triggered. Claim is valid." : "Condition not yet triggered."}
            </span>
          </div>
        </div>
      )}

      {/* Oracle input */}
      <div>
        <label style={{ display: "block", fontFamily: "sans-serif", fontSize: 9, fontWeight: 600, letterSpacing: "0.22em", textTransform: "uppercase", color: C.muted, marginBottom: 6 }}>
          Step 1 — Oracle Value (USD)
        </label>
        <p style={{ fontFamily: "sans-serif", fontSize: 11, color: C.faint, marginBottom: 10 }}>
          Pre-filled with the live price. The exact value stays private — only the ZK proof is submitted on-chain.
        </p>
        <div style={{ position: "relative" }}>
          <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: C.muted, fontFamily: "sans-serif", fontSize: 14 }}>$</span>
          <input
            type="number"
            value={oracleValue}
            onChange={e => setOracleValue(e.target.value)}
            placeholder="e.g. 45000"
            disabled={state.status === "generating" || claimState === "proven"}
            style={{
              width: "100%", paddingLeft: 30, paddingRight: 16, paddingTop: 12, paddingBottom: 12,
              background: C.bg, border: `1px solid ${C.border}`,
              color: C.text, fontFamily: "sans-serif", fontSize: 14, outline: "none", borderRadius: 0,
            }}
            onFocus={e => (e.target.style.borderColor = C.gold)}
            onBlur={e  => (e.target.style.borderColor = C.border)}
          />
        </div>
      </div>

      {/* Generate proof button */}
      {claimState === "idle" && (
        <button
          onClick={handleGenerateProof}
          disabled={!oracleValue || state.status === "generating"}
          style={{
            width: "100%", padding: "13px 0", background: C.gold, border: "none",
            color: C.bg, cursor: (!oracleValue || state.status === "generating") ? "not-allowed" : "pointer",
            fontFamily: "sans-serif", fontSize: 10, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            opacity: (!oracleValue || state.status === "generating") ? 0.4 : 1, borderRadius: 0,
          }}
        >
          {state.status === "generating" ? (
            <><Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />{(state as any).progress}</>
          ) : (
            <><Cpu size={14} />Step 2 — Generate ZK Proof<ArrowRight size={14} /></>
          )}
        </button>
      )}

      {/* Proof result + submit */}
      {state.status === "done" && (claimState === "proven" || claimState === "submitting") && (
        <>
          <div style={{ padding: "16px", background: "rgba(110,231,183,0.04)", border: "1px solid rgba(110,231,183,0.2)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <CheckCircle2 size={14} style={{ color: "#6ee7b7" }} />
              <span style={{ fontFamily: "sans-serif", fontSize: 13, fontWeight: 600, color: "#6ee7b7" }}>
                Proof generated. Condition verified.
              </span>
            </div>
            <p style={{ fontFamily: "sans-serif", fontSize: 11, color: C.muted, marginBottom: 12 }}>
              The proof confirms the oracle condition was met without revealing the exact value on-chain.
            </p>
            <div style={{ padding: "8px 10px", background: C.card2, fontFamily: "monospace", fontSize: 11, color: C.faint }}>
              Public signals: {state.result.publicSignals.slice(0, 3).join(", ")}...
            </div>
          </div>

          <button
            onClick={handleSubmitClaim}
            disabled={claimState === "submitting"}
            style={{
              width: "100%", padding: "13px 0", background: C.gold, border: "none",
              color: C.bg, cursor: claimState === "submitting" ? "not-allowed" : "pointer",
              fontFamily: "sans-serif", fontSize: 10, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              opacity: claimState === "submitting" ? 0.6 : 1, borderRadius: 0,
            }}
          >
            {claimState === "submitting" ? (
              <><Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />Submitting proof to Stellar...</>
            ) : (
              <><Lock size={14} />Step 3 — Submit Proof and Claim Payout<ArrowRight size={14} /></>
            )}
          </button>
        </>
      )}

      {/* Errors */}
      {(state.status === "error" || error) && (
        <div style={{ padding: "12px 16px", display: "flex", alignItems: "flex-start", gap: 10, background: "rgba(252,165,165,0.05)", border: "1px solid rgba(252,165,165,0.2)", color: "#fca5a5" }}>
          <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
          <span style={{ fontFamily: "sans-serif", fontSize: 13, flex: 1 }}>
            {state.status === "error" ? (state as any).error : error}
          </span>
          <button onClick={reset} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#fca5a5", padding: 0, flexShrink: 0 }}>
            <RotateCcw size={12} />
          </button>
        </div>
      )}
    </div>
  );
}
