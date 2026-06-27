const { connectDB, Policy } = require("../../_lib/mongo");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ success: false, error: "Method not allowed" });

  const { id } = req.query;

  try {
    await connectDB();

    const { proof, publicSignals } = req.body;
    if (!proof || !publicSignals || publicSignals.length < 1) {
      return res.status(400).json({ success: false, error: "Missing proof or publicSignals" });
    }
    if (publicSignals[0] !== "1") {
      return res.status(400).json({ success: false, error: "Oracle condition not triggered. Proof shows threshold was not crossed." });
    }

    const policy = await Policy.findOne({ onChainId: id });
    if (!policy) return res.status(404).json({ success: false, error: "Policy not found" });
    if (policy.status !== "active") {
      return res.status(400).json({ success: false, error: `Policy is ${policy.status}, not active` });
    }

    // Generate a deterministic mock tx hash from the proof signals
    const mockHash = Buffer.from(
      publicSignals.slice(0, 3).join("").padEnd(64, "0").slice(0, 64), "utf8"
    ).toString("hex").slice(0, 64);

    const updated = await Policy.findOneAndUpdate(
      { onChainId: id },
      { status: "claimed", claimTxHash: mockHash },
      { new: true }
    );

    res.json({ success: true, txHash: mockHash, policy: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
};
