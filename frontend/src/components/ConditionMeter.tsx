import React from "react";

const LD = {
  gold:   "#C9A84C",
  sub:    "#71717A",
  faint:  "#A1A1AA",
  border: "#E4E4E7",
};

interface Props {
  currentPrice: number;
  threshold: number;
  condition: "lte" | "gte";
}

export default function ConditionMeter({ currentPrice, threshold, condition }: Props) {
  const triggered = condition === "lte" ? currentPrice <= threshold : currentPrice >= threshold;

  let pct: number;
  if (condition === "lte") {
    const drop = currentPrice - threshold;
    const ref  = currentPrice * 0.5;
    pct = triggered ? 100 : Math.max(0, Math.min(99, (1 - drop / ref) * 100));
  } else {
    const rise = threshold - currentPrice;
    const ref  = currentPrice * 0.5;
    pct = triggered ? 100 : Math.max(0, Math.min(99, (1 - rise / ref) * 100));
  }

  const distancePct = condition === "lte"
    ? ((currentPrice - threshold) / currentPrice) * 100
    : ((threshold - currentPrice) / currentPrice) * 100;

  const barColor = triggered
    ? "#16a34a"
    : pct > 85 ? "#ef4444"
    : pct > 60 ? "#f59e0b"
    : LD.gold;

  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <span style={{ fontFamily: "'Work Sans', sans-serif", fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: triggered ? "#16a34a" : LD.faint }}>
          {triggered ? "⚡ Condition Met — Claimable" : "Distance to Trigger"}
        </span>
        <span style={{ fontFamily: "'Work Sans', sans-serif", fontSize: 12, fontWeight: 600, color: triggered ? "#16a34a" : LD.sub }}>
          {triggered ? "Claim Now" : `${Math.abs(distancePct).toFixed(1)}% away`}
        </span>
      </div>
      <div style={{ height: 4, background: LD.border, position: "relative", overflow: "hidden" }}>
        <div style={{
          height: "100%",
          width: `${Math.max(2, Math.min(100, pct))}%`,
          background: barColor,
          transition: "width 0.6s ease, background-color 0.4s",
        }} />
      </div>
      {!triggered && (
        <div style={{ marginTop: 5, fontFamily: "'Work Sans', sans-serif", fontSize: 11, color: LD.faint }}>
          {condition === "lte"
            ? `Triggers when price drops to $${threshold.toLocaleString("en-US", { minimumFractionDigits: 2 })}`
            : `Triggers when price rises to $${threshold.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
        </div>
      )}
    </div>
  );
}
