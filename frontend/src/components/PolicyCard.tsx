import React, { useState } from "react";
import { ChevronDown, Shield, TrendingDown, TrendingUp, CheckCircle2, Clock, XCircle } from "lucide-react";
import type { Policy } from "../types";
import ClaimFlow from "./ClaimFlow";

interface Props {
  policy: Policy;
  onUpdated?: () => void;
}

const ORACLE_LABELS: Record<string, string> = {
  price_btc: "BTC/USD",
  price_eth: "ETH/USD",
  price_xlm: "XLM/USD",
};

const STATUS_CONFIG: Record<Policy["status"], { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  active: {
    label: "Active",
    color: "#2d7d46",
    bg: "rgba(45,125,70,0.08)",
    icon: <Shield className="w-3 h-3" />,
  },
  claimed: {
    label: "Claimed",
    color: "#1d4ed8",
    bg: "rgba(29,78,216,0.08)",
    icon: <CheckCircle2 className="w-3 h-3" />,
  },
  expired: {
    label: "Expired",
    color: "#878680",
    bg: "rgba(135,134,128,0.1)",
    icon: <Clock className="w-3 h-3" />,
  },
  cancelled: {
    label: "Cancelled",
    color: "#9b1c1c",
    bg: "rgba(155,28,28,0.08)",
    icon: <XCircle className="w-3 h-3" />,
  },
};

export default function PolicyCard({ policy, onUpdated }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [showClaim, setShowClaim] = useState(false);

  const payoutUsdc = (Number(policy.payoutAmount) / 1e7).toFixed(2);
  const thresholdUsd = (Number(policy.threshold) / 1e6).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });

  const status = STATUS_CONFIG[policy.status];

  return (
    <div
      className="rounded-xl bg-white transition-all duration-200"
      style={{ border: "1px solid #e5e4df", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
    >
      {/* Header row */}
      <button
        className="w-full px-6 py-5 flex items-center gap-4 text-left"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Condition icon */}
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: "#f5f4ef" }}
        >
          {policy.condition === "lte" ? (
            <TrendingDown className="w-5 h-5" style={{ color: "#878680" }} />
          ) : (
            <TrendingUp className="w-5 h-5" style={{ color: "#878680" }} />
          )}
        </div>

        {/* Main info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium" style={{ color: "#141414" }}>
              {ORACLE_LABELS[policy.oracleType] ?? policy.oracleType}
            </span>
            <span className="text-xs" style={{ color: "#b0afa9" }}>
              {policy.condition === "lte" ? "drops below" : "rises above"}
            </span>
            <span className="text-sm font-medium" style={{ color: "#141414" }}>
              {thresholdUsd}
            </span>
          </div>
          <div className="text-xs font-mono truncate" style={{ color: "#c0bfba" }}>
            {policy.onChainId.slice(0, 18)}...{policy.onChainId.slice(-6)}
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <span
            className="text-xs px-2.5 py-1 rounded-full flex items-center gap-1.5 font-medium"
            style={{ color: status.color, background: status.bg }}
          >
            {status.icon}
            {status.label}
          </span>
          <span className="text-sm font-medium" style={{ color: "#141414" }}>
            {payoutUsdc} USDC
          </span>
          <ChevronDown
            className="w-4 h-4 transition-transform duration-200"
            style={{ color: "#b0afa9", transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}
          />
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div style={{ borderTop: "1px solid #f0efe9" }}>
          <div className="px-6 py-5">
            <div className="grid grid-cols-3 gap-4 mb-5">
              {[
                ["Oracle", ORACLE_LABELS[policy.oracleType] ?? policy.oracleType],
                ["Condition", policy.condition === "lte" ? "Price Drop" : "Price Rise"],
                ["Threshold", thresholdUsd],
                ["Payout", `${payoutUsdc} USDC`],
                ["Beneficiary", policy.beneficiary.slice(0, 6) + "..." + policy.beneficiary.slice(-4)],
                ["Created", new Date(policy.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })],
              ].map(([k, v]) => (
                <div key={k}>
                  <div className="text-xs font-medium tracking-wider uppercase mb-1" style={{ color: "#b0afa9" }}>
                    {k}
                  </div>
                  <div className="text-sm" style={{ color: "#141414" }}>
                    {v}
                  </div>
                </div>
              ))}
            </div>

            {policy.status === "active" && !showClaim && (
              <button
                onClick={() => setShowClaim(true)}
                className="w-full py-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-opacity hover:opacity-80"
                style={{ background: "#141414", color: "#ffffff" }}
              >
                Submit ZK Claim
                <ChevronDown className="w-4 h-4" />
              </button>
            )}

            {policy.status === "active" && showClaim && (
              <div className="mt-1">
                <ClaimFlow
                  policy={policy}
                  onClaimed={() => { setShowClaim(false); onUpdated?.(); }}
                />
              </div>
            )}

            {policy.status === "claimed" && (
              <div
                className="rounded-lg p-3 flex items-center gap-2 text-sm"
                style={{ background: "rgba(29,78,216,0.05)", border: "1px solid rgba(29,78,216,0.15)", color: "#1d4ed8" }}
              >
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                ZK proof verified on Stellar Soroban. Payout transferred.
                {policy.claimTxHash && (
                  <span className="ml-auto font-mono text-xs" style={{ color: "#93c5fd" }}>
                    {policy.claimTxHash.slice(0, 16)}...
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
