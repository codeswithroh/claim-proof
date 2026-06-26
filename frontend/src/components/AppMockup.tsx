import React from "react";

export default function AppMockup() {
  return (
    <svg
      viewBox="0 0 700 340"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
      style={{ display: "block" }}
    >
      {/* Background */}
      <rect width="700" height="340" fill="#f5f4ef" />

      {/* Nav bar */}
      <rect width="700" height="44" fill="white" />
      <line x1="0" y1="44" x2="700" y2="44" stroke="#e5e4df" strokeWidth="0.8" />
      <text x="22" y="28" fontFamily="'Cormorant Garamond', serif" fontSize="15" fontWeight="500" fill="#141414">ClaimProof</text>
      <text x="258" y="26" fontFamily="Inter, sans-serif" fontSize="10.5" fill="#878680">Policies</text>
      <text x="320" y="26" fontFamily="Inter, sans-serif" fontSize="10.5" fill="#878680">Oracle</text>
      <circle cx="576" cy="22" r="2.8" fill="#2d7d46" />
      <text x="566" y="26" fontFamily="Inter, sans-serif" fontSize="9" fill="#b0afa9" textAnchor="end">Testnet</text>
      <rect x="607" y="12" width="72" height="21" rx="10.5" fill="#141414" />
      <text x="643" y="26.5" fontFamily="Inter, sans-serif" fontSize="9" fill="white" textAnchor="middle">Connect Wallet</text>

      {/* Oracle prices label */}
      <text x="22" y="64" fontFamily="Inter, sans-serif" fontSize="7.5" fill="#b0afa9" letterSpacing="1.8">LIVE ORACLE PRICES</text>

      {/* Tile 1: BTC */}
      <rect x="22" y="72" width="205" height="62" rx="8" fill="white" stroke="#e5e4df" strokeWidth="0.7" />
      <text x="36" y="91" fontFamily="Inter, sans-serif" fontSize="8.5" fill="#878680">BTC/USD</text>
      <text x="36" y="104" fontFamily="Inter, sans-serif" fontSize="9.5" fontWeight="500" fill="#141414">Bitcoin</text>
      <text x="36" y="124" fontFamily="'Cormorant Garamond', serif" fontSize="19" fill="#141414">$63,007</text>

      {/* Tile 2: ETH */}
      <rect x="240" y="72" width="205" height="62" rx="8" fill="white" stroke="#e5e4df" strokeWidth="0.7" />
      <text x="254" y="91" fontFamily="Inter, sans-serif" fontSize="8.5" fill="#878680">ETH/USD</text>
      <text x="254" y="104" fontFamily="Inter, sans-serif" fontSize="9.5" fontWeight="500" fill="#141414">Ethereum</text>
      <text x="254" y="124" fontFamily="'Cormorant Garamond', serif" fontSize="19" fill="#141414">$1,693</text>

      {/* Tile 3: XLM */}
      <rect x="458" y="72" width="220" height="62" rx="8" fill="white" stroke="#e5e4df" strokeWidth="0.7" />
      <text x="472" y="91" fontFamily="Inter, sans-serif" fontSize="8.5" fill="#878680">XLM/USD</text>
      <text x="472" y="104" fontFamily="Inter, sans-serif" fontSize="9.5" fontWeight="500" fill="#141414">Stellar Lumens</text>
      <text x="472" y="124" fontFamily="'Cormorant Garamond', serif" fontSize="19" fill="#141414">$0.20</text>

      {/* Policies label + button */}
      <text x="22" y="162" fontFamily="Inter, sans-serif" fontSize="8" fontWeight="500" fill="#141414" letterSpacing="1">YOUR POLICIES</text>
      <rect x="628" y="150" width="50" height="20" rx="10" fill="#141414" />
      <text x="653" y="163.5" fontFamily="Inter, sans-serif" fontSize="8.5" fill="white" textAnchor="middle">+ New</text>

      {/* Policy card 1 */}
      <rect x="22" y="172" width="656" height="62" rx="10" fill="white" stroke="#e5e4df" strokeWidth="0.7" />
      <circle cx="52" cy="203" r="14" fill="#f5f4ef" />
      <path d="M46 197 L52 204 L58 197" fill="none" stroke="#878680" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      <text x="78" y="197" fontFamily="Inter, sans-serif" fontSize="10" fontWeight="500" fill="#141414">BTC/USD</text>
      <text x="124" y="197" fontFamily="Inter, sans-serif" fontSize="10" fill="#878680"> drops below </text>
      <text x="214" y="197" fontFamily="Inter, sans-serif" fontSize="10" fontWeight="500" fill="#141414">$50,000.00</text>
      <text x="78" y="214" fontFamily="'Courier New', monospace" fontSize="8" fill="#c0bfba">0x8f2a3e...c491</text>
      <rect x="548" y="193" width="46" height="18" rx="9" fill="rgba(45,125,70,0.1)" />
      <text x="571" y="206" fontFamily="Inter, sans-serif" fontSize="8.5" fill="#2d7d46" textAnchor="middle">Active</text>
      <text x="608" y="206" fontFamily="Inter, sans-serif" fontSize="11" fontWeight="500" fill="#141414">100 USDC</text>

      {/* Policy card 2 */}
      <rect x="22" y="246" width="656" height="62" rx="10" fill="white" stroke="#e5e4df" strokeWidth="0.7" />
      <circle cx="52" cy="277" r="14" fill="#f5f4ef" />
      <path d="M46 283 L52 276 L58 283" fill="none" stroke="#878680" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      <text x="78" y="271" fontFamily="Inter, sans-serif" fontSize="10" fontWeight="500" fill="#141414">ETH/USD</text>
      <text x="122" y="271" fontFamily="Inter, sans-serif" fontSize="10" fill="#878680"> rises above </text>
      <text x="207" y="271" fontFamily="Inter, sans-serif" fontSize="10" fontWeight="500" fill="#141414">$2,000.00</text>
      <text x="78" y="288" fontFamily="'Courier New', monospace" fontSize="8" fill="#c0bfba">0x3d7b1a...82fe</text>
      <rect x="548" y="267" width="46" height="18" rx="9" fill="rgba(29,78,216,0.08)" />
      <text x="571" y="280" fontFamily="Inter, sans-serif" fontSize="8.5" fill="#1d4ed8" textAnchor="middle">Claimed</text>
      <text x="608" y="280" fontFamily="Inter, sans-serif" fontSize="11" fontWeight="500" fill="#141414">500 USDC</text>
    </svg>
  );
}
