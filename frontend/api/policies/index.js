const { connectDB, Policy } = require("../_lib/mongo");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    await connectDB();

    if (req.method === "GET") {
      const { insured, status } = req.query;
      const query = {};
      if (insured) query.insured = insured;
      if (status) query.status = status;
      const policies = await Policy.find(query).sort({ createdAt: -1 }).limit(50);
      return res.json({ success: true, policies });
    }

    if (req.method === "POST") {
      const {
        onChainId, insured, beneficiary, token, payoutAmount,
        threshold, condition, expiryLedger, oracleType, oracleUnit, txHash,
      } = req.body;

      const USDC = process.env.USDC_CONTRACT_ID || "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC";
      const id = onChainId || `0x${Date.now().toString(16)}${Math.floor(Math.random()*0xffffff).toString(16)}`;

      const policy = await Policy.findOneAndUpdate(
        { onChainId: id },
        {
          $setOnInsert: {
            onChainId: id, insured, beneficiary,
            token: token || USDC,
            payoutAmount, threshold, condition,
            expiryLedger: expiryLedger || 9999999,
            oracleType: oracleType || "price_btc",
            oracleUnit: oracleUnit || "USD",
            txHash: txHash || "",
            status: "active",
          },
        },
        { upsert: true, new: true }
      );
      return res.json({ success: true, policy });
    }

    res.status(405).json({ success: false, error: "Method not allowed" });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
};
