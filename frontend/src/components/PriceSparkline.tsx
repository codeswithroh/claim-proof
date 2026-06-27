import React from "react";
import type { HistorySample } from "../hooks/useOracleHistory";

interface Props {
  history: HistorySample[];
  priceKey: "price_btc" | "price_eth" | "price_xlm";
  width?: number;
  height?: number;
}

const GOLD = "#c9a84c";
const GREEN = "#6ee7b7";
const RED = "#fca5a5";

export default function PriceSparkline({ history, priceKey, width = 88, height = 32 }: Props) {
  if (history.length < 2) {
    return <div style={{ width, height, opacity: 0.2, background: "rgba(201,168,76,0.1)" }} />;
  }

  const values = history.map(h => Number(h.prices[priceKey]));
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * width;
    const y = height - ((v - min) / range) * height;
    return `${x},${y}`;
  });

  const first = values[0];
  const last  = values[values.length - 1];
  const trend = last >= first ? "up" : "down";
  const color = trend === "up" ? GREEN : RED;

  const polyline = pts.join(" ");

  // filled area path
  const fillPath = `M0,${height} L${pts.join(" L")} L${width},${height} Z`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: "visible", display: "block" }}>
      <defs>
        <linearGradient id={`sg-${priceKey}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={fillPath} fill={`url(#sg-${priceKey})`} />
      <polyline points={polyline} fill="none" stroke={color} strokeWidth="1.2" strokeLinejoin="round" strokeLinecap="round" />
      {/* current value dot */}
      {(() => {
        const lastPt = pts[pts.length - 1].split(",");
        return <circle cx={parseFloat(lastPt[0])} cy={parseFloat(lastPt[1])} r="2" fill={color} />;
      })()}
    </svg>
  );
}
