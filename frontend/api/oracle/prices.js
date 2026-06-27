async function fetchFromBinance() {
  const url = `https://api.binance.com/api/v3/ticker/price?symbols=${encodeURIComponent('["BTCUSDT","ETHUSDT","XLMUSDT"]')}`;
  const res = await fetch(url, { headers: { "User-Agent": "ClaimProof/1.0" } });
  if (!res.ok) throw new Error(`Binance ${res.status}`);
  const data = await res.json();
  const map = {};
  for (const item of data) map[item.symbol] = parseFloat(item.price);
  return {
    price_btc: Math.round((map["BTCUSDT"] ?? 0) * 1_000_000),
    price_eth: Math.round((map["ETHUSDT"] ?? 0) * 1_000_000),
    price_xlm: Math.round((map["XLMUSDT"] ?? 0) * 1_000_000),
  };
}

async function fetchFromCoinGecko() {
  const url = "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,stellar&vs_currencies=usd";
  const res = await fetch(url, { headers: { "User-Agent": "ClaimProof/1.0" } });
  if (!res.ok) throw new Error(`CoinGecko ${res.status}`);
  const data = await res.json();
  return {
    price_btc: Math.round((data.bitcoin?.usd ?? 0) * 1_000_000),
    price_eth: Math.round((data.ethereum?.usd ?? 0) * 1_000_000),
    price_xlm: Math.round((data.stellar?.usd ?? 0) * 1_000_000),
  };
}

function formatPrice(scaled) {
  return (scaled / 1_000_000).toLocaleString("en-US", { style: "currency", currency: "USD" });
}

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  try {
    let prices;
    try { prices = await fetchFromBinance(); }
    catch { prices = await fetchFromCoinGecko(); }

    res.json({
      success: true,
      prices: {
        price_btc: { raw: String(prices.price_btc), formatted: formatPrice(prices.price_btc), label: "BTC/USD" },
        price_eth: { raw: String(prices.price_eth), formatted: formatPrice(prices.price_eth), label: "ETH/USD" },
        price_xlm: { raw: String(prices.price_xlm), formatted: formatPrice(prices.price_xlm), label: "XLM/USD" },
      },
      timestamp: Date.now(),
    });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
};
