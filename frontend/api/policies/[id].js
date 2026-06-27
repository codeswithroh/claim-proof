const { connectDB, Policy } = require("../_lib/mongo");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,PATCH,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const { id } = req.query;

  try {
    await connectDB();

    if (req.method === "GET") {
      const policy = await Policy.findOne({ onChainId: id });
      if (!policy) return res.status(404).json({ success: false, error: "Not found" });
      return res.json({ success: true, policy });
    }

    if (req.method === "PATCH") {
      const { status, claimTxHash } = req.body;
      if (status === "claimed") {
        return res.status(400).json({ success: false, error: "Use POST /api/policies/:id/claim" });
      }
      const update = { status };
      if (claimTxHash) update.claimTxHash = claimTxHash;
      const policy = await Policy.findOneAndUpdate({ onChainId: id }, update, { new: true });
      if (!policy) return res.status(404).json({ success: false, error: "Not found" });
      return res.json({ success: true, policy });
    }

    res.status(405).json({ success: false, error: "Method not allowed" });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
};
