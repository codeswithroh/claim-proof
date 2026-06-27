import React from "react";

const C = {
  gold:   "#c9a84c",
  muted:  "#a89060",
  faint:  "#6e5c3a",
  border: "rgba(201,168,76,0.22)",
  card2:  "#221e14",
};

interface Props {
  currentPrice: number;   // in USD (float)
  threshold: number;      // in USD (float)
  condition: "lte" | "gte";
}

export default function ConditionMeter({ currentPrice, threshold, condition }: Props) {
  const triggered = condition === "lte" ? currentPrice <= threshold : currentPrice >= threshold;

  // pct: how far along toward the trigger (0 = far, 100 = at trigger)
  let pct: number;
  if (condition === "lte") {
    // Price needs to DROP to threshold
    // If price >> threshold: pct near 0. If price == threshold: pct == 100.
    const drop = currentPrice - threshold;
    const ref  = currentPrice * 0.5; // use 50% of current as "far"
    pct = triggered ? 100 : Math.max(0, Math.min(99, (1 - drop / ref) * 100));
  } else {
    // Price needs to RISE to threshold
    const rise = threshold - currentPrice;
    const ref  = currentPrice * 0.5;
    pct = triggered ? 100 : Math.max(0, Math.min(99, (1 - rise / ref) * 100));
  }

  const distancePct = condition === "lte"
    ? ((currentPrice - threshold) / currentPrice) * 100
    : ((threshold - currentPrice) / currentPrice) * 100;

  const barColor = triggered
    ? "#6ee7b7"
    : pct > 85 ? "#fca5a5"
    : pct > 60 ? "#fbbf24"
    : C.gold;

  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
        <span style={{ fontFamily: "sans-serif", fontSize: 9, fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", color: triggered ? "#6ee7b7" : C.faint }}>
          {triggered ? "⚡ Condition Met — Claimable" : "Distance to Trigger"}
        </span>
        <span style={{ fontFamily: "sans-serif", fontSize: 11, fontWeight: 600, color: triggered ? "#6ee7b7" : C.muted }}>
          {triggered ? "Claim Now" : `${Math.abs(distancePct).toFixed(1)}% away`}
        </span>
      </div>
      <div style={{ height: 4, background: "rgba(201,168,76,0.12)", position: "relative", overflow: "hidden" }}>
        <div style={{
          height: "100%",
          width: `${Math.max(2, Math.min(100, pct))}%`,
          background: barColor,
          transition: "width 0.6s ease, background-color 0.4s",
        }} />
      </div>
      {!triggered && (
        <div style={{ marginTop: 5, fontFamily: "sans-serif", fontSize: 11, color: C.faint }}>
          {condition === "lte"
            ? `Triggers when price drops to $${threshold.toLocaleString("en-US", { minimumFractionDigits: 2 })}`
            : `Triggers when price rises to $${threshold.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
        </div>
      )}
    </div>
  );
}
