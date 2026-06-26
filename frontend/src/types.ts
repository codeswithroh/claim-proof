export interface Policy {
  _id: string;
  onChainId: string;
  insured: string;
  beneficiary: string;
  token: string;
  payoutAmount: string;
  threshold: string;
  condition: "lte" | "gte";
  expiryLedger: number;
  status: "active" | "claimed" | "expired" | "cancelled";
  oracleType: string;
  oracleUnit: string;
  txHash: string;
  claimTxHash?: string;
  createdAt: string;
}

export interface OraclePrices {
  price_btc: { raw: string; formatted: string; label: string };
  price_eth: { raw: string; formatted: string; label: string };
  price_xlm: { raw: string; formatted: string; label: string };
}

export interface ZkProof {
  pi_a: [string, string, string];
  pi_b: [[string, string], [string, string], [string, string]];
  pi_c: [string, string, string];
  protocol: string;
  curve: string;
}
