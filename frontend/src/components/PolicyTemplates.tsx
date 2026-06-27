import React from "react";
import { TrendingDown, TrendingUp, Shield, Zap, ArrowRight } from "lucide-react";
import type { OraclePrices } from "../types";

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

export interface TemplateConfig {
  oracleType: string;
  condition: "lte" | "gte";
  threshold: string;
  payoutAmount: string;
  label: string;
}

interface Template {
  id: string;
  icon: React.ReactNode;
  name: string;
  tag: string;
  desc: string;
  oracle: string;
  condition: "lte" | "gte";
  thresholdFn: (prices: OraclePrices) => number; // returns USD float
  payoutFn: (prices: OraclePrices) => number;    // returns USDC float
}

const TEMPLATES: Template[] = [
  {
    id: "btc-crash",
    icon: <Shield size={20} />,
    name: "BTC Crash Protection",
    tag: "Most Popular",
    desc: "Protect against a 20% Bitcoin crash. Pays out 200 USDC if BTC drops below this threshold.",
    oracle: "price_btc",
    condition: "lte",
    thresholdFn: p => (Number(p.price_btc.raw) / 1_000_000) * 0.80,
    payoutFn: _ => 200,
  },
  {
    id: "eth-dip",
    icon: <TrendingDown size={20} />,
    name: "ETH Dip Hedge",
    tag: "DeFi Staple",
    desc: "Lock in protection if ETH falls 15% below current price. Ideal for Ethereum holders.",
    oracle: "price_eth",
    condition: "lte",
    thresholdFn: p => (Number(p.price_eth.raw) / 1_000_000) * 0.85,
    payoutFn: _ => 150,
  },
  {
    id: "xlm-rally",
    icon: <TrendingUp size={20} />,
    name: "XLM Rally Trigger",
    tag: "Upside Play",
    desc: "Collect a payout if XLM rallies 30% from current price. A bet on Stellar network growth.",
    oracle: "price_xlm",
    condition: "gte",
    thresholdFn: p => (Number(p.price_xlm.raw) / 1_000_000) * 1.30,
    payoutFn: _ => 100,
  },
  {
    id: "btc-bear",
    icon: <Zap size={20} />,
    name: "Bear Market Shield",
    tag: "Deep Protection",
    desc: "Extreme downside coverage. Pays 500 USDC if BTC falls 40% — ideal for bear market hedging.",
    oracle: "price_btc",
    condition: "lte",
    thresholdFn: p => (Number(p.price_btc.raw) / 1_000_000) * 0.60,
    payoutFn: _ => 500,
  },
];

interface Props {
  prices: OraclePrices | null;
  onSelect: (cfg: TemplateConfig) => void;
}

export default function PolicyTemplates({ prices, onSelect }: Props) {
  if (!prices) return null;

  return (
    <div style={{ marginBottom: 36 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
        <div>
          <div style={{ fontFamily: "sans-serif", fontSize: 9, fontWeight: 600, letterSpacing: "0.24em", textTransform: "uppercase", color: C.gold, marginBottom: 6 }}>Quick Start</div>
          <h3 className="font-display" style={{ fontSize: 20, fontWeight: 700, color: C.text, letterSpacing: "-0.01em" }}>Policy Templates</h3>
        </div>
        <span style={{ fontFamily: "sans-serif", fontSize: 11, color: C.faint }}>Based on live prices · Fully customizable</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
        {TEMPLATES.map(t => {
          const threshold = t.thresholdFn(prices);
          const payout    = t.payoutFn(prices);
          return (
            <div
              key={t.id}
              className="ad-card"
              style={{ background: C.card2, border: `1px solid ${C.border}`, padding: "22px 20px", cursor: "pointer", transition: "border-color 0.15s, transform 0.15s" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = C.borderHi; e.currentTarget.style.transform = "translateY(-2px)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.transform = ""; }}
              onClick={() => onSelect({
                oracleType: t.oracle,
                condition: t.condition,
                threshold: threshold.toFixed(2),
                payoutAmount: payout.toFixed(0),
                label: t.name,
              })}
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
                <div style={{ color: C.gold }}>{t.icon}</div>
                <span style={{ fontFamily: "sans-serif", fontSize: 8, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: C.faint, border: `1px solid ${C.border}`, padding: "2px 7px" }}>
                  {t.tag}
                </span>
              </div>
              <h4 className="font-display" style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 6, letterSpacing: "-0.01em" }}>{t.name}</h4>
              <p style={{ fontFamily: "sans-serif", fontSize: 12, color: C.muted, lineHeight: 1.65, marginBottom: 16 }}>{t.desc}</p>
              <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 12, display: "flex", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontFamily: "sans-serif", fontSize: 9, fontWeight: 600, letterSpacing: "0.16em", textTransform: "uppercase", color: C.faint, marginBottom: 3 }}>Trigger</div>
                  <div style={{ fontFamily: "sans-serif", fontSize: 12, fontWeight: 600, color: C.gold }}>
                    ${threshold.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontFamily: "sans-serif", fontSize: 9, fontWeight: 600, letterSpacing: "0.16em", textTransform: "uppercase", color: C.faint, marginBottom: 3 }}>Payout</div>
                  <div style={{ fontFamily: "sans-serif", fontSize: 12, fontWeight: 600, color: C.text }}>{payout} USDC</div>
                </div>
              </div>
              <button style={{
                marginTop: 14, width: "100%", padding: "9px 0",
                background: "rgba(201,168,76,0.1)", border: `1px solid rgba(201,168,76,0.25)`,
                color: C.gold, fontFamily: "sans-serif", fontSize: 9,
                fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase",
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, borderRadius: 0,
              }}>
                Use Template <ArrowRight size={11} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
