import React from "react";

export default function BlueprintViz() {
  return (
    <div className="relative w-full overflow-hidden" style={{ height: 260 }}>
      <svg
        viewBox="0 0 1200 260"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid meet"
        className="w-full h-full"
      >
        <defs>
          {/* Edge fades */}
          <linearGradient id="bp-fade-l" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#f5f4ef" stopOpacity="1" />
            <stop offset="18%" stopColor="#f5f4ef" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="bp-fade-r" x1="0" y1="0" x2="1" y2="0">
            <stop offset="82%" stopColor="#f5f4ef" stopOpacity="0" />
            <stop offset="100%" stopColor="#f5f4ef" stopOpacity="1" />
          </linearGradient>

          {/* Grid */}
          <pattern id="bp-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#141414" strokeOpacity="0.04" strokeWidth="0.8" />
          </pattern>

          {/* Micro-grid for circuit box */}
          <pattern id="bp-micro" width="12" height="12" patternUnits="userSpaceOnUse">
            <path d="M 12 0 L 0 0 0 12" fill="none" stroke="#141414" strokeOpacity="0.06" strokeWidth="0.5" />
          </pattern>

          {/* Arrow marker */}
          <marker id="bp-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <path d="M 0 0.5 L 5 3 L 0 5.5" fill="none" stroke="#141414" strokeOpacity="0.22" strokeWidth="0.8" />
          </marker>
        </defs>

        {/* Grid background */}
        <rect width="1200" height="260" fill="url(#bp-grid)" />

        {/* Top dimension line */}
        <line x1="80" y1="28" x2="1120" y2="28" stroke="#141414" strokeOpacity="0.1" strokeWidth="0.6" />
        <line x1="80" y1="24" x2="80" y2="32" stroke="#141414" strokeOpacity="0.12" strokeWidth="0.6" />
        <line x1="1120" y1="24" x2="1120" y2="32" stroke="#141414" strokeOpacity="0.12" strokeWidth="0.6" />
        <text x="600" y="20" textAnchor="middle" fontFamily="Inter, sans-serif" fontSize="8" fill="#141414" fillOpacity="0.28" letterSpacing="2.5">ZERO-KNOWLEDGE PROOF PIPELINE</text>

        {/* ── Node 1: Inputs ───────────────────────────────────── */}
        <rect x="80" y="68" width="148" height="124" rx="3"
          fill="white" fillOpacity="0.65"
          stroke="#141414" strokeOpacity="0.12" strokeWidth="0.8" strokeDasharray="5 3" />
        <text x="154" y="92" textAnchor="middle" fontFamily="Inter, sans-serif" fontSize="8" fill="#141414" fillOpacity="0.35" letterSpacing="2" fontWeight="500">INPUTS</text>
        <line x1="98" y1="100" x2="210" y2="100" stroke="#141414" strokeOpacity="0.08" strokeWidth="0.5" />
        <text x="154" y="117" textAnchor="middle" fontFamily="'Cormorant Garamond', serif" fontSize="14" fill="#141414" fillOpacity="0.55" fontStyle="italic">oracle_value</text>
        <text x="154" y="133" textAnchor="middle" fontFamily="Inter, sans-serif" fontSize="7.5" fill="#141414" fillOpacity="0.25" letterSpacing="0.5">private</text>
        <line x1="98" y1="144" x2="210" y2="144" stroke="#141414" strokeOpacity="0.07" strokeWidth="0.5" />
        <text x="154" y="159" textAnchor="middle" fontFamily="'Cormorant Garamond', serif" fontSize="14" fill="#141414" fillOpacity="0.45" fontStyle="italic">salt</text>
        <text x="154" y="173" textAnchor="middle" fontFamily="Inter, sans-serif" fontSize="7.5" fill="#141414" fillOpacity="0.2" letterSpacing="0.5">private</text>

        {/* Step label */}
        <text x="154" y="215" textAnchor="middle" fontFamily="Inter, sans-serif" fontSize="8.5" fill="#141414" fillOpacity="0.3" letterSpacing="1">01 / INPUT</text>

        {/* Arrow 1 → 2 */}
        <line x1="228" y1="130" x2="268" y2="130" stroke="#141414" strokeOpacity="0.18" strokeWidth="0.9" markerEnd="url(#bp-arrow)" />

        {/* ── Node 2: Circuit ──────────────────────────────────── */}
        <rect x="270" y="52" width="180" height="156" rx="3"
          fill="url(#bp-micro)" fillOpacity="1"
          stroke="#141414" strokeOpacity="0.18" strokeWidth="0.8" />
        <rect x="270" y="52" width="180" height="156" rx="3"
          fill="white" fillOpacity="0.55" />
        {/* Public inputs label above */}
        <line x1="310" y1="40" x2="410" y2="40" stroke="#141414" strokeOpacity="0.12" strokeWidth="0.5" />
        <line x1="310" y1="36" x2="310" y2="52" stroke="#141414" strokeOpacity="0.1" strokeWidth="0.5" />
        <line x1="410" y1="36" x2="410" y2="52" stroke="#141414" strokeOpacity="0.1" strokeWidth="0.5" />
        <text x="360" y="33" textAnchor="middle" fontFamily="Inter, sans-serif" fontSize="7.5" fill="#141414" fillOpacity="0.28" letterSpacing="1">PUBLIC INPUTS</text>
        {/* Circuit content */}
        <text x="360" y="96" textAnchor="middle" fontFamily="Inter, sans-serif" fontSize="8" fill="#141414" fillOpacity="0.32" letterSpacing="2" fontWeight="500">CIRCUIT</text>
        <text x="360" y="118" textAnchor="middle" fontFamily="'Cormorant Garamond', serif" fontSize="17" fill="#141414" fillOpacity="0.6">ConditionCheck</text>
        <line x1="292" y1="128" x2="428" y2="128" stroke="#141414" strokeOpacity="0.08" strokeWidth="0.5" />
        <text x="360" y="144" textAnchor="middle" fontFamily="Inter, sans-serif" fontSize="8" fill="#141414" fillOpacity="0.28" letterSpacing="0.5">505 constraints</text>
        <text x="360" y="159" textAnchor="middle" fontFamily="Inter, sans-serif" fontSize="8" fill="#141414" fillOpacity="0.22" letterSpacing="0.5">BN254 curve</text>
        <text x="360" y="174" textAnchor="middle" fontFamily="Inter, sans-serif" fontSize="8" fill="#141414" fillOpacity="0.18" letterSpacing="0.5">Groth16</text>
        <text x="360" y="215" textAnchor="middle" fontFamily="Inter, sans-serif" fontSize="8.5" fill="#141414" fillOpacity="0.3" letterSpacing="1">02 / CIRCUIT</text>

        {/* Arrow 2 → 3 */}
        <line x1="450" y1="130" x2="490" y2="130" stroke="#141414" strokeOpacity="0.18" strokeWidth="0.9" markerEnd="url(#bp-arrow)" />

        {/* ── Node 3: Prover ───────────────────────────────────── */}
        <rect x="492" y="82" width="148" height="96" rx="3"
          fill="white" fillOpacity="0.7"
          stroke="#141414" strokeOpacity="0.14" strokeWidth="0.8" />
        <text x="566" y="108" textAnchor="middle" fontFamily="Inter, sans-serif" fontSize="8" fill="#141414" fillOpacity="0.32" letterSpacing="2" fontWeight="500">PROVER</text>
        <text x="566" y="128" textAnchor="middle" fontFamily="'Cormorant Garamond', serif" fontSize="16" fill="#141414" fillOpacity="0.58">groth16.prove()</text>
        <text x="566" y="148" textAnchor="middle" fontFamily="Inter, sans-serif" fontSize="7.5" fill="#141414" fillOpacity="0.22" letterSpacing="0.5">snarkjs in-browser</text>
        <text x="566" y="162" textAnchor="middle" fontFamily="Inter, sans-serif" fontSize="7.5" fill="#141414" fillOpacity="0.18" letterSpacing="0.5">~2 seconds</text>
        <text x="566" y="215" textAnchor="middle" fontFamily="Inter, sans-serif" fontSize="8.5" fill="#141414" fillOpacity="0.3" letterSpacing="1">03 / PROVE</text>

        {/* Arrow 3 → 4 */}
        <line x1="640" y1="130" x2="680" y2="130" stroke="#141414" strokeOpacity="0.18" strokeWidth="0.9" markerEnd="url(#bp-arrow)" />

        {/* ── Node 4: Proof bundle ─────────────────────────────── */}
        <rect x="682" y="68" width="140" height="124" rx="3"
          fill="white" fillOpacity="0.6"
          stroke="#141414" strokeOpacity="0.1" strokeWidth="0.8" strokeDasharray="3 2" />
        <text x="752" y="92" textAnchor="middle" fontFamily="Inter, sans-serif" fontSize="8" fill="#141414" fillOpacity="0.32" letterSpacing="2" fontWeight="500">PROOF</text>
        <text x="752" y="118" textAnchor="middle" fontFamily="'Cormorant Garamond', serif" fontSize="28" fill="#141414" fillOpacity="0.5" fontStyle="italic">π</text>
        <line x1="700" y1="128" x2="804" y2="128" stroke="#141414" strokeOpacity="0.08" strokeWidth="0.5" />
        <text x="752" y="144" textAnchor="middle" fontFamily="Inter, sans-serif" fontSize="7.5" fill="#141414" fillOpacity="0.25" letterSpacing="0.5">π_A · π_B · π_C</text>
        <text x="752" y="160" textAnchor="middle" fontFamily="Inter, sans-serif" fontSize="7.5" fill="#141414" fillOpacity="0.18" letterSpacing="0.5">~800 bytes</text>
        <text x="752" y="215" textAnchor="middle" fontFamily="Inter, sans-serif" fontSize="8.5" fill="#141414" fillOpacity="0.3" letterSpacing="1">04 / PROOF</text>

        {/* Arrow 4 → 5 */}
        <line x1="822" y1="130" x2="862" y2="130" stroke="#141414" strokeOpacity="0.18" strokeWidth="0.9" markerEnd="url(#bp-arrow)" />

        {/* ── Node 5: Verifier ─────────────────────────────────── */}
        <rect x="864" y="74" width="160" height="112" rx="3"
          fill="white" fillOpacity="0.7"
          stroke="#141414" strokeOpacity="0.16" strokeWidth="0.8" />
        <text x="944" y="100" textAnchor="middle" fontFamily="Inter, sans-serif" fontSize="8" fill="#141414" fillOpacity="0.32" letterSpacing="2" fontWeight="500">VERIFIER</text>
        <text x="944" y="122" textAnchor="middle" fontFamily="'Cormorant Garamond', serif" fontSize="16" fill="#141414" fillOpacity="0.58">pairing_check()</text>
        <line x1="882" y1="131" x2="1006" y2="131" stroke="#141414" strokeOpacity="0.08" strokeWidth="0.5" />
        <text x="944" y="146" textAnchor="middle" fontFamily="Inter, sans-serif" fontSize="7.5" fill="#141414" fillOpacity="0.25" letterSpacing="0.5">Stellar Soroban</text>
        <text x="944" y="161" textAnchor="middle" fontFamily="Inter, sans-serif" fontSize="7.5" fill="#141414" fillOpacity="0.18" letterSpacing="0.5">Protocol 25 · BN254</text>
        <text x="944" y="215" textAnchor="middle" fontFamily="Inter, sans-serif" fontSize="8.5" fill="#141414" fillOpacity="0.3" letterSpacing="1">05 / VERIFY</text>

        {/* Arrow 5 → output */}
        <line x1="1024" y1="130" x2="1060" y2="130" stroke="#141414" strokeOpacity="0.18" strokeWidth="0.9" markerEnd="url(#bp-arrow)" />

        {/* ── Output ───────────────────────────────────────────── */}
        <text x="1082" y="124" textAnchor="middle" fontFamily="Inter, sans-serif" fontSize="8" fill="#141414" fillOpacity="0.35" letterSpacing="1.5" fontWeight="500">PAYOUT</text>
        <text x="1082" y="142" textAnchor="middle" fontFamily="'Cormorant Garamond', serif" fontSize="18" fill="#141414" fillOpacity="0.55">USDC</text>

        {/* Title block (architectural style, bottom-right) */}
        <rect x="1040" y="186" width="120" height="48" rx="0" fill="none" stroke="#141414" strokeOpacity="0.08" strokeWidth="0.5" />
        <line x1="1040" y1="200" x2="1160" y2="200" stroke="#141414" strokeOpacity="0.06" strokeWidth="0.5" />
        <text x="1100" y="196" textAnchor="middle" fontFamily="Inter, sans-serif" fontSize="7" fill="#141414" fillOpacity="0.22" letterSpacing="1.5">CLAIMPROOF</text>
        <text x="1100" y="212" textAnchor="middle" fontFamily="Inter, sans-serif" fontSize="6.5" fill="#141414" fillOpacity="0.15" letterSpacing="0.5">ZK-001 / REV 1.0</text>
        <text x="1100" y="225" textAnchor="middle" fontFamily="Inter, sans-serif" fontSize="6.5" fill="#141414" fillOpacity="0.15" letterSpacing="0.5">STELLAR TESTNET</text>

        {/* Edge fade overlays */}
        <rect x="0" y="0" width="160" height="260" fill="url(#bp-fade-l)" />
        <rect x="1040" y="0" width="160" height="260" fill="url(#bp-fade-r)" />
      </svg>
    </div>
  );
}
