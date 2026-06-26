import mongoose, { Schema, Document } from "mongoose";

export interface IPolicy extends Document {
  onChainId: string;       // BytesN<32> hex from Soroban
  insured: string;         // Stellar address
  beneficiary: string;
  token: string;           // token contract address
  payoutAmount: string;    // in stroops / smallest unit
  threshold: string;       // oracle trigger level (scaled integer)
  condition: "lte" | "gte";
  expiryLedger: number;
  status: "active" | "claimed" | "expired" | "cancelled";
  oracleType: string;      // "price_btc", "price_eth", etc.
  oracleUnit: string;      // human-readable unit label
  txHash: string;
  claimTxHash?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PolicySchema = new Schema<IPolicy>(
  {
    onChainId: { type: String, required: true, unique: true, index: true },
    insured: { type: String, required: true, index: true },
    beneficiary: { type: String, required: true },
    token: { type: String, required: true },
    payoutAmount: { type: String, required: true },
    threshold: { type: String, required: true },
    condition: { type: String, enum: ["lte", "gte"], required: true },
    expiryLedger: { type: Number, required: true },
    status: {
      type: String,
      enum: ["active", "claimed", "expired", "cancelled"],
      default: "active",
    },
    oracleType: { type: String, default: "price_btc" },
    oracleUnit: { type: String, default: "USD" },
    txHash: { type: String, default: "" },
    claimTxHash: { type: String },
  },
  { timestamps: true }
);

export const Policy = mongoose.model<IPolicy>("Policy", PolicySchema);
