import React, { useState, useEffect } from "react";
import { TrendingDown, TrendingUp, ChevronRight, CheckCircle2, ArrowLeft, User } from "lucide-react";
import { useOracle } from "../hooks/useOracle";
import PolicyTemplates from "./PolicyTemplates";
import type { TemplateConfig } from "./PolicyTemplates";

const C = {
  bg:       "#0d0b06",
  card:     "#1a1610",
  card2:    "#221e14",
  text:     "#f0e6c8",
  gold:     "#c9a84c",
  muted:    "#a89060",
  faint:    "#6e5c3a",
  border:   "rgba(201,168,76,0.22)",
  borderHi: "rgba(201,168,76,0.45)",
};

const ORACLE_OPTIONS = [
  { value: "price_btc", label: "BTC/USD", sub: "Bitcoin" },
  { value: "price_eth", label: "ETH/USD", sub: "Ethereum" },
  { value: "price_xlm", label: "XLM/USD", sub: "Stellar Lumens" },
];

const CONDITION_OPTIONS = [
  { value: "lte", label: "Price Drop Protection", desc: "Pays out when price falls below your threshold", icon: TrendingDown },
  { value: "gte", label: "Price Rise Trigger",    desc: "Pays out when price rises above your threshold", icon: TrendingUp },
];

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "12px 16px",
  background: C.bg, border: `1px solid ${C.border}`,
  color: C.text, fontFamily: "sans-serif", fontSize: 14,
  outline: "none", borderRadius: 0, boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  display: "block", fontFamily: "sans-serif",
  fontSize: 9, fontWeight: 600,
  letterSpacing: "0.22em", textTransform: "uppercase",
  color: C.muted, marginBottom: 10,
};

type FormState = {
  oracleType: string;
  condition: string;
  threshold: string;
  payoutAmount: string;
  beneficiary: string;
  beneficiaryMode: "self" | "custom";
};

interface Props {
  onCreated?: (policyId: string) => void;
  walletAddress: string | null;
  onOpenWallet: () => void;
  prefill?: Partial<FormState>;
}

export default function CreatePolicy({ onCreated, walletAddress, onOpenWallet, prefill }: Props) {
  const { prices } = useOracle(30_000);

  const [form, setForm] = useState<FormState>({
    oracleType: "price_btc",
    condition: "lte",
    threshold: "",
    payoutAmount: "100",
    beneficiary: "",
    beneficiaryMode: "self",
    ...prefill,
  });
  const [step, setStep]         = useState<"templates" | "form" | "confirm" | "submitting" | "done">("templates");
  const [policyId, setPolicyId] = useState("");
  const [error, setError]       = useState("");

  // When wallet connects, reset beneficiary field
  useEffect(() => {
    if (walletAddress && form.beneficiaryMode === "self") {
      setForm(f => ({ ...f, beneficiary: walletAddress }));
    }
  }, [walletAddress]);

  const applyTemplate = (cfg: TemplateConfig) => {
    setForm(f => ({
      ...f,
      oracleType: cfg.oracleType,
      condition: cfg.condition,
      threshold: cfg.threshold,
      payoutAmount: cfg.payoutAmount,
    }));
    setStep("form");
  };

  const currentPrice = prices?.[form.oracleType as keyof typeof prices];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === "form") { setStep("confirm"); return; }
    setStep("submitting");
    setError("");
    try {
      const thresholdScaled = BigInt(Math.round(parseFloat(form.threshold) * 1_000_000)).toString();
      const payoutScaled    = BigInt(Math.round(parseFloat(form.payoutAmount) * 10_000_000)).toString();
      const beneficiary     = form.beneficiaryMode === "self" ? walletAddress! : form.beneficiary;
      const res = await fetch("/api/policies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          onChainId: "0x" + Array.from(crypto.getRandomValues(new Uint8Array(32))).map(b => b.toString(16).padStart(2, "0")).join(""),
          insured: walletAddress,
          beneficiary,
          token: "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC",
          payoutAmount: payoutScaled,
          threshold: thresholdScaled,
          condition: form.condition,
          expiryLedger: 10_000_000,
          oracleType: form.oracleType,
          oracleUnit: "USD",
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setPolicyId(data.policy.onChainId);
      setStep("done");
      onCreated?.(data.policy.onChainId);
    } catch (err) {
      setError(String(err));
      setStep("form");
    }
  };

  // ── Done ──────────────────────────────────────────────────────────────────────
  if (step === "done") {
    return (
      <div style={{ textAlign: "center", padding: "32px 0" }}>
        <div style={{ width: 52, height: 52, border: `1px solid rgba(201,168,76,0.4)`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", background: C.card2 }}>
          <CheckCircle2 size={24} style={{ color: C.gold }} />
        </div>
        <h3 className="font-display" style={{ fontSize: 24, fontWeight: 700, color: C.text, marginBottom: 8 }}>Policy Created</h3>
        <p style={{ fontFamily: "sans-serif", fontSize: 14, color: C.muted, marginBottom: 24, lineHeight: 1.7 }}>
          Your parametric insurance policy is live on Stellar Soroban. The moment the oracle condition is met, submit a ZK proof and collect your payout instantly.
        </p>
        <div style={{ padding: "12px 16px", fontFamily: "monospace", fontSize: 11, color: C.muted, background: C.card2, border: `1px solid ${C.border}`, wordBreak: "break-all", marginBottom: 24 }}>
          {policyId}
        </div>
        <button
          onClick={() => { setStep("templates"); setPolicyId(""); setForm(f => ({ ...f, threshold: "", beneficiary: walletAddress ?? "" })); }}
          style={{ display: "flex", alignItems: "center", gap: 6, margin: "0 auto", background: "transparent", border: "none", cursor: "pointer", color: C.gold, fontFamily: "sans-serif", fontSize: 13, padding: 0, borderRadius: 0 }}
        >
          <ArrowLeft size={14} /> Create another policy
        </button>
      </div>
    );
  }

  // ── Templates ─────────────────────────────────────────────────────────────────
  if (step === "templates") {
    return (
      <div>
        <PolicyTemplates prices={prices} onSelect={applyTemplate} />
        <div style={{ textAlign: "center", padding: "12px 0" }}>
          <button
            onClick={() => setStep("form")}
            style={{ background: "transparent", border: "none", cursor: "pointer", color: C.muted, fontFamily: "sans-serif", fontSize: 13, textDecoration: "underline", padding: 0 }}
          >
            Or build a custom policy →
          </button>
        </div>
      </div>
    );
  }

  // ── Confirm ───────────────────────────────────────────────────────────────────
  if (step === "confirm" || step === "submitting") {
    const oracle    = ORACLE_OPTIONS.find(o => o.value === form.oracleType);
    const condition = CONDITION_OPTIONS.find(c => c.value === form.condition);
    const benef     = form.beneficiaryMode === "self" ? walletAddress : form.beneficiary;
    return (
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div>
          <h3 className="font-display" style={{ fontSize: 20, fontWeight: 700, color: C.text, marginBottom: 4 }}>Review Policy</h3>
          <p style={{ fontFamily: "sans-serif", fontSize: 13, color: C.muted }}>Confirm the details before creating on Stellar Soroban.</p>
        </div>
        <div style={{ background: C.card2, border: `1px solid ${C.border}`, padding: 20 }}>
          {[
            ["Oracle Asset",       oracle?.label],
            ["Insurance Type",     condition?.label],
            ["Trigger Threshold",  `$${parseFloat(form.threshold).toLocaleString()}`],
            ["Payout Amount",      `${form.payoutAmount} USDC`],
            ["Beneficiary",        benef ? `${benef.slice(0, 6)}…${benef.slice(-4)}` : "—"],
          ].map(([label, value]) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${C.border}` }}>
              <span style={{ fontFamily: "sans-serif", fontSize: 9, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: C.muted }}>{label}</span>
              <span style={{ fontFamily: "sans-serif", fontSize: 14, fontWeight: 600, color: C.text }}>{value}</span>
            </div>
          ))}
        </div>
        <div style={{ padding: "12px 16px", background: "rgba(201,168,76,0.04)", border: `1px solid ${C.border}`, fontFamily: "sans-serif", fontSize: 12, color: C.muted, lineHeight: 1.6 }}>
          When the oracle condition is triggered, generate a ZK proof in your browser and submit it. The Soroban contract verifies the proof on-chain and releases the payout instantly — no human adjuster involved.
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <button type="button" onClick={() => setStep("form")}
            style={{ flex: 1, padding: "12px 0", background: "transparent", border: `1px solid ${C.border}`, color: C.muted, cursor: "pointer", fontFamily: "sans-serif", fontSize: 10, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, borderRadius: 0 }}>
            <ArrowLeft size={12} /> Back
          </button>
          <button type="submit" disabled={step === "submitting"}
            style={{ flex: 1, padding: "12px 0", background: C.gold, border: "none", color: C.bg, cursor: step === "submitting" ? "not-allowed" : "pointer", fontFamily: "sans-serif", fontSize: 10, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, opacity: step === "submitting" ? 0.6 : 1, borderRadius: 0 }}>
            {step === "submitting" ? "Creating on Stellar…" : "Create Policy"} <ChevronRight size={12} />
          </button>
        </div>
      </form>
    );
  }

  // ── Main form ─────────────────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button type="button" onClick={() => setStep("templates")}
          style={{ background: "transparent", border: "none", cursor: "pointer", color: C.muted, fontFamily: "sans-serif", fontSize: 12, display: "flex", alignItems: "center", gap: 5, padding: 0 }}>
          <ArrowLeft size={13} /> Templates
        </button>
        <span style={{ fontFamily: "sans-serif", fontSize: 10, color: C.faint, letterSpacing: "0.1em", textTransform: "uppercase" }}>Custom Policy</span>
      </div>

      {/* Oracle */}
      <div>
        <label style={labelStyle}>Oracle Asset</label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
          {ORACLE_OPTIONS.map(opt => {
            const active = form.oracleType === opt.value;
            return (
              <button key={opt.value} type="button" onClick={() => setForm({ ...form, oracleType: opt.value })}
                style={{ padding: "14px 12px", textAlign: "left", background: active ? C.gold : C.card2, border: `1px solid ${active ? C.gold : C.border}`, cursor: "pointer", transition: "all 0.15s", borderRadius: 0 }}>
                <div style={{ fontFamily: "sans-serif", fontSize: 13, fontWeight: 600, color: active ? C.bg : C.text, marginBottom: 3 }}>{opt.label}</div>
                <div style={{ fontFamily: "sans-serif", fontSize: 11, color: active ? "rgba(13,11,6,0.6)" : C.muted }}>{opt.sub}</div>
              </button>
            );
          })}
        </div>
        {currentPrice && (
          <p style={{ marginTop: 8, fontFamily: "sans-serif", fontSize: 11, color: C.faint }}>
            Current price: <span style={{ color: C.muted }}>{currentPrice.formatted}</span>
          </p>
        )}
      </div>

      {/* Condition */}
      <div>
        <label style={labelStyle}>Insurance Type</label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
          {CONDITION_OPTIONS.map(opt => {
            const Icon   = opt.icon;
            const active = form.condition === opt.value;
            return (
              <button key={opt.value} type="button" onClick={() => setForm({ ...form, condition: opt.value })}
                style={{ padding: "16px 14px", textAlign: "left", background: active ? C.gold : C.card2, border: `1px solid ${active ? C.gold : C.border}`, cursor: "pointer", transition: "all 0.15s", borderRadius: 0 }}>
                <Icon size={18} style={{ color: active ? C.bg : C.muted, marginBottom: 8 }} />
                <div style={{ fontFamily: "sans-serif", fontSize: 13, fontWeight: 600, color: active ? C.bg : C.text, marginBottom: 3 }}>{opt.label}</div>
                <div style={{ fontFamily: "sans-serif", fontSize: 11, color: active ? "rgba(13,11,6,0.6)" : C.muted }}>{opt.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Threshold */}
      <div>
        <label style={labelStyle}>Trigger Threshold (USD)</label>
        <div style={{ position: "relative" }}>
          <span style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", fontFamily: "sans-serif", fontSize: 14, color: C.muted }}>$</span>
          <input type="number" value={form.threshold}
            onChange={e => setForm({ ...form, threshold: e.target.value })}
            placeholder={form.condition === "lte" ? "e.g. 50000" : "e.g. 100000"}
            required min="0"
            style={{ ...inputStyle, paddingLeft: 32 }}
            onFocus={e => (e.target.style.borderColor = C.gold)}
            onBlur={e  => (e.target.style.borderColor = C.border)}
          />
        </div>
        {/* smart suggestion */}
        {currentPrice && form.condition === "lte" && (
          <div style={{ marginTop: 6, display: "flex", gap: 8, flexWrap: "wrap" }}>
            {[10, 20, 30].map(pct => {
              const suggested = ((Number(currentPrice.raw) / 1_000_000) * (1 - pct / 100)).toFixed(0);
              return (
                <button key={pct} type="button"
                  onClick={() => setForm({ ...form, threshold: suggested })}
                  style={{ fontFamily: "sans-serif", fontSize: 10, color: C.muted, background: "rgba(201,168,76,0.06)", border: `1px solid ${C.border}`, padding: "3px 9px", cursor: "pointer", borderRadius: 0 }}>
                  -{pct}% (${Number(suggested).toLocaleString()})
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Payout */}
      <div>
        <label style={labelStyle}>Payout Amount (USDC)</label>
        <div style={{ position: "relative" }}>
          <input type="number" value={form.payoutAmount}
            onChange={e => setForm({ ...form, payoutAmount: e.target.value })}
            min="1" required
            style={{ ...inputStyle, paddingRight: 60 }}
            onFocus={e => (e.target.style.borderColor = C.gold)}
            onBlur={e  => (e.target.style.borderColor = C.border)}
          />
          <span style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", fontFamily: "sans-serif", fontSize: 12, color: C.muted }}>USDC</span>
        </div>
      </div>

      {/* Beneficiary */}
      <div>
        <label style={labelStyle}>Payout Beneficiary</label>
        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          {(["self", "custom"] as const).map(mode => (
            <button key={mode} type="button"
              onClick={() => setForm(f => ({ ...f, beneficiaryMode: mode, beneficiary: mode === "self" ? (walletAddress ?? "") : "" }))}
              style={{ flex: 1, padding: "10px 0", fontFamily: "sans-serif", fontSize: 10, fontWeight: 600, letterSpacing: "0.16em", textTransform: "uppercase", background: form.beneficiaryMode === mode ? C.gold : C.card2, color: form.beneficiaryMode === mode ? C.bg : C.muted, border: `1px solid ${form.beneficiaryMode === mode ? C.gold : C.border}`, cursor: "pointer", borderRadius: 0 }}>
              {mode === "self" ? "My Wallet" : "Custom Address"}
            </button>
          ))}
        </div>
        {form.beneficiaryMode === "self" ? (
          <div style={{ padding: "10px 14px", background: C.card2, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 8 }}>
            <User size={13} style={{ color: C.faint }} />
            <span style={{ fontFamily: "monospace", fontSize: 12, color: C.muted }}>
              {walletAddress ? `${walletAddress.slice(0, 8)}…${walletAddress.slice(-6)}` : "Connect wallet first"}
            </span>
          </div>
        ) : (
          <input
            type="text"
            value={form.beneficiary}
            onChange={e => setForm({ ...form, beneficiary: e.target.value })}
            placeholder="G... (Stellar address)"
            required={form.beneficiaryMode === "custom"}
            style={inputStyle}
            onFocus={e => (e.target.style.borderColor = C.gold)}
            onBlur={e  => (e.target.style.borderColor = C.border)}
          />
        )}
      </div>

      {error && (
        <div style={{ padding: "12px 16px", background: "rgba(252,165,165,0.06)", border: "1px solid rgba(252,165,165,0.2)", color: "#fca5a5", fontFamily: "sans-serif", fontSize: 13 }}>
          {error}
        </div>
      )}

      {walletAddress ? (
        <button type="submit"
          style={{ width: "100%", padding: "14px 0", background: C.gold, border: "none", color: C.bg, cursor: "pointer", fontFamily: "sans-serif", fontSize: 10, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 0 }}>
          Review Policy <ChevronRight size={14} />
        </button>
      ) : (
        <button type="button" onClick={onOpenWallet}
          style={{ width: "100%", padding: "14px 0", background: C.gold, border: "none", color: C.bg, cursor: "pointer", fontFamily: "sans-serif", fontSize: 10, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 0 }}>
          Connect Wallet to Continue <ChevronRight size={14} />
        </button>
      )}
    </form>
  );
}
