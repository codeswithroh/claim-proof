module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  try {
    const symbols = [
      ["price_btc", "BTCUSDT"],
      ["price_eth", "ETHUSDT"],
      ["price_xlm", "XLMUSDT"],
    ];

    const allKlines = await Promise.all(
      symbols.map(async ([, sym]) => {
        const url = `https://api.binance.com/api/v3/klines?symbol=${sym}&interval=5m&limit=288`;
        const r = await fetch(url, { headers: { "User-Agent": "ClaimProof/1.0" } });
        if (!r.ok) throw new Error(`klines ${sym}: ${r.status}`);
        return r.json();
      })
    );

    const [btc, eth, xlm] = allKlines;
    const len = Math.min(btc.length, eth.length, xlm.length);
    const history = [];
    for (let i = 0; i < len; i++) {
      history.push({
        ts: btc[i][0],
        prices: {
          price_btc: String(Math.round(parseFloat(btc[i][4]) * 1_000_000)),
          price_eth: String(Math.round(parseFloat(eth[i][4]) * 1_000_000)),
          price_xlm: String(Math.round(parseFloat(xlm[i][4]) * 1_000_000)),
        },
      });
    }

    res.json({ success: true, history });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
};
