import React, { useEffect, useRef, useState } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useOracle } from "../hooks/useOracle";
import { useOracleHistory } from "../hooks/useOracleHistory";
import PriceSparkline from "./PriceSparkline";

const LD = {
  surface: "#FFFFFF",
  text:    "#18181B",
  sub:     "#71717A",
  faint:   "#A1A1AA",
  border:  "#E4E4E7",
  gold:    "#C9A84C",
};

interface PriceTile { key: "price_btc" | "price_eth" | "price_xlm"; label: string; ticker: string; }

const TILES: PriceTile[] = [
  { key: "price_btc", label: "Bitcoin",        ticker: "BTC/USD" },
  { key: "price_eth", label: "Ethereum",       ticker: "ETH/USD" },
  { key: "price_xlm", label: "Stellar Lumens", ticker: "XLM/USD" },
];

function usePrevious<T>(value: T) {
  const ref = useRef<T>(value);
  useEffect(() => { ref.current = value; });
  return ref.current;
}

export default function PriceOracle() {
  const { prices, loading, lastUpdated } = useOracle(15_000);
  const { history } = useOracleHistory();
  const prev  = usePrevious(prices);
  const [flash, setFlash] = useState<Record<string, "up" | "down" | null>>({});

  useEffect(() => {
    if (!prices || !prev) return;
    const next: Record<string, "up" | "down" | null> = {};
    for (const t of TILES) {
      const cur = BigInt(prices[t.key]?.raw ?? "0");
      const old = BigInt(prev[t.key]?.raw ?? "0");
      if (cur > old) next[t.key] = "up";
      else if (cur < old) next[t.key] = "down";
    }
    setFlash(next);
    const id = setTimeout(() => setFlash({}), 1000);
    return () => clearTimeout(id);
  }, [prices]);

  const change24h: Record<string, number | null> = {};
  for (const t of TILES) {
    if (history.length >= 2) {
      const oldest = Number(history[0].prices[t.key]) / 1_000_000;
      const newest = Number(history[history.length - 1].prices[t.key]) / 1_000_000;
      change24h[t.key] = oldest > 0 ? ((newest - oldest) / oldest) * 100 : null;
    } else {
      change24h[t.key] = null;
    }
  }

  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 6, height: 6, background: "#22c55e", borderRadius: "50%", animation: "ad-blink 2s ease-in-out infinite" }} />
          <span style={{ fontFamily: "'Work Sans', sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", color: LD.faint }}>
            Live Oracle Prices
          </span>
        </div>
        {lastUpdated && (
          <span style={{ fontFamily: "'Work Sans', sans-serif", fontSize: 12, color: LD.faint }}>
            Updated {lastUpdated.toLocaleTimeString()}
          </span>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        {TILES.map(t => {
          const data  = prices?.[t.key];
          const dir   = flash[t.key];
          const chg   = change24h[t.key];
          const chgUp = chg !== null && chg >= 0;

          return (
            <div key={t.key} style={{
              background: LD.surface,
              border: `1px solid ${LD.border}`,
              borderTop: dir === "up"   ? `2px solid #22c55e`
                       : dir === "down" ? `2px solid #ef4444`
                       : `2px solid transparent`,
              padding: "20px 22px",
              transition: "border-color 0.3s",
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <div>
                  <div style={{ fontFamily: "'Work Sans', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: LD.faint, marginBottom: 3 }}>
                    {t.ticker}
                  </div>
                  <div style={{ fontFamily: "'Work Sans', sans-serif", fontSize: 13, color: LD.sub }}>
                    {t.label}
                  </div>
                </div>
                <PriceSparkline history={history} priceKey={t.key} width={88} height={36} />
              </div>

              <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                {loading ? (
                  <div style={{ height: 28, width: 96, background: "rgba(201,168,76,0.08)", animation: "pulse 2s infinite", borderRadius: 4 }} />
                ) : (
                  <div style={{
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontSize: 24, fontWeight: 800,
                    color: dir === "up"   ? "#16a34a"
                         : dir === "down" ? "#dc2626"
                         : LD.gold,
                    letterSpacing: "-0.02em",
                    transition: "color 0.3s",
                  }}>
                    {data?.formatted ?? "—"}
                  </div>
                )}
                {chg !== null && (
                  <span style={{ fontFamily: "'Work Sans', sans-serif", fontSize: 12, fontWeight: 600, color: chgUp ? "#16a34a" : "#dc2626" }}>
                    {chgUp ? "+" : ""}{chg.toFixed(2)}%
                  </span>
                )}
              </div>
              <div style={{ marginTop: 4, fontFamily: "'Work Sans', sans-serif", fontSize: 10, color: LD.faint }}>24h change</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
