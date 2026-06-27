import React, { useState } from "react";
import {
  ChevronDown, TrendingDown, TrendingUp, CheckCircle2,
  Clock, XCircle, Shield, ExternalLink,
} from "lucide-react";
import type { Policy } from "../types";
import type { OraclePrices } from "../types";
import ClaimFlow from "./ClaimFlow";
import ConditionMeter from "./ConditionMeter";

const C = {
  bg:       "#0d0b06",
  card:     "#1a1610",
  card2:    "#221e14",
  text:     "#f0e6c8",
  gold:     "#c9a84c",
  muted:    "#a89060",
  faint:    "#6e5c3a",
  border:   "rgba(201,168,76,0.22)",
  borderHi: "rgba(201,168,76,0.45)",
};

interface Props { policy: Policy; onUpdated?: () => void; prices?: OraclePrices | null; currentLedger?: number; }

const ORACLE_LABELS: Record<string, string> = {
  price_btc: "BTC/USD",
  price_eth: "ETH/USD",
  price_xlm: "XLM/USD",
};

const STATUS_CONFIG: Record<Policy["status"], { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  active:    { label: "Active",    color: C.gold,    bg: "rgba(201,168,76,0.1)",   icon: <Shield       size={10} /> },
  claimed:   { label: "Claimed",   color: "#6ee7b7", bg: "rgba(110,231,183,0.08)", icon: <CheckCircle2 size={10} /> },
  expired:   { label: "Expired",   color: "#6e5c3a", bg: "rgba(110,92,58,0.15)",   icon: <Clock        size={10} /> },
  cancelled: { label: "Cancelled", color: "#fca5a5", bg: "rgba(252,165,165,0.08)", icon: <XCircle      size={10} /> },
};

const EXPLORER_BASE = "https://stellar.expert/explorer/testnet";

function explorerTx(hash: string) { return `${EXPLORER_BASE}/tx/${hash}`; }

export default function PolicyCard({ policy, onUpdated, prices, currentLedger }: Props) {
  const [expanded, setExpanded]   = useState(false);
  const [showClaim, setShowClaim] = useState(false);

  const payoutUsdc   = (Number(policy.payoutAmount) / 1e7).toFixed(2);
  const thresholdUsd = (Number(policy.threshold) / 1e6).toLocaleString("en-US", { style: "currency", currency: "USD" });
  const status       = STATUS_CONFIG[policy.status];

  // Live price for condition meter
  const liveRaw   = prices?.[policy.oracleType as keyof OraclePrices]?.raw;
  const livePrice = liveRaw ? Number(liveRaw) / 1_000_000 : null;
  const threshold = Number(policy.threshold) / 1_000_000;
  const triggered = livePrice !== null &&
    (policy.condition === "lte" ? livePrice <= threshold : livePrice >= threshold);

  // Expiry estimate — 1 Stellar ledger ≈ 5 seconds
  const ledgersLeft = currentLedger ? Math.max(0, policy.expiryLedger - currentLedger) : null;
  const secondsLeft  = ledgersLeft !== null ? ledgersLeft * 5 : null;
  const daysLeft     = secondsLeft !== null ? Math.floor(secondsLeft / 86400) : null;
  const hoursLeft    = secondsLeft !== null ? Math.floor((secondsLeft % 86400) / 3600) : null;
  const expiryLabel  =
    daysLeft === null ? "" :
    daysLeft > 1      ? `${daysLeft}d ${hoursLeft}h left` :
    daysLeft === 1    ? `${hoursLeft}h left` :
    secondsLeft! <= 0 ? "Expired" :
                        `${Math.floor(secondsLeft! / 3600)}h left`;

  return (
    <div
      id={`policy-${policy.onChainId}`}
      style={{
        background: C.card,
        border: `1px solid ${triggered && policy.status === "active" ? "rgba(110,231,183,0.4)" : expanded ? C.borderHi : C.border}`,
        borderBottom: "none",
        transition: "border-color 0.2s",
      }}
    >
      {/* Header row */}
      <button
        style={{ width: "100%", padding: "20px 24px", display: "flex", alignItems: "center", gap: 16, textAlign: "left", background: "transparent", border: "none", cursor: "pointer", borderRadius: 0 }}
        onClick={() => setExpanded(!expanded)}
      >
        <div style={{ width: 36, height: 36, border: `1px solid rgba(201,168,76,0.3)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: C.card2 }}>
          {policy.condition === "lte"
            ? <TrendingDown size={16} style={{ color: triggered ? "#6ee7b7" : C.faint }} />
            : <TrendingUp   size={16} style={{ color: triggered ? "#6ee7b7" : C.faint }} />}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span style={{ fontFamily: "sans-serif", fontSize: 14, fontWeight: 600, color: C.text }}>
              {ORACLE_LABELS[policy.oracleType] ?? policy.oracleType}
            </span>
            <span style={{ fontFamily: "sans-serif", fontSize: 12, color: C.faint }}>
              {policy.condition === "lte" ? "drops below" : "rises above"}
            </span>
            <span style={{ fontFamily: "sans-serif", fontSize: 14, fontWeight: 600, color: triggered ? "#6ee7b7" : C.gold }}>
              {thresholdUsd}
            </span>
            {triggered && policy.status === "active" && (
              <span style={{ fontFamily: "sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "#0d0b06", background: "#6ee7b7", padding: "2px 7px" }}>
                Claimable
              </span>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ fontFamily: "monospace", fontSize: 11, color: C.faint, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 200 }}>
              {policy.onChainId.slice(0, 16)}…{policy.onChainId.slice(-4)}
            </div>
            {expiryLabel && (
              <span style={{ fontFamily: "sans-serif", fontSize: 10, color: C.faint, display: "flex", alignItems: "center", gap: 3 }}>
                <Clock size={10} /> {expiryLabel}
              </span>
            )}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16, flexShrink: 0 }}>
          <span style={{ fontFamily: "sans-serif", fontSize: 9, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", padding: "5px 12px", border: `1px solid`, borderColor: status.color, color: status.color, background: status.bg, display: "inline-flex", alignItems: "center", gap: 6 }}>
            {status.icon} {status.label}
          </span>
          <span className="font-display" style={{ fontSize: 16, fontWeight: 700, color: C.gold }}>
            {payoutUsdc} <span style={{ fontSize: 11, fontWeight: 400, color: C.muted }}>USDC</span>
          </span>
          <ChevronDown size={14} style={{ color: C.faint, transform: expanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }} />
        </div>
      </button>

      {/* Condition meter (always visible for active policies) */}
      {policy.status === "active" && livePrice !== null && (
        <div style={{ padding: "0 24px 16px" }}>
          <ConditionMeter currentPrice={livePrice} threshold={threshold} condition={policy.condition} />
        </div>
      )}

      {/* Expanded detail */}
      {expanded && (
        <div style={{ borderTop: `1px solid ${C.border}` }}>
          <div style={{ padding: "22px 24px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px 20px", marginBottom: 20 }}>
              {[
                ["Oracle",       ORACLE_LABELS[policy.oracleType] ?? policy.oracleType],
                ["Condition",    policy.condition === "lte" ? "Price Drop" : "Price Rise"],
                ["Threshold",    thresholdUsd],
                ["Payout",       `${payoutUsdc} USDC`],
                ["Beneficiary",  policy.beneficiary.slice(0, 6) + "…" + policy.beneficiary.slice(-4)],
                ["Created",      new Date(policy.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })],
              ].map(([k, v]) => (
                <div key={k}>
                  <div style={{ fontFamily: "sans-serif", fontSize: 9, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: C.faint, marginBottom: 5 }}>{k}</div>
                  <div style={{ fontFamily: "sans-serif", fontSize: 13, color: C.text }}>{v}</div>
                </div>
              ))}
            </div>

            {/* Explorer links */}
            <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
              {policy.txHash && (
                <a href={explorerTx(policy.txHash)} target="_blank" rel="noopener noreferrer"
                  style={{ display: "inline-flex", alignItems: "center", gap: 5, fontFamily: "sans-serif", fontSize: 11, color: C.muted, textDecoration: "none", border: `1px solid ${C.border}`, padding: "5px 10px" }}
                  onMouseEnter={e => (e.currentTarget.style.color = C.gold)}
                  onMouseLeave={e => (e.currentTarget.style.color = C.muted)}>
                  <ExternalLink size={11} /> View Creation Tx
                </a>
              )}
              {policy.claimTxHash && (
                <a href={explorerTx(policy.claimTxHash)} target="_blank" rel="noopener noreferrer"
                  style={{ display: "inline-flex", alignItems: "center", gap: 5, fontFamily: "sans-serif", fontSize: 11, color: "#6ee7b7", textDecoration: "none", border: "1px solid rgba(110,231,183,0.3)", padding: "5px 10px" }}>
                  <ExternalLink size={11} /> View Claim Tx
                </a>
              )}
            </div>

            {policy.status === "active" && !showClaim && (
              <button
                onClick={() => setShowClaim(true)}
                style={{ width: "100%", padding: "12px 0", background: triggered ? "#6ee7b7" : C.gold, color: C.bg, border: "none", cursor: "pointer", fontFamily: "sans-serif", fontSize: 10, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 0 }}
              >
                {triggered ? "⚡ Claim Now" : "Submit ZK Claim"}
              </button>
            )}

            {policy.status === "active" && showClaim && (
              <div style={{ marginTop: 4 }}>
                <ClaimFlow policy={policy} onClaimed={() => { setShowClaim(false); onUpdated?.(); }} />
              </div>
            )}

            {policy.status === "claimed" && (
              <div style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: 10, background: "rgba(110,231,183,0.05)", border: "1px solid rgba(110,231,183,0.2)", color: "#6ee7b7" }}>
                <CheckCircle2 size={14} style={{ flexShrink: 0 }} />
                <span style={{ fontFamily: "sans-serif", fontSize: 13 }}>
                  ZK proof verified on Stellar Soroban. Payout transferred to {policy.beneficiary.slice(0, 6)}…{policy.beneficiary.slice(-4)}.
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
