import { Router, Request, Response } from "express";
import { getAllPrices, formatPrice } from "../services/oracle";

const router = Router();

/** GET /api/oracle/prices — current oracle prices for all supported assets */
router.get("/prices", async (_req: Request, res: Response) => {
  try {
    const prices = await getAllPrices();
    res.json({
      success: true,
      prices: {
        price_btc: {
          raw: prices.price_btc.toString(),
          formatted: formatPrice(prices.price_btc),
          label: "BTC/USD",
        },
        price_eth: {
          raw: prices.price_eth.toString(),
          formatted: formatPrice(prices.price_eth),
          label: "ETH/USD",
        },
        price_xlm: {
          raw: prices.price_xlm.toString(),
          formatted: formatPrice(prices.price_xlm),
          label: "XLM/USD",
        },
      },
      timestamp: Date.now(),
    });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

/** GET /api/oracle/check?oracle=price_btc&threshold=50000000000&condition=lte
 *  Checks whether the oracle condition is currently triggered.
 */
router.get("/check", async (req: Request, res: Response) => {
  try {
    const { oracle, threshold, condition } = req.query as Record<string, string>;
    const { fetchOracleValue } = await import("../services/oracle.js");
    const current = await fetchOracleValue(oracle as any);
    const thresh = BigInt(threshold);
    const triggered =
      condition === "lte" ? current <= thresh : current >= thresh;

    res.json({
      success: true,
      oracle,
      current: current.toString(),
      threshold: thresh.toString(),
      condition,
      triggered,
    });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

export default router;
