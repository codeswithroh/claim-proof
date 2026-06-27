import React, { useEffect, useRef, useState } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useOracle } from "../hooks/useOracle";
import { useOracleHistory } from "../hooks/useOracleHistory";
import PriceSparkline from "./PriceSparkline";

const C = {
  card:   "#1a1610",
  gold:   "#c9a84c",
  text:   "#f0e6c8",
  muted:  "#a89060",
  faint:  "#6e5c3a",
  border: "rgba(201,168,76,0.22)",
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

  // Compute 24h change % from history
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
          <div style={{ width: 5, height: 5, background: C.gold, animation: "ad-blink 2s ease-in-out infinite" }} />
          <span style={{ fontFamily: "sans-serif", fontSize: 9, fontWeight: 600, letterSpacing: "0.22em", textTransform: "uppercase", color: C.muted }}>
            Live Oracle Prices
          </span>
        </div>
        {lastUpdated && (
          <span style={{ fontFamily: "sans-serif", fontSize: 11, color: C.faint }}>
            Updated {lastUpdated.toLocaleTimeString()}
          </span>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1, background: C.border, border: `1px solid ${C.border}` }}>
        {TILES.map(t => {
          const data  = prices?.[t.key];
          const dir   = flash[t.key];
          const chg   = change24h[t.key];
          const chgUp = chg !== null && chg >= 0;

          return (
            <div key={t.key} style={{
              background: C.card, padding: "22px 24px",
              borderLeft: dir === "up"   ? `2px solid rgba(110,231,183,0.5)`
                        : dir === "down" ? `2px solid rgba(252,165,165,0.4)`
                        : "2px solid transparent",
              transition: "border-color 0.3s",
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <div>
                  <div style={{ fontFamily: "sans-serif", fontSize: 9, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: C.muted, marginBottom: 4 }}>
                    {t.ticker}
                  </div>
                  <div style={{ fontFamily: "sans-serif", fontSize: 13, fontWeight: 500, color: C.faint }}>
                    {t.label}
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                  <div style={{
                    width: 28, height: 28,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: dir === "up"   ? "rgba(110,231,183,0.1)"
                              : dir === "down" ? "rgba(252,165,165,0.08)"
                              : "rgba(201,168,76,0.08)",
                  }}>
                    {dir === "up"   ? <TrendingUp   size={13} style={{ color: "#6ee7b7" }} />
                    : dir === "down" ? <TrendingDown size={13} style={{ color: "#fca5a5" }} />
                    :                  <Minus        size={13} style={{ color: C.faint }} />}
                  </div>
                  {/* 24h sparkline */}
                  <PriceSparkline history={history} priceKey={t.key} width={72} height={28} />
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                {loading ? (
                  <div style={{ height: 28, width: 96, background: "rgba(201,168,76,0.1)", animation: "pulse 2s infinite" }} />
                ) : (
                  <div className="font-display" style={{
                    fontSize: 24, fontWeight: 700,
                    color: dir === "up"   ? "#6ee7b7"
                         : dir === "down" ? "#fca5a5"
                         : C.gold,
                    letterSpacing: "-0.01em",
                    transition: "color 0.3s",
                  }}>
                    {data?.formatted ?? "—"}
                  </div>
                )}
                {chg !== null && (
                  <span style={{ fontFamily: "sans-serif", fontSize: 11, fontWeight: 600, color: chgUp ? "#6ee7b7" : "#fca5a5" }}>
                    {chgUp ? "+" : ""}{chg.toFixed(2)}%
                  </span>
                )}
              </div>
              <div style={{ marginTop: 4, fontFamily: "sans-serif", fontSize: 10, color: C.faint }}>24h</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
