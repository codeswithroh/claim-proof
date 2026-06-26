import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import { config } from "./config";
import policyRoutes from "./routes/policies";
import oracleRoutes from "./routes/oracle";

const app = express();

app.use(cors());
app.use(express.json({ limit: "2mb" })); // proofs are large

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api/policies", policyRoutes);
app.use("/api/oracle", oracleRoutes);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", network: config.stellarNetwork });
});

// ── Start ─────────────────────────────────────────────────────────────────────
async function main() {
  try {
    await mongoose.connect(config.mongoUri);
    console.log("✓ MongoDB connected:", config.mongoUri.split("@")[1] ?? config.mongoUri);
  } catch (err) {
    console.warn("⚠ MongoDB connection failed, running without DB:", err);
  }

  app.listen(config.port, () => {
    console.log(`✓ ClaimProof API running on http://localhost:${config.port}`);
    console.log(`  Network: ${config.stellarNetwork}`);
    console.log(`  Contract: ${config.claimproofContractId || "(not set — deploy first)"}`);
  });
}

main();
