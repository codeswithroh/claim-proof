import React, { useEffect, useRef, useState } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useOracle } from "../hooks/useOracle";

interface PriceTile {
  key: string;
  label: string;
  ticker: string;
}

const TILES: PriceTile[] = [
  { key: "price_btc", label: "Bitcoin", ticker: "BTC/USD" },
  { key: "price_eth", label: "Ethereum", ticker: "ETH/USD" },
  { key: "price_xlm", label: "Stellar Lumens", ticker: "XLM/USD" },
];

function usePrevious<T>(value: T) {
  const ref = useRef<T>(value);
  useEffect(() => { ref.current = value; });
  return ref.current;
}

export default function PriceOracle() {
  const { prices, loading, lastUpdated } = useOracle(15_000);
  const prev = usePrevious(prices);
  const [flash, setFlash] = useState<Record<string, "up" | "down" | null>>({});

  useEffect(() => {
    if (!prices || !prev) return;
    const next: Record<string, "up" | "down" | null> = {};
    for (const t of TILES) {
      const cur = BigInt(prices[t.key as keyof typeof prices]?.raw ?? "0");
      const old = BigInt(prev[t.key as keyof typeof prev]?.raw ?? "0");
      if (cur > old) next[t.key] = "up";
      else if (cur < old) next[t.key] = "down";
    }
    setFlash(next);
    const id = setTimeout(() => setFlash({}), 1000);
    return () => clearTimeout(id);
  }, [prices]);

  return (
    <div className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-medium tracking-[0.12em] uppercase" style={{ color: "#878680" }}>
          Live Oracle Prices
        </span>
        {lastUpdated && (
          <span className="text-xs" style={{ color: "#b0afa9" }}>
            Updated {lastUpdated.toLocaleTimeString()}
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4">
        {TILES.map((t) => {
          const data = prices?.[t.key as keyof typeof prices];
          const dir = flash[t.key];

          return (
            <div
              key={t.key}
              className="rounded-xl bg-white p-5 transition-all duration-500"
              style={{
                border: dir === "up"
                  ? "1px solid rgba(45,125,70,0.3)"
                  : dir === "down"
                  ? "1px solid rgba(155,28,28,0.3)"
                  : "1px solid #e5e4df",
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-xs font-medium tracking-wide" style={{ color: "#878680" }}>
                    {t.ticker}
                  </div>
                  <div className="text-sm font-medium mt-0.5" style={{ color: "#141414" }}>
                    {t.label}
                  </div>
                </div>
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{
                    background: dir === "up"
                      ? "rgba(45,125,70,0.08)"
                      : dir === "down"
                      ? "rgba(155,28,28,0.08)"
                      : "#f5f4ef",
                  }}
                >
                  {dir === "up" ? (
                    <TrendingUp className="w-4 h-4" style={{ color: "#2d7d46" }} />
                  ) : dir === "down" ? (
                    <TrendingDown className="w-4 h-4" style={{ color: "#9b1c1c" }} />
                  ) : (
                    <Minus className="w-4 h-4" style={{ color: "#b0afa9" }} />
                  )}
                </div>
              </div>

              {loading ? (
                <div className="h-7 w-24 rounded" style={{ background: "#f0efe9", animation: "pulse 2s infinite" }} />
              ) : (
                <div
                  className="font-display text-2xl font-light transition-colors duration-300"
                  style={{
                    color: dir === "up" ? "#2d7d46" : dir === "down" ? "#9b1c1c" : "#141414",
                  }}
                >
                  {data?.formatted ?? "—"}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
