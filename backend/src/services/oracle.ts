/**
 * Oracle service — fetches current prices with 24h history sampling.
 * Primary: Binance public API.
 * Fallback: CoinGecko free API.
 */

export type OracleType = "price_btc" | "price_eth" | "price_xlm";

// ── Price cache ────────────────────────────────────────────────────────────────
const TTL_MS = 30_000; // 30s cache
let cache: { prices: Record<OracleType, bigint>; ts: number } | null = null;

// ── 24h History (ring buffer, 5-min samples = 288 max) ────────────────────────
const HISTORY_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const HISTORY_MAX = 288; // 24 hours

interface HistorySample {
  ts: number;
  prices: Record<OracleType, string>; // stored as string to survive JSON
}

const priceHistory: HistorySample[] = [];
let lastHistorySample = 0;

function recordHistorySample(prices: Record<OracleType, bigint>) {
  const now = Date.now();
  if (now - lastHistorySample < HISTORY_INTERVAL_MS) return;
  lastHistorySample = now;
  priceHistory.push({
    ts: now,
    prices: {
      price_btc: prices.price_btc.toString(),
      price_eth: prices.price_eth.toString(),
      price_xlm: prices.price_xlm.toString(),
    },
  });
  if (priceHistory.length > HISTORY_MAX) priceHistory.shift();
}

export function getPriceHistory(): HistorySample[] {
  return [...priceHistory];
}

// ── Binance (primary) ──────────────────────────────────────────────────────────
async function fetchFromBinance(): Promise<Record<OracleType, bigint>> {
  const url = `https://api.binance.com/api/v3/ticker/price?symbols=${encodeURIComponent('["BTCUSDT","ETHUSDT","XLMUSDT"]')}`;
  const res = await fetch(url, { headers: { "User-Agent": "ClaimProof/1.0" } });
  if (!res.ok) throw new Error(`Binance error: ${res.status}`);
  const data = (await res.json()) as { symbol: string; price: string }[];
  const map: Record<string, number> = {};
  for (const item of data) map[item.symbol] = parseFloat(item.price);
  return {
    price_btc: BigInt(Math.round((map["BTCUSDT"] ?? 0) * 1_000_000)),
    price_eth: BigInt(Math.round((map["ETHUSDT"] ?? 0) * 1_000_000)),
    price_xlm: BigInt(Math.round((map["XLMUSDT"] ?? 0) * 1_000_000)),
  };
}

// ── Binance 24h klines for initial history bootstrap ──────────────────────────
async function bootstrapHistoryFromBinance() {
  if (priceHistory.length > 10) return; // already have data
  const symbols: [OracleType, string][] = [
    ["price_btc", "BTCUSDT"],
    ["price_eth", "ETHUSDT"],
    ["price_xlm", "XLMUSDT"],
  ];
  try {
    const allKlines = await Promise.all(
      symbols.map(async ([, sym]) => {
        const url = `https://api.binance.com/api/v3/klines?symbol=${sym}&interval=5m&limit=288`;
        const res = await fetch(url, { headers: { "User-Agent": "ClaimProof/1.0" } });
        if (!res.ok) throw new Error(`klines ${sym}: ${res.status}`);
        return (await res.json()) as [number, ...string[]][];
      })
    );
    const btcKlines = allKlines[0];
    const ethKlines = allKlines[1];
    const xlmKlines = allKlines[2];
    const len = Math.min(btcKlines.length, ethKlines.length, xlmKlines.length);
    for (let i = 0; i < len; i++) {
      priceHistory.push({
        ts: btcKlines[i][0] as number,
        prices: {
          price_btc: String(Math.round(parseFloat(btcKlines[i][4]) * 1_000_000)),
          price_eth: String(Math.round(parseFloat(ethKlines[i][4]) * 1_000_000)),
          price_xlm: String(Math.round(parseFloat(xlmKlines[i][4]) * 1_000_000)),
        },
      });
    }
    lastHistorySample = Date.now();
    console.log(`✓ Bootstrapped ${priceHistory.length} price history samples`);
  } catch (err) {
    console.warn("⚠ Could not bootstrap price history from Binance:", err);
  }
}

// ── CoinGecko (fallback) ───────────────────────────────────────────────────────
async function fetchFromCoinGecko(): Promise<Record<OracleType, bigint>> {
  const url =
    "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,stellar&vs_currencies=usd";
  const res = await fetch(url, { headers: { "User-Agent": "ClaimProof/1.0" } });
  if (!res.ok) throw new Error(`CoinGecko error: ${res.status}`);
  const data = (await res.json()) as Record<string, { usd: number }>;
  return {
    price_btc: BigInt(Math.round((data.bitcoin?.usd ?? 0) * 1_000_000)),
    price_eth: BigInt(Math.round((data.ethereum?.usd ?? 0) * 1_000_000)),
    price_xlm: BigInt(Math.round((data.stellar?.usd ?? 0) * 1_000_000)),
  };
}

// ── Public API ─────────────────────────────────────────────────────────────────
let bootstrapped = false;

export async function getAllPrices(): Promise<Record<OracleType, bigint>> {
  if (!bootstrapped) {
    bootstrapped = true;
    bootstrapHistoryFromBinance().catch(() => {});
  }

  if (cache && Date.now() - cache.ts < TTL_MS) return cache.prices;

  let prices: Record<OracleType, bigint>;
  try {
    prices = await fetchFromBinance();
  } catch {
    prices = await fetchFromCoinGecko();
  }

  cache = { prices, ts: Date.now() };
  recordHistorySample(prices);
  return prices;
}

export async function fetchOracleValue(oracle: OracleType): Promise<bigint> {
  const prices = await getAllPrices();
  return prices[oracle];
}

export function formatPrice(scaled: bigint | string): string {
  const val = typeof scaled === "string" ? BigInt(scaled) : scaled;
  const dollars = Number(val) / 1_000_000;
  return dollars.toLocaleString("en-US", { style: "currency", currency: "USD" });
}
