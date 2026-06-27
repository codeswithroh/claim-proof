import React, { useState } from "react";
import {
  ChevronDown, TrendingDown, TrendingUp, CheckCircle2,
  Clock, XCircle, Shield, ExternalLink,
} from "lucide-react";
import type { Policy } from "../types";
import type { OraclePrices } from "../types";
import ClaimFlow from "./ClaimFlow";
import ConditionMeter from "./ConditionMeter";

const LD = {
  bg:      "#FDF7F4",
  surface: "#FFFFFF",
  text:    "#18181B",
  sub:     "#71717A",
  faint:   "#A1A1AA",
  border:  "#E4E4E7",
  gold:    "#C9A84C",
  goldBg:  "rgba(201,168,76,0.09)",
};

interface Props { policy: Policy; onUpdated?: () => void; prices?: OraclePrices | null; currentLedger?: number; }

const ORACLE_LABELS: Record<string, string> = {
  price_btc: "BTC/USD",
  price_eth: "ETH/USD",
  price_xlm: "XLM/USD",
};

const STATUS_CONFIG: Record<Policy["status"], { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  active:    { label: "Active",    color: "#C9A84C", bg: "rgba(201,168,76,0.09)", icon: <Shield       size={10} /> },
  claimed:   { label: "Claimed",   color: "#16a34a", bg: "rgba(22,163,74,0.08)", icon: <CheckCircle2 size={10} /> },
  expired:   { label: "Expired",   color: "#A1A1AA", bg: "rgba(161,161,170,0.1)", icon: <Clock        size={10} /> },
  cancelled: { label: "Cancelled", color: "#ef4444", bg: "rgba(239,68,68,0.07)", icon: <XCircle      size={10} /> },
};

const EXPLORER_BASE = "https://stellar.expert/explorer/testnet";

function explorerTx(hash: string) { return `${EXPLORER_BASE}/tx/${hash}`; }

export default function PolicyCard({ policy, onUpdated, prices, currentLedger }: Props) {
  const [expanded, setExpanded]   = useState(false);
  const [showClaim, setShowClaim] = useState(false);

  const payoutUsdc   = (Number(policy.payoutAmount) / 1e7).toFixed(2);
  const thresholdUsd = (Number(policy.threshold) / 1e6).toLocaleString("en-US", { style: "currency", currency: "USD" });
  const status       = STATUS_CONFIG[policy.status];

  const liveRaw   = prices?.[policy.oracleType as keyof OraclePrices]?.raw;
  const livePrice = liveRaw ? Number(liveRaw) / 1_000_000 : null;
  const threshold = Number(policy.threshold) / 1_000_000;
  const triggered = livePrice !== null &&
    (policy.condition === "lte" ? livePrice <= threshold : livePrice >= threshold);

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

  const borderColor = triggered && policy.status === "active"
    ? "rgba(22,163,74,0.35)"
    : expanded
    ? "rgba(201,168,76,0.4)"
    : LD.border;

  return (
    <div
      id={`policy-${policy.onChainId}`}
      style={{
        background: LD.surface,
        border: `1px solid ${borderColor}`,
        borderBottom: "none",
        transition: "border-color 0.2s",
      }}
    >
      {/* Header row */}
      <button
        style={{ width: "100%", padding: "20px 24px", display: "flex", alignItems: "center", gap: 16, textAlign: "left", background: "transparent", border: "none", cursor: "pointer" }}
        onClick={() => setExpanded(!expanded)}
      >
        <div style={{
          width: 36, height: 36,
          background: triggered && policy.status === "active" ? "rgba(22,163,74,0.1)" : LD.goldBg,
          border: `1px solid ${triggered && policy.status === "active" ? "rgba(22,163,74,0.2)" : "rgba(201,168,76,0.2)"}`,
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          {policy.condition === "lte"
            ? <TrendingDown size={16} style={{ color: triggered ? "#16a34a" : LD.gold }} />
            : <TrendingUp   size={16} style={{ color: triggered ? "#16a34a" : LD.gold }} />}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14, fontWeight: 700, color: LD.text }}>
              {ORACLE_LABELS[policy.oracleType] ?? policy.oracleType}
            </span>
            <span style={{ fontFamily: "'Work Sans', sans-serif", fontSize: 12, color: LD.faint }}>
              {policy.condition === "lte" ? "drops below" : "rises above"}
            </span>
            <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14, fontWeight: 700, color: triggered ? "#16a34a" : LD.gold }}>
              {thresholdUsd}
            </span>
            {triggered && policy.status === "active" && (
              <span style={{ fontFamily: "'Work Sans', sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#fff", background: "#16a34a", padding: "2px 8px" }}>
                Claimable
              </span>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ fontFamily: "monospace", fontSize: 11, color: LD.faint, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 200 }}>
              {policy.onChainId.slice(0, 16)}…{policy.onChainId.slice(-4)}
            </div>
            {expiryLabel && (
              <span style={{ fontFamily: "'Work Sans', sans-serif", fontSize: 10, color: LD.faint, display: "flex", alignItems: "center", gap: 3 }}>
                <Clock size={10} /> {expiryLabel}
              </span>
            )}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16, flexShrink: 0 }}>
          <span style={{ fontFamily: "'Work Sans', sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", padding: "5px 12px", border: `1px solid ${status.color}`, color: status.color, background: status.bg, display: "inline-flex", alignItems: "center", gap: 5 }}>
            {status.icon} {status.label}
          </span>
          <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 16, fontWeight: 800, color: LD.gold }}>
            {payoutUsdc} <span style={{ fontSize: 11, fontWeight: 400, color: LD.faint }}>USDC</span>
          </span>
          <ChevronDown size={14} style={{ color: LD.faint, transform: expanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }} />
        </div>
      </button>

      {/* Condition meter */}
      {policy.status === "active" && livePrice !== null && (
        <div style={{ padding: "0 24px 16px" }}>
          <ConditionMeter currentPrice={livePrice} threshold={threshold} condition={policy.condition} />
        </div>
      )}

      {/* Expanded detail */}
      {expanded && (
        <div style={{ borderTop: `1px solid ${LD.border}` }}>
          <div style={{ padding: "22px 24px", background: LD.bg }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px 20px", marginBottom: 20 }}>
              {[
                ["Oracle",      ORACLE_LABELS[policy.oracleType] ?? policy.oracleType],
                ["Condition",   policy.condition === "lte" ? "Price Drop" : "Price Rise"],
                ["Threshold",   thresholdUsd],
                ["Payout",      `${payoutUsdc} USDC`],
                ["Beneficiary", policy.beneficiary.slice(0, 6) + "…" + policy.beneficiary.slice(-4)],
                ["Created",     new Date(policy.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })],
              ].map(([k, v]) => (
                <div key={k}>
                  <div style={{ fontFamily: "'Work Sans', sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: LD.faint, marginBottom: 5 }}>{k}</div>
                  <div style={{ fontFamily: "'Work Sans', sans-serif", fontSize: 13, fontWeight: 500, color: LD.text }}>{v}</div>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
              {policy.txHash && (
                <a href={explorerTx(policy.txHash)} target="_blank" rel="noopener noreferrer"
                  style={{ display: "inline-flex", alignItems: "center", gap: 5, fontFamily: "'Work Sans', sans-serif", fontSize: 11, color: LD.sub, textDecoration: "none", border: `1px solid ${LD.border}`, padding: "5px 10px" }}
                  onMouseEnter={e => (e.currentTarget.style.color = LD.gold)}
                  onMouseLeave={e => (e.currentTarget.style.color = LD.sub)}>
                  <ExternalLink size={11} /> View Creation Tx
                </a>
              )}
              {policy.claimTxHash && (
                <a href={explorerTx(policy.claimTxHash)} target="_blank" rel="noopener noreferrer"
                  style={{ display: "inline-flex", alignItems: "center", gap: 5, fontFamily: "'Work Sans', sans-serif", fontSize: 11, color: "#16a34a", textDecoration: "none", border: "1px solid rgba(22,163,74,0.3)", padding: "5px 10px" }}>
                  <ExternalLink size={11} /> View Claim Tx
                </a>
              )}
            </div>

            {policy.status === "active" && !showClaim && (
              <button
                onClick={() => setShowClaim(true)}
                style={{ width: "100%", padding: "13px 0", background: triggered ? "#16a34a" : LD.text, color: "#fff", border: "none", cursor: "pointer", fontFamily: "'Work Sans', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
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
              <div style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: 10, background: "rgba(22,163,74,0.06)", border: "1px solid rgba(22,163,74,0.2)", color: "#15803d" }}>
                <CheckCircle2 size={14} style={{ flexShrink: 0 }} />
                <span style={{ fontFamily: "'Work Sans', sans-serif", fontSize: 13 }}>
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
