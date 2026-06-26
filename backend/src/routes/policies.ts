import { Router, Request, Response } from "express";
import { Keypair, xdr, nativeToScVal } from "@stellar/stellar-sdk";
import { Policy } from "../models/Policy";
import { fetchOracleValue, getAllPrices, formatPrice } from "../services/oracle";
import { invokeContract, getLedger } from "../services/stellar";
import { buildClaimBundle, policyIdToScVal, SnarkjsProof } from "../services/proofEncoding";
import { config } from "../config";

const router = Router();

/** GET /api/policies — list all policies (optionally filter by insured address) */
router.get("/", async (req: Request, res: Response) => {
  try {
    const { insured, status } = req.query;
    const query: Record<string, unknown> = {};
    if (insured) query.insured = insured;
    if (status) query.status = status;

    const policies = await Policy.find(query).sort({ createdAt: -1 }).limit(50);
    res.json({ success: true, policies });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

/** GET /api/policies/:id — get a single policy by onChainId */
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const policy = await Policy.findOne({ onChainId: req.params.id });
    if (!policy) return res.status(404).json({ success: false, error: "Not found" });
    res.json({ success: true, policy });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

/**
 * POST /api/policies — create a new policy.
 *
 * If CLAIMPROOF_CONTRACT_ID and ADMIN_SECRET_KEY are set, calls create_policy
 * on Soroban (admin acts as insured) and uses the contract-returned policy ID.
 * Otherwise saves to DB only — the claim endpoint will reject until configured.
 */
router.post("/", async (req: Request, res: Response) => {
  try {
    const {
      insured,
      beneficiary,
      token,
      payoutAmount,
      threshold,
      condition,
      expiryLedger,
      oracleType,
      oracleUnit,
    } = req.body;

    let onChainId: string = req.body.onChainId;
    let txHash = "";

    if (config.claimproofContractId && config.adminSecretKey) {
      const adminKp = Keypair.fromSecret(config.adminSecretKey);

      // current ledger + buffer so expiry is meaningfully in the future
      const currentLedger = await getLedger();
      const expiry = expiryLedger ?? currentLedger + 1_000_000;

      const args: xdr.ScVal[] = [
        // insured = admin (admin holds collateral on behalf of the insured for testnet)
        nativeToScVal(adminKp.publicKey(), { type: "address" }),
        nativeToScVal(beneficiary ?? insured, { type: "address" }),
        nativeToScVal(token ?? config.usdcContractId, { type: "address" }),
        nativeToScVal(BigInt(payoutAmount), { type: "i128" }),
        nativeToScVal(BigInt(threshold), { type: "u64" }),
        // Condition enum variant serialises as ScVec([ScSymbol("Lte")])
        xdr.ScVal.scvVec([xdr.ScVal.scvSymbol(condition === "lte" ? "Lte" : "Gte")]),
        xdr.ScVal.scvU32(expiry),
      ];

      const { hash, result } = await invokeContract(
        config.adminSecretKey,
        config.claimproofContractId,
        "create_policy",
        args
      );

      txHash = hash;

      // Contract returns BytesN<32> — scValToNative gives Buffer/Uint8Array
      if (result instanceof Uint8Array || Buffer.isBuffer(result)) {
        onChainId = "0x" + Buffer.from(result as Uint8Array).toString("hex");
      }
    }

    const policy = new Policy({
      onChainId,
      insured,
      beneficiary,
      token: token ?? config.usdcContractId,
      payoutAmount,
      threshold,
      condition,
      expiryLedger,
      oracleType: oracleType ?? "price_btc",
      oracleUnit: oracleUnit ?? "USD",
      txHash,
    });

    await policy.save();
    res.json({ success: true, policy });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

/**
 * POST /api/policies/:id/claim — submit a ZK proof to claim a policy payout.
 *
 * Requires CLAIMPROOF_CONTRACT_ID and ADMIN_SECRET_KEY to be set.
 * Calls the Soroban contract's `claim` function and returns the real tx hash.
 *
 * Body: { proof: SnarkjsProof, publicSignals: string[] }
 *
 * Public signals order from the circuit (must match contract expectations):
 *   [0] triggered         — must be "1"
 *   [1] oracle_commitment — Poseidon(oracle_value, salt)
 *   [2] threshold         — policy trigger level
 *   [3] policy_id         — field-reduced policy identifier
 *   [4] condition_type    — 0=LTE, 1=GTE
 */
router.post("/:id/claim", async (req: Request, res: Response) => {
  try {
    if (!config.claimproofContractId) {
      return res.status(503).json({
        success: false,
        error:
          "Contract not deployed. Set CLAIMPROOF_CONTRACT_ID in .env to enable on-chain claims.",
      });
    }
    if (!config.adminSecretKey) {
      return res.status(503).json({
        success: false,
        error: "Admin key not configured. Set ADMIN_SECRET_KEY in .env.",
      });
    }

    const { proof, publicSignals } = req.body as {
      proof: SnarkjsProof;
      publicSignals: string[];
    };

    if (!proof || !publicSignals || publicSignals.length < 5) {
      return res.status(400).json({
        success: false,
        error: "Missing proof or publicSignals.",
      });
    }

    // Circuit public signals[0] = triggered (1 = condition met, 0 = not met)
    if (publicSignals[0] !== "1") {
      return res.status(400).json({
        success: false,
        error:
          "The oracle condition has not been triggered. The proof shows the threshold was not crossed.",
      });
    }

    const policy = await Policy.findOne({ onChainId: req.params.id });
    if (!policy) return res.status(404).json({ success: false, error: "Policy not found." });

    if (policy.status !== "active") {
      return res.status(400).json({
        success: false,
        error: `Policy is ${policy.status}, not active.`,
      });
    }

    const policyIdArg = policyIdToScVal(policy.onChainId);
    const bundleArg = buildClaimBundle(proof, publicSignals);

    const { hash } = await invokeContract(
      config.adminSecretKey,
      config.claimproofContractId,
      "claim",
      [policyIdArg, bundleArg]
    );

    const updated = await Policy.findOneAndUpdate(
      { onChainId: req.params.id },
      { status: "claimed", claimTxHash: hash },
      { new: true }
    );

    res.json({ success: true, txHash: hash, policy: updated });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

/** PATCH /api/policies/:id/status — update policy status (cancel / expire only) */
router.patch("/:id/status", async (req: Request, res: Response) => {
  try {
    const { status, claimTxHash } = req.body;

    // Claims must go through POST /:id/claim for on-chain verification
    if (status === "claimed") {
      return res.status(400).json({
        success: false,
        error: "Use POST /api/policies/:id/claim to submit a ZK proof and claim on-chain.",
      });
    }

    const update: Record<string, unknown> = { status };
    if (claimTxHash) update.claimTxHash = claimTxHash;

    const policy = await Policy.findOneAndUpdate(
      { onChainId: req.params.id },
      update,
      { new: true }
    );
    if (!policy) return res.status(404).json({ success: false, error: "Not found" });
    res.json({ success: true, policy });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

export default router;
