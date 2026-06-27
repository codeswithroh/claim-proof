const mongoose = require("mongoose");

let cached = global._mongoose || (global._mongoose = { conn: null, promise: null });

async function connectDB() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    const uri = process.env.MONGO_URI;
    if (!uri) throw new Error("MONGO_URI env var not set");
    cached.promise = mongoose.connect(uri, { bufferCommands: false });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

const PolicySchema = new mongoose.Schema(
  {
    onChainId:    { type: String, required: true, unique: true, index: true },
    insured:      { type: String, required: true, index: true },
    beneficiary:  { type: String, required: true },
    token:        { type: String, required: true },
    payoutAmount: { type: String, required: true },
    threshold:    { type: String, required: true },
    condition:    { type: String, enum: ["lte", "gte"], required: true },
    expiryLedger: { type: Number, required: true },
    status:       { type: String, enum: ["active", "claimed", "expired", "cancelled"], default: "active" },
    oracleType:   { type: String, default: "price_btc" },
    oracleUnit:   { type: String, default: "USD" },
    txHash:       { type: String, default: "" },
    claimTxHash:  { type: String },
  },
  { timestamps: true }
);

const Policy = mongoose.models.Policy || mongoose.model("Policy", PolicySchema);

module.exports = { connectDB, Policy };
