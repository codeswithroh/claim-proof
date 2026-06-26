/**
 * Oracle service — fetches current prices.
 * Primary: Binance public API (no auth, no rate limit for simple spot prices).
 * Fallback: CoinGecko free API.
 * In production this would use Reflector Network (Stellar-native oracle).
 */

export type OracleType = "price_btc" | "price_eth" | "price_xlm";

// ── Cache ─────────────────────────────────────────────────────────────────────
// Single in-memory cache shared across requests — 60s TTL
const TTL_MS = 60_000;
let cache: { prices: Record<OracleType, bigint>; ts: number } | null = null;

// ── Binance (primary) ─────────────────────────────────────────────────────────
const BINANCE_SYMBOLS: Record<OracleType, string> = {
  price_btc: "BTCUSDT",
  price_eth: "ETHUSDT",
  price_xlm: "XLMUSDT",
};

async function fetchFromBinance(): Promise<Record<OracleType, bigint>> {
  const symbols = JSON.stringify(Object.values(BINANCE_SYMBOLS).map(s => `"${s}"`).join(",").replace(/"/g, '"'));
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

// ── CoinGecko (fallback) ──────────────────────────────────────────────────────
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

// ── Public API ────────────────────────────────────────────────────────────────

export async function getAllPrices(): Promise<Record<OracleType, bigint>> {
  if (cache && Date.now() - cache.ts < TTL_MS) return cache.prices;

  let prices: Record<OracleType, bigint>;
  try {
    prices = await fetchFromBinance();
  } catch {
    prices = await fetchFromCoinGecko();
  }

  cache = { prices, ts: Date.now() };
  return prices;
}

export async function fetchOracleValue(oracle: OracleType): Promise<bigint> {
  const prices = await getAllPrices();
  return prices[oracle];
}

/** Format a scaled price (×1e6) to human-readable USD string. */
export function formatPrice(scaled: bigint | string): string {
  const val = typeof scaled === "string" ? BigInt(scaled) : scaled;
  const dollars = Number(val) / 1_000_000;
  return dollars.toLocaleString("en-US", { style: "currency", currency: "USD" });
}
