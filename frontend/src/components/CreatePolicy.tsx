import React, { useState } from "react";
import { TrendingDown, TrendingUp, ChevronRight, CheckCircle2, ArrowLeft } from "lucide-react";
import { useOracle } from "../hooks/useOracle";

const ORACLE_OPTIONS = [
  { value: "price_btc", label: "BTC/USD", sub: "Bitcoin" },
  { value: "price_eth", label: "ETH/USD", sub: "Ethereum" },
  { value: "price_xlm", label: "XLM/USD", sub: "Stellar Lumens" },
];

const CONDITION_OPTIONS = [
  {
    value: "lte",
    label: "Price Drop Protection",
    desc: "Pays out when price falls below your threshold",
    icon: TrendingDown,
  },
  {
    value: "gte",
    label: "Price Rise Trigger",
    desc: "Pays out when price rises above your threshold",
    icon: TrendingUp,
  },
];

interface Props {
  onCreated?: (policyId: string) => void;
  walletAddress: string | null;
  onOpenWallet: () => void;
}

export default function CreatePolicy({ onCreated, walletAddress, onOpenWallet }: Props) {
  const { prices } = useOracle(30_000);

  const [form, setForm] = useState({
    oracleType: "price_btc",
    condition: "lte",
    threshold: "",
    payoutAmount: "100",
    beneficiary: "",
  });
  const [step, setStep] = useState<"form" | "confirm" | "submitting" | "done">("form");
  const [policyId, setPolicyId] = useState("");
  const [error, setError] = useState("");

  const currentPrice = prices?.[form.oracleType as keyof typeof prices];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === "form") { setStep("confirm"); return; }
    setStep("submitting");
    setError("");
    try {
      const thresholdScaled = BigInt(Math.round(parseFloat(form.threshold) * 1_000_000)).toString();
      const payoutScaled = BigInt(Math.round(parseFloat(form.payoutAmount) * 10_000_000)).toString();
      const res = await fetch("/api/policies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          onChainId: "0x" + Array.from(crypto.getRandomValues(new Uint8Array(32))).map(b => b.toString(16).padStart(2, "0")).join(""),
          insured: walletAddress,
          beneficiary: walletAddress,
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

  // ── Done state ────────────────────────────────────────────────────────────
  if (step === "done") {
    return (
      <div className="text-center py-8">
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5"
          style={{ background: "rgba(45,125,70,0.1)" }}
        >
          <CheckCircle2 className="w-7 h-7" style={{ color: "#2d7d46" }} />
        </div>
        <h3 className="font-display text-2xl font-light mb-2" style={{ color: "#141414" }}>Policy Created</h3>
        <p className="text-sm mb-6" style={{ color: "#878680" }}>
          Your parametric insurance policy is live on Stellar. Claim instantly when the oracle condition is met.
        </p>
        <div
          className="rounded-lg p-3 font-mono text-xs break-all mb-6"
          style={{ background: "#f5f4ef", border: "1px solid #e5e4df", color: "#878680" }}
        >
          {policyId}
        </div>
        <button
          onClick={() => { setStep("form"); setPolicyId(""); setForm({ ...form, threshold: "", beneficiary: "" }); }}
          className="text-sm font-medium flex items-center gap-1.5 mx-auto"
          style={{ color: "#141414" }}
        >
          <ArrowLeft className="w-4 h-4" />
          Create another policy
        </button>
      </div>
    );
  }

  // ── Confirm step ──────────────────────────────────────────────────────────
  if (step === "confirm" || step === "submitting") {
    const oracle = ORACLE_OPTIONS.find(o => o.value === form.oracleType);
    const condition = CONDITION_OPTIONS.find(c => c.value === form.condition);

    return (
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <h3 className="font-display text-xl font-light mb-1" style={{ color: "#141414" }}>Review Policy</h3>
          <p className="text-sm" style={{ color: "#878680" }}>Confirm the details before creating.</p>
        </div>

        <div className="rounded-xl p-5 space-y-4" style={{ background: "#f5f4ef", border: "1px solid #e5e4df" }}>
          {[
            ["Oracle Asset", oracle?.label],
            ["Insurance Type", condition?.label],
            ["Trigger Threshold", `$${parseFloat(form.threshold).toLocaleString()}`],
            ["Payout Amount", `${form.payoutAmount} USDC`],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between items-center">
              <span className="text-xs font-medium tracking-wider uppercase" style={{ color: "#878680" }}>
                {label}
              </span>
              <span className="text-sm font-medium" style={{ color: "#141414" }}>
                {value}
              </span>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setStep("form")}
            className="flex-1 py-3 rounded-lg text-sm font-medium flex items-center justify-center gap-1.5"
            style={{ border: "1px solid #e5e4df", color: "#878680", background: "white" }}
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <button
            type="submit"
            disabled={step === "submitting"}
            className="flex-1 py-3 rounded-lg text-sm font-medium flex items-center justify-center gap-1.5 transition-opacity"
            style={{ background: "#141414", color: "white", opacity: step === "submitting" ? 0.6 : 1 }}
          >
            {step === "submitting" ? "Creating..." : "Create Policy"}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    );
  }

  // ── Main form ─────────────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Oracle */}
      <div>
        <label className="block text-xs font-medium tracking-wider uppercase mb-3" style={{ color: "#878680" }}>
          Oracle Asset
        </label>
        <div className="grid grid-cols-3 gap-3">
          {ORACLE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setForm({ ...form, oracleType: opt.value })}
              className="py-3 px-4 rounded-xl text-left transition-all"
              style={{
                border: form.oracleType === opt.value ? "1px solid #141414" : "1px solid #e5e4df",
                background: form.oracleType === opt.value ? "#141414" : "white",
                color: form.oracleType === opt.value ? "white" : "#141414",
              }}
            >
              <div className="text-sm font-medium">{opt.label}</div>
              <div
                className="text-xs mt-0.5"
                style={{ color: form.oracleType === opt.value ? "rgba(255,255,255,0.6)" : "#878680" }}
              >
                {opt.sub}
              </div>
            </button>
          ))}
        </div>
        {currentPrice && (
          <p className="mt-2 text-xs" style={{ color: "#b0afa9" }}>
            Current price: {currentPrice.formatted}
          </p>
        )}
      </div>

      {/* Condition */}
      <div>
        <label className="block text-xs font-medium tracking-wider uppercase mb-3" style={{ color: "#878680" }}>
          Insurance Type
        </label>
        <div className="grid grid-cols-2 gap-3">
          {CONDITION_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const active = form.condition === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setForm({ ...form, condition: opt.value })}
                className="py-4 px-4 rounded-xl text-left transition-all"
                style={{
                  border: active ? "1px solid #141414" : "1px solid #e5e4df",
                  background: active ? "#141414" : "white",
                }}
              >
                <Icon
                  className="w-5 h-5 mb-2"
                  style={{ color: active ? "rgba(255,255,255,0.8)" : "#878680" }}
                />
                <div className="text-sm font-medium" style={{ color: active ? "white" : "#141414" }}>
                  {opt.label}
                </div>
                <div className="text-xs mt-0.5" style={{ color: active ? "rgba(255,255,255,0.5)" : "#878680" }}>
                  {opt.desc}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Threshold */}
      <div>
        <label className="block text-xs font-medium tracking-wider uppercase mb-2" style={{ color: "#878680" }}>
          Trigger Threshold (USD)
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm" style={{ color: "#878680" }}>$</span>
          <input
            type="number"
            value={form.threshold}
            onChange={(e) => setForm({ ...form, threshold: e.target.value })}
            placeholder={form.condition === "lte" ? "e.g. 50000" : "e.g. 100000"}
            required
            min="0"
            className="w-full pl-9 pr-4 py-3 rounded-xl text-sm transition-colors"
            style={{ background: "white", border: "1px solid #e5e4df", color: "#141414", outline: "none" }}
            onFocus={(e) => (e.target.style.borderColor = "#141414")}
            onBlur={(e) => (e.target.style.borderColor = "#e5e4df")}
          />
        </div>
      </div>

      {/* Payout */}
      <div>
        <label className="block text-xs font-medium tracking-wider uppercase mb-2" style={{ color: "#878680" }}>
          Payout Amount (USDC)
        </label>
        <div className="relative">
          <input
            type="number"
            value={form.payoutAmount}
            onChange={(e) => setForm({ ...form, payoutAmount: e.target.value })}
            min="1"
            required
            className="w-full pl-4 pr-16 py-3 rounded-xl text-sm transition-colors"
            style={{ background: "white", border: "1px solid #e5e4df", color: "#141414", outline: "none" }}
            onFocus={(e) => (e.target.style.borderColor = "#141414")}
            onBlur={(e) => (e.target.style.borderColor = "#e5e4df")}
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm" style={{ color: "#878680" }}>
            USDC
          </span>
        </div>
      </div>

      {error && (
        <div
          className="rounded-lg p-3 text-sm"
          style={{ background: "rgba(155,28,28,0.05)", border: "1px solid rgba(155,28,28,0.2)", color: "#9b1c1c" }}
        >
          {error}
        </div>
      )}

      {walletAddress ? (
        <button
          type="submit"
          className="w-full py-3.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-opacity hover:opacity-80"
          style={{ background: "#141414", color: "white" }}
        >
          Review Policy
          <ChevronRight className="w-4 h-4" />
        </button>
      ) : (
        <button
          type="button"
          onClick={onOpenWallet}
          className="w-full py-3.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-opacity hover:opacity-80"
          style={{ background: "#141414", color: "white" }}
        >
          Connect Wallet to Continue
          <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </form>
  );
}
