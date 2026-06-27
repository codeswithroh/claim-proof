import React from "react";
import { TrendingDown, TrendingUp, Shield, Zap, ArrowRight } from "lucide-react";
import type { OraclePrices } from "../types";

const LD = {
  bg:      "#FDF7F4",
  surface: "#FFFFFF",
  text:    "#18181B",
  sub:     "#71717A",
  faint:   "#A1A1AA",
  border:  "#E4E4E7",
  gold:    "#C9A84C",
  goldBg:  "rgba(201,168,76,0.09)",
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
  thresholdFn: (prices: OraclePrices) => number;
  payoutFn: (prices: OraclePrices) => number;
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
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <div style={{ fontFamily: "'Work Sans', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: LD.gold, marginBottom: 6 }}>Quick Start</div>
          <h3 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 20, fontWeight: 800, color: LD.text, letterSpacing: "-0.02em" }}>Policy Templates</h3>
        </div>
        <span style={{ fontFamily: "'Work Sans', sans-serif", fontSize: 12, color: LD.faint }}>Based on live prices · Fully customizable</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
        {TEMPLATES.map(t => {
          const threshold = t.thresholdFn(prices);
          const payout    = t.payoutFn(prices);
          return (
            <div
              key={t.id}
              style={{ background: LD.surface, border: `1px solid ${LD.border}`, padding: "22px 20px", cursor: "pointer", transition: "border-color 0.15s, box-shadow 0.15s" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(201,168,76,0.5)"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.06)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = LD.border; e.currentTarget.style.boxShadow = "none"; }}
              onClick={() => onSelect({
                oracleType: t.oracle,
                condition: t.condition,
                threshold: threshold.toFixed(2),
                payoutAmount: payout.toFixed(0),
                label: t.name,
              })}
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
                <div style={{ width: 38, height: 38, background: LD.goldBg, border: `1px solid rgba(201,168,76,0.18)`, display: "flex", alignItems: "center", justifyContent: "center", color: LD.gold }}>
                  {t.icon}
                </div>
                <span style={{ fontFamily: "'Work Sans', sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: LD.faint, border: `1px solid ${LD.border}`, padding: "2px 8px" }}>
                  {t.tag}
                </span>
              </div>
              <h4 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 15, fontWeight: 700, color: LD.text, marginBottom: 6 }}>{t.name}</h4>
              <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: 12, color: LD.sub, lineHeight: 1.65, marginBottom: 16 }}>{t.desc}</p>
              <div style={{ borderTop: `1px solid ${LD.border}`, paddingTop: 12, display: "flex", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontFamily: "'Work Sans', sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: LD.faint, marginBottom: 3 }}>Trigger</div>
                  <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, fontWeight: 700, color: LD.gold }}>
                    ${threshold.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontFamily: "'Work Sans', sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: LD.faint, marginBottom: 3 }}>Payout</div>
                  <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, fontWeight: 700, color: LD.text }}>{payout} USDC</div>
                </div>
              </div>
              <button style={{
                marginTop: 14, width: "100%", padding: "9px 0",
                background: LD.goldBg, border: `1px solid rgba(201,168,76,0.25)`,
                color: LD.gold, fontFamily: "'Work Sans', sans-serif", fontSize: 10,
                fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase",
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
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
