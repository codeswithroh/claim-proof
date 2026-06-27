import React, { useState } from "react";
import { Zap, X, ArrowRight } from "lucide-react";
import type { Policy } from "../types";
import type { OraclePrices } from "../types";
import { useNavigate } from "react-router-dom";

const ORACLE_LABELS: Record<string, string> = {
  price_btc: "BTC/USD",
  price_eth: "ETH/USD",
  price_xlm: "XLM/USD",
};

interface Props {
  policies: Policy[];
  prices: OraclePrices | null;
}

export default function ClaimableBanner({ policies, prices }: Props) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  if (!prices) return null;

  const claimable = policies.filter(p => {
    if (p.status !== "active") return false;
    if (dismissed.has(p.onChainId)) return false;
    const raw = prices[p.oracleType as keyof OraclePrices]?.raw;
    if (!raw) return false;
    const current = Number(raw) / 1_000_000;
    const thresh  = Number(p.threshold) / 1_000_000;
    return p.condition === "lte" ? current <= thresh : current >= thresh;
  });

  if (claimable.length === 0) return null;

  return (
    <div style={{ marginBottom: 24 }}>
      {claimable.map(p => {
        const oracle   = ORACLE_LABELS[p.oracleType] ?? p.oracleType;
        const thresh   = (Number(p.threshold) / 1e6).toLocaleString("en-US", { style: "currency", currency: "USD" });
        const payout   = (Number(p.payoutAmount) / 1e7).toFixed(2);
        const rawPrice = prices[p.oracleType as keyof OraclePrices]?.formatted ?? "—";

        return (
          <div key={p.onChainId} style={{
            display: "flex", alignItems: "center", gap: 16,
            padding: "14px 20px",
            background: "rgba(22,163,74,0.06)",
            border: "1px solid rgba(22,163,74,0.25)",
            marginBottom: 8,
          }}>
            <div style={{
              width: 36, height: 36, background: "rgba(22,163,74,0.1)",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <Zap size={18} style={{ color: "#16a34a" }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, fontWeight: 700, color: "#15803d", marginBottom: 2 }}>
                Your {oracle} policy is claimable now
              </div>
              <div style={{ fontFamily: "'Work Sans', sans-serif", fontSize: 12, color: "#16a34a" }}>
                Live price {rawPrice} has {p.condition === "lte" ? "dropped below" : "risen above"} your {thresh} trigger.
                Claim <strong>{payout} USDC</strong> instantly.
              </div>
            </div>
            <a
              href={`#policy-${p.onChainId}`}
              onClick={() => {
                const el = document.getElementById(`policy-${p.onChainId}`);
                if (el) { el.scrollIntoView({ behavior: "smooth" }); el.click(); }
              }}
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "9px 18px", background: "#16a34a", color: "#fff",
                fontFamily: "'Work Sans', sans-serif", fontSize: 11, fontWeight: 700,
                letterSpacing: "0.1em", textTransform: "uppercase",
                textDecoration: "none", flexShrink: 0, cursor: "pointer",
              }}
            >
              Claim <ArrowRight size={12} />
            </a>
            <button
              onClick={() => setDismissed(s => new Set([...s, p.onChainId]))}
              style={{ background: "transparent", border: "none", cursor: "pointer", color: "rgba(22,163,74,0.5)", flexShrink: 0, padding: 4 }}
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
