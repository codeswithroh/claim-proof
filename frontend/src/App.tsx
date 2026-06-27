import React, { useState, useEffect, useCallback, useRef } from "react";
import { Routes, Route, NavLink, useNavigate, Link } from "react-router-dom";
import {
  ArrowRight,
  Shield,
  Eye,
  Cpu,
  Zap,
  CheckCircle2,
  Lock,
  FileText,
  Plus,
  Copy,
  LogOut,
  Check,
} from "lucide-react";
import PriceOracle from "./components/PriceOracle";
import CreatePolicy from "./components/CreatePolicy";
import PolicyCard from "./components/PolicyCard";
import WalletModal from "./components/WalletModal";
import ClaimableBanner from "./components/ClaimableBanner";
import { useOracle } from "./hooks/useOracle";
import type { Policy } from "./types";

// ── Art Deco palette ──────────────────────────────────────────────────────────
const C = {
  bg:       "#0d0b06",
  card:     "#1a1610",
  card2:    "#221e14",
  text:     "#f0e6c8",
  gold:     "#c9a84c",
  goldLt:   "#e2c56a",
  muted:    "#a89060",
  faint:    "#6e5c3a",
  border:   "rgba(201,168,76,0.22)",
  borderHi: "rgba(201,168,76,0.45)",
};

// ── Shared button styles ──────────────────────────────────────────────────────
const btnGold: React.CSSProperties = {
  fontFamily: "sans-serif",
  fontSize: 10, fontWeight: 600,
  letterSpacing: "0.2em", textTransform: "uppercase",
  background: C.gold, color: C.bg,
  border: "none", cursor: "pointer",
  display: "inline-flex", alignItems: "center", gap: 8,
  padding: "13px 32px", borderRadius: 0, textDecoration: "none",
};
const btnOutline: React.CSSProperties = {
  fontFamily: "sans-serif",
  fontSize: 10, fontWeight: 600,
  letterSpacing: "0.2em", textTransform: "uppercase",
  background: "transparent", color: C.gold,
  border: `1px solid rgba(201,168,76,0.45)`,
  cursor: "pointer",
  display: "inline-flex", alignItems: "center", gap: 8,
  padding: "12px 30px", borderRadius: 0, textDecoration: "none",
};

// ── Art Deco helpers ──────────────────────────────────────────────────────────

function AdLogoMark({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" fill="none">
      <polygon points="11,1 21,11 11,21 1,11" stroke={C.gold} strokeWidth="1.4" fill="none"/>
      <polygon points="11,5 17,11 11,17 5,11" stroke={C.gold} strokeWidth="1" fill="none" opacity="0.45"/>
      <rect x="9.5" y="9.5" width="3" height="3" fill={C.gold}/>
    </svg>
  );
}

function AdFan({ size = 220 }: { size?: number }) {
  const h = size / 2;
  const cx = size / 2;
  const cy = size;
  const s = (r: number) => r * size;
  return (
    <svg width={size} height={h} viewBox={`0 0 ${size} ${h}`} fill="none"
      style={{ animation: "fan-pulse 5s ease-in-out infinite alternate" }}>
      <g opacity="0.72">
        <line x1={cx} y1={cy} x2={cx}     y2="0"      stroke={C.gold} strokeWidth="0.8"/>
        <line x1={cx} y1={cy} x2="0"      y2={s(0.56)} stroke={C.gold} strokeWidth="0.8"/>
        <line x1={cx} y1={cy} x2={size}   y2={s(0.56)} stroke={C.gold} strokeWidth="0.8"/>
        <line x1={cx} y1={cy} x2={s(0.12)} y2={s(0.12)} stroke={C.gold} strokeWidth="0.8"/>
        <line x1={cx} y1={cy} x2={s(0.88)} y2={s(0.12)} stroke={C.gold} strokeWidth="0.8"/>
        <line x1={cx} y1={cy} x2={s(0.03)} y2={s(0.79)} stroke={C.gold} strokeWidth="0.5" opacity="0.6"/>
        <line x1={cx} y1={cy} x2={s(0.97)} y2={s(0.79)} stroke={C.gold} strokeWidth="0.5" opacity="0.6"/>
        <line x1={cx} y1={cy} x2={s(0.05)} y2={s(0.33)} stroke={C.gold} strokeWidth="0.5" opacity="0.6"/>
        <line x1={cx} y1={cy} x2={s(0.95)} y2={s(0.33)} stroke={C.gold} strokeWidth="0.5" opacity="0.6"/>
        <line x1={cx} y1={cy} x2={s(0.26)} y2={s(0.02)} stroke={C.gold} strokeWidth="0.5" opacity="0.6"/>
        <line x1={cx} y1={cy} x2={s(0.74)} y2={s(0.02)} stroke={C.gold} strokeWidth="0.5" opacity="0.6"/>
        <line x1={cx} y1={cy} x2={s(0.18)} y2={s(0.04)} stroke={C.gold} strokeWidth="0.35" opacity="0.38"/>
        <line x1={cx} y1={cy} x2={s(0.82)} y2={s(0.04)} stroke={C.gold} strokeWidth="0.35" opacity="0.38"/>
        <path d={`M ${s(0.04)} ${cy} A ${s(0.46)} ${s(0.46)} 0 0 1 ${s(0.96)} ${cy}`} stroke={C.gold} strokeWidth="0.8" fill="none" opacity="0.5"/>
        <path d={`M ${s(0.16)} ${cy} A ${s(0.34)} ${s(0.34)} 0 0 1 ${s(0.84)} ${cy}`} stroke={C.gold} strokeWidth="0.6" fill="none" opacity="0.4"/>
        <path d={`M ${s(0.28)} ${cy} A ${s(0.22)} ${s(0.22)} 0 0 1 ${s(0.72)} ${cy}`} stroke={C.gold} strokeWidth="0.5" fill="none" opacity="0.3"/>
      </g>
      <circle cx={cx} cy={cy} r="4.5" fill={C.gold} opacity="0.9"/>
      <circle cx={cx} cy={cy} r="2" fill={C.bg}/>
      <circle cx={cx} cy={cy} r="1" fill={C.gold}/>
    </svg>
  );
}

function AdRule({ width = "100%", label }: { width?: string; label?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, width }}>
      <div style={{ flex: 1, height: 1, background: "rgba(201,168,76,0.3)" }} />
      {label ? (
        <span style={{ fontFamily: "sans-serif", fontSize: 9, fontWeight: 600, letterSpacing: "0.22em", textTransform: "uppercase", color: C.faint, whiteSpace: "nowrap" }}>
          {label}
        </span>
      ) : (
        <div style={{ width: 5, height: 5, background: C.gold, transform: "rotate(45deg)", flexShrink: 0 }} />
      )}
      <div style={{ flex: 1, height: 1, background: "rgba(201,168,76,0.3)" }} />
    </div>
  );
}

// ── Landing Nav ───────────────────────────────────────────────────────────────

function LandingNav() {
  const navigate = useNavigate();
  return (
    <nav style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 50, borderBottom: `1px solid ${C.border}` }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 52px", height: 66, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <AdLogoMark />
          <span className="font-display" style={{ fontSize: 14, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: C.gold }}>
            ClaimProof
          </span>
        </div>
        <div style={{ display: "flex", gap: 36 }}>
          {(["#how-it-works", "How It Works"] as const) && null}
          {[["#how-it-works", "How It Works"], ["#features", "Features"]].map(([href, label]) => (
            <a key={href} href={href} style={{ fontFamily: "sans-serif", fontSize: 10, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: C.muted, textDecoration: "none" }}>
              {label}
            </a>
          ))}
        </div>
        <button onClick={() => navigate("/dashboard")} style={{ ...btnGold, padding: "12px 28px" }}>
          Launch App
        </button>
      </div>
    </nav>
  );
}

// ── Account menu ──────────────────────────────────────────────────────────────

interface AccountMenuProps { address: string; onDisconnect: () => void; onClose: () => void; }

function AccountMenu({ address, onDisconnect, onClose }: AccountMenuProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const copy = () => {
    navigator.clipboard.writeText(address).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  const rowStyle: React.CSSProperties = {
    width: "100%", display: "flex", alignItems: "center", gap: 10,
    padding: "10px 12px", background: "transparent", border: "none",
    cursor: "pointer", textAlign: "left", borderRadius: 0,
  };

  return (
    <div ref={ref} style={{ position: "absolute", right: 0, top: "calc(100% + 8px)", width: 260, zIndex: 200, background: C.card, border: `1px solid ${C.border}`, boxShadow: "0 16px 48px rgba(0,0,0,0.5)" }}>
      <div style={{ padding: "16px 18px", borderBottom: `1px solid ${C.border}` }}>
        <div style={{ fontFamily: "sans-serif", fontSize: 9, fontWeight: 600, letterSpacing: "0.22em", textTransform: "uppercase", color: C.faint, marginBottom: 6 }}>Connected</div>
        <div style={{ fontFamily: "monospace", fontSize: 11, color: C.muted, wordBreak: "break-all" }}>{address}</div>
      </div>
      <div style={{ padding: 8 }}>
        <button onClick={copy} style={{ ...rowStyle, color: C.text }}
          onMouseEnter={e => (e.currentTarget.style.background = "rgba(201,168,76,0.07)")}
          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
          {copied ? <Check size={14} style={{ color: "#6ee7b7" }} /> : <Copy size={14} style={{ color: C.muted }} />}
          <span style={{ fontFamily: "sans-serif", fontSize: 13 }}>{copied ? "Copied" : "Copy address"}</span>
        </button>
        <button onClick={() => { onDisconnect(); onClose(); }} style={{ ...rowStyle, color: "#fca5a5" }}
          onMouseEnter={e => (e.currentTarget.style.background = "rgba(252,165,165,0.07)")}
          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
          <LogOut size={14} />
          <span style={{ fontFamily: "sans-serif", fontSize: 13 }}>Disconnect</span>
        </button>
      </div>
    </div>
  );
}

// ── App Nav ───────────────────────────────────────────────────────────────────

interface AppNavProps { walletAddress: string | null; onOpenWallet: () => void; onDisconnect: () => void; }

function AppNav({ walletAddress, onOpenWallet, onDisconnect }: AppNavProps) {
  const navigate = useNavigate();
  const [showAccount, setShowAccount] = useState(false);

  return (
    <nav style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(13,11,6,0.94)", backdropFilter: "blur(20px)", borderBottom: `1px solid ${C.border}` }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 52px", height: 66, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: 12, textDecoration: "none" }}>
          <AdLogoMark />
          <span className="font-display" style={{ fontSize: 14, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: C.gold }}>
            ClaimProof
          </span>
        </Link>

        <div style={{ display: "flex", gap: 2 }}>
          {[{ to: "/dashboard", label: "Policies" }, { to: "/how-it-works", label: "How It Works" }].map(({ to, label }) => (
            <NavLink key={to} to={to} style={({ isActive }) => ({
              fontFamily: "sans-serif", fontSize: 10, fontWeight: 600,
              letterSpacing: "0.2em", textTransform: "uppercase",
              textDecoration: "none", padding: "8px 18px",
              background: isActive ? C.gold : "transparent",
              color: isActive ? C.bg : C.muted,
              transition: "all 0.15s",
            })}>
              {label}
            </NavLink>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 5, height: 5, background: C.gold, animation: "ad-blink 2.4s ease-in-out infinite" }} />
            <span style={{ fontFamily: "sans-serif", fontSize: 9, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: C.faint }}>Testnet</span>
          </div>
          <button onClick={() => navigate("/create")} style={{ ...btnOutline, padding: "9px 18px", fontSize: 9 }}>
            <Plus size={12} /> New Policy
          </button>
          <div style={{ position: "relative" }}>
            {walletAddress ? (
              <button onClick={() => setShowAccount(s => !s)} style={{ fontFamily: "monospace", fontSize: 12, color: C.gold, border: `1px solid rgba(201,168,76,0.35)`, background: "rgba(201,168,76,0.06)", padding: "8px 14px", cursor: "pointer", borderRadius: 0, display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 5, height: 5, background: C.gold }} />
                {walletAddress.slice(0, 4)}...{walletAddress.slice(-4)}
              </button>
            ) : (
              <button onClick={onOpenWallet} style={{ ...btnGold, padding: "9px 20px", fontSize: 10 }}>
                Connect Wallet
              </button>
            )}
            {showAccount && walletAddress && (
              <AccountMenu address={walletAddress} onDisconnect={onDisconnect} onClose={() => setShowAccount(false)} />
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

// ── Landing Page ──────────────────────────────────────────────────────────────

function LandingPage() {
  const navigate = useNavigate();

  return (
    <div style={{ background: C.bg, minHeight: "100vh" }}>
      <LandingNav />

      {/* Hero */}
      <section style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "120px 52px 80px", position: "relative" }}>
        <div style={{ marginBottom: 36 }}><AdFan size={220} /></div>

        <div style={{ marginBottom: 28 }}>
          <span style={{ fontFamily: "sans-serif", fontSize: 10, fontWeight: 600, letterSpacing: "0.28em", textTransform: "uppercase", color: C.gold }}>
            Stellar Soroban · Groth16 ZK · Testnet Live
          </span>
        </div>

        <h1 className="font-display" style={{ fontSize: "clamp(52px, 8.5vw, 96px)", fontWeight: 900, lineHeight: 0.95, letterSpacing: "-0.015em", marginBottom: 8, color: C.text }}>
          Trustless<br /><span style={{ color: C.gold, fontStyle: "italic" }}>Insurance.</span>
        </h1>

        <div style={{ margin: "32px auto", width: 300 }}>
          <AdRule label="Zero Knowledge" />
        </div>

        <p style={{ fontFamily: "sans-serif", fontSize: 15, color: C.muted, lineHeight: 1.78, maxWidth: 460, margin: "0 auto 48px" }}>
          Parametric insurance policies on Stellar Soroban, settled by zero-knowledge proofs.
          Your oracle value stays private. The payout is mathematically inevitable.
        </p>

        <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap", marginBottom: 72 }}>
          <button onClick={() => navigate("/dashboard")} style={{ ...btnGold, padding: "15px 40px", fontSize: 11 }}>
            Create a Policy <ArrowRight size={14} />
          </button>
          <a href="#how-it-works" style={{ ...btnOutline, padding: "14px 38px", fontSize: 11 }}>
            How It Works
          </a>
        </div>

        {/* Price preview strip */}
        <div style={{ display: "flex", width: "100%", maxWidth: 660, border: `1px solid ${C.border}` }}>
          {[["BTC / USD", "$59,934"], ["ETH / USD", "$1,575"], ["XLM / USD", "$0.178"]].map(([label, val], i) => (
            <div key={label} style={{ flex: 1, padding: "22px 24px", textAlign: "center", borderRight: i < 2 ? `1px solid ${C.border}` : "none" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontFamily: "sans-serif", fontSize: 9, fontWeight: 600, letterSpacing: "0.24em", textTransform: "uppercase", color: C.muted, marginBottom: 10 }}>
                <div style={{ width: 5, height: 5, background: C.gold, animation: "ad-blink 2s ease-in-out infinite" }} />
                {label}
              </div>
              <div className="font-display" style={{ fontSize: 26, fontWeight: 700, color: C.gold }}>{val}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Trust strip */}
      <div style={{ borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, padding: "20px 52px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "center", gap: 32, flexWrap: "wrap" }}>
          {["No Setup Fee", "ZK Verified", "Instant Payout", "Cancel Anytime"].map((item, i, arr) => (
            <React.Fragment key={item}>
              <span style={{ fontFamily: "sans-serif", fontSize: 10, fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", color: C.muted }}>{item}</span>
              {i < arr.length - 1 && <div style={{ width: 4, height: 4, background: C.faint, transform: "rotate(45deg)" }} />}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Features */}
      <section id="features" style={{ padding: "96px 52px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ marginBottom: 64 }}>
            <div style={{ fontFamily: "sans-serif", fontSize: 10, fontWeight: 600, letterSpacing: "0.28em", textTransform: "uppercase", color: C.gold, marginBottom: 16 }}>Why ClaimProof</div>
            <h2 className="font-display" style={{ fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 700, letterSpacing: "-0.01em", color: C.text, marginBottom: 12 }}>
              Insurance without <em style={{ fontStyle: "italic", color: C.gold }}>trust.</em>
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
            {[
              { icon: Shield, title: "No adjusters, ever", desc: "Your payout is decided by math, not a claims team. When the oracle condition hits, the contract pays out. Automatically. Permanently." },
              { icon: Lock, title: "Your position stays private", desc: "A ZK proof confirms the condition was met without revealing the exact price or your position size on-chain. The oracle value never touches the blockchain." },
              { icon: Zap, title: "Seconds, not weeks", desc: "Traditional insurance claims take weeks of back-and-forth. ClaimProof settles in a single Stellar transaction, the moment a valid proof is submitted." },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="ad-card"
                style={{ background: C.card, border: `1px solid ${C.border}`, padding: "36px 30px", transition: "border-color 0.2s, transform 0.2s" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = C.borderHi; e.currentTarget.style.transform = "translateY(-4px)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.transform = ""; }}>
                <div style={{ color: C.gold, marginBottom: 20 }}><Icon size={28} /></div>
                <h3 className="font-display" style={{ fontSize: 19, fontWeight: 700, color: C.text, marginBottom: 12, letterSpacing: "-0.01em" }}>{title}</h3>
                <p style={{ fontFamily: "sans-serif", fontSize: 14, color: C.muted, lineHeight: 1.72 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" style={{ padding: "96px 52px", background: "rgba(201,168,76,0.025)", borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ marginBottom: 64, textAlign: "center" }}>
            <div style={{ fontFamily: "sans-serif", fontSize: 10, fontWeight: 600, letterSpacing: "0.28em", textTransform: "uppercase", color: C.gold, marginBottom: 16 }}>How It Works</div>
            <h2 className="font-display" style={{ fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 700, letterSpacing: "-0.01em", color: C.text }}>
              Four steps. <em style={{ fontStyle: "italic", color: C.gold }}>Zero intermediaries.</em>
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", border: `1px solid ${C.border}` }}>
            {[
              { n: "I",   icon: Shield, title: "Create Policy",      desc: "Lock USDC collateral in a Soroban smart contract. Set your oracle asset, trigger condition, and payout amount." },
              { n: "II",  icon: Eye,    title: "Condition Triggers",  desc: "When BTC, ETH, or XLM crosses your defined threshold, the condition is met and the policy becomes claimable." },
              { n: "III", icon: Cpu,    title: "Generate ZK Proof",   desc: "Your browser runs the Circom circuit. The proof confirms the condition was met without revealing the price on-chain." },
              { n: "IV",  icon: Zap,    title: "Instant Payout",      desc: "Soroban verifies the Groth16 proof via native BN254 host functions. USDC transfers to your beneficiary immediately." },
            ].map(({ n, title, desc }, i) => (
              <div key={n} style={{ padding: "36px 28px", borderLeft: i > 0 ? `1px solid ${C.border}` : "none" }}>
                <div style={{ width: 44, height: 44, border: `1px solid rgba(201,168,76,0.4)`, background: C.card, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
                  <span style={{ fontFamily: "sans-serif", fontSize: 11, fontWeight: 700, color: C.gold, letterSpacing: "0.05em" }}>{n}</span>
                </div>
                <h3 className="font-display" style={{ fontSize: 17, fontWeight: 700, color: C.text, marginBottom: 10, letterSpacing: "-0.01em" }}>{title}</h3>
                <p style={{ fontFamily: "sans-serif", fontSize: 13, color: C.muted, lineHeight: 1.7 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "112px 52px", display: "flex", justifyContent: "center" }}>
        <div style={{ maxWidth: 640, width: "100%", border: `1px solid rgba(201,168,76,0.32)`, padding: "72px 60px", textAlign: "center", background: "rgba(201,168,76,0.025)", position: "relative" }}>
          <div style={{ position: "absolute", inset: 8, border: `1px solid rgba(201,168,76,0.13)`, pointerEvents: "none" }} />
          {[
            { top: -1, left: -1, borderTopWidth: 2, borderLeftWidth: 2, borderRightWidth: 0, borderBottomWidth: 0 },
            { top: -1, right: -1, borderTopWidth: 2, borderRightWidth: 2, borderLeftWidth: 0, borderBottomWidth: 0 },
            { bottom: -1, left: -1, borderBottomWidth: 2, borderLeftWidth: 2, borderTopWidth: 0, borderRightWidth: 0 },
            { bottom: -1, right: -1, borderBottomWidth: 2, borderRightWidth: 2, borderTopWidth: 0, borderLeftWidth: 0 },
          ].map((cs, i) => (
            <div key={i} style={{ position: "absolute", width: 22, height: 22, borderStyle: "solid", borderColor: C.gold, opacity: 0.65, ...cs }} />
          ))}

          <div style={{ marginBottom: 20 }}><AdFan size={80} /></div>
          <div style={{ margin: "0 auto 20px", width: 180 }}><AdRule /></div>
          <div style={{ fontFamily: "sans-serif", fontSize: 10, fontWeight: 600, letterSpacing: "0.28em", textTransform: "uppercase", color: C.gold, marginBottom: 16 }}>Get Started</div>
          <h2 className="font-display" style={{ fontSize: "clamp(26px, 3.5vw, 40px)", fontWeight: 900, color: C.text, letterSpacing: "-0.015em", lineHeight: 1.1, marginBottom: 18 }}>
            Ready to hedge with <em style={{ fontStyle: "italic", color: C.gold }}>mathematics?</em>
          </h2>
          <p style={{ fontFamily: "sans-serif", fontSize: 14, color: C.muted, lineHeight: 1.76, maxWidth: 380, margin: "0 auto 38px" }}>
            Create your first policy in under a minute. When the market moves, a proof settles it on Stellar in seconds.
          </p>
          <button onClick={() => navigate("/dashboard")} style={{ ...btnGold, padding: "15px 40px", fontSize: 11 }}>
            Create Your First Policy
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: `1px solid ${C.border}`, padding: "36px 52px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <AdLogoMark size={18} />
            <span className="font-display" style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: C.gold }}>ClaimProof</span>
          </div>
          <div style={{ display: "flex", gap: 24 }}>
            {[{ to: "/dashboard", label: "Dashboard" }, { to: "/how-it-works", label: "How It Works" }, { to: "/create", label: "Create Policy" }].map(({ to, label }) => (
              <Link key={to} to={to} style={{ fontFamily: "sans-serif", fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: C.muted, textDecoration: "none" }}>
                {label}
              </Link>
            ))}
          </div>
          <p style={{ fontFamily: "sans-serif", fontSize: 11, color: C.faint }}>Built on Stellar Protocol 25</p>
        </div>
      </footer>
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

interface PageProps { walletAddress: string | null; onOpenWallet: () => void; onDisconnect: () => void; }

function DashboardPage({ walletAddress, onOpenWallet, onDisconnect }: PageProps) {
  const [policies, setPolicies]       = useState<Policy[]>([]);
  const [loading, setLoading]         = useState(true);
  const [currentLedger, setCurrentLedger] = useState<number | undefined>();
  const [showAll, setShowAll]         = useState(false);
  const { prices }                    = useOracle(15_000);
  const navigate = useNavigate();

  const loadPolicies = useCallback(async () => {
    try {
      const url = walletAddress && !showAll
        ? `/api/policies?insured=${encodeURIComponent(walletAddress)}`
        : "/api/policies";
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) setPolicies(data.policies);
    } catch (_) {}
    finally { setLoading(false); }
  }, [walletAddress, showAll]);

  useEffect(() => { loadPolicies(); }, [loadPolicies]);

  // Poll current Stellar ledger for expiry calculations
  useEffect(() => {
    const fetchLedger = async () => {
      try {
        const res = await fetch("https://soroban-testnet.stellar.org", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "getLatestLedger", params: [] }),
        });
        const d = await res.json();
        if (d.result?.sequence) setCurrentLedger(d.result.sequence);
      } catch (_) {}
    };
    fetchLedger();
    const id = setInterval(fetchLedger, 60_000);
    return () => clearInterval(id);
  }, []);

  // Sort: claimable first, then active, then rest
  const sorted = [...policies].sort((a, b) => {
    const isClaimable = (p: Policy) => {
      if (p.status !== "active" || !prices) return false;
      const raw = prices[p.oracleType as keyof typeof prices]?.raw;
      if (!raw) return false;
      const cur = Number(raw) / 1_000_000;
      const thr = Number(p.threshold) / 1_000_000;
      return p.condition === "lte" ? cur <= thr : cur >= thr;
    };
    if (isClaimable(a) && !isClaimable(b)) return -1;
    if (!isClaimable(a) && isClaimable(b)) return 1;
    if (a.status === "active" && b.status !== "active") return -1;
    if (a.status !== "active" && b.status === "active") return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const activePolicies  = policies.filter(p => p.status === "active");
  const claimedPolicies = policies.filter(p => p.status === "claimed");
  const totalProtected  = activePolicies.reduce((s, p) => s + Number(p.payoutAmount) / 1e7, 0);
  const totalClaimed    = claimedPolicies.reduce((s, p) => s + Number(p.payoutAmount) / 1e7, 0);

  // Count claimable now
  const claimableCount = activePolicies.filter(p => {
    if (!prices) return false;
    const raw = prices[p.oracleType as keyof typeof prices]?.raw;
    if (!raw) return false;
    const cur = Number(raw) / 1_000_000;
    const thr = Number(p.threshold) / 1_000_000;
    return p.condition === "lte" ? cur <= thr : cur >= thr;
  }).length;

  return (
    <div style={{ background: C.bg, minHeight: "100vh" }}>
      <AppNav walletAddress={walletAddress} onOpenWallet={onOpenWallet} onDisconnect={onDisconnect} />
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 52px" }}>

        <PriceOracle />

        {/* Claimable alert banner */}
        <ClaimableBanner policies={policies} prices={prices} />

        {/* Portfolio stats strip */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 1, marginBottom: 40, background: C.border, border: `1px solid ${C.border}` }}>
          {[
            { label: "Active Policies",    value: String(activePolicies.length),          sub: "currently open" },
            { label: "Total Protected",    value: `${totalProtected.toFixed(0)} USDC`,   sub: "locked collateral" },
            { label: "Claimable Now",      value: String(claimableCount),                 sub: claimableCount > 0 ? "conditions triggered" : "none triggered" },
            { label: "Total Claimed",      value: `${totalClaimed.toFixed(0)} USDC`,     sub: "paid out" },
          ].map(({ label, value, sub }) => (
            <div key={label} style={{ background: C.card, padding: "24px 24px" }}>
              <div style={{ fontFamily: "sans-serif", fontSize: 9, fontWeight: 600, letterSpacing: "0.22em", textTransform: "uppercase", color: C.faint, marginBottom: 8 }}>{label}</div>
              <div className="font-display" style={{ fontSize: 28, fontWeight: 900, color: C.gold, letterSpacing: "-0.025em", lineHeight: 1.1 }}>{value}</div>
              <div style={{ fontFamily: "sans-serif", fontSize: 10, color: C.faint, marginTop: 4 }}>{sub}</div>
            </div>
          ))}
        </div>

        {/* Policies header */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <h2 className="font-display" style={{ fontSize: 28, fontWeight: 700, color: C.text, letterSpacing: "-0.01em", marginBottom: 4 }}>
              {walletAddress && !showAll ? "Your Policies" : "All Policies"}
            </h2>
            {walletAddress && (
              <button onClick={() => setShowAll(s => !s)}
                style={{ background: "transparent", border: "none", cursor: "pointer", fontFamily: "sans-serif", fontSize: 11, color: C.faint, padding: 0, textDecoration: "underline" }}>
                {showAll ? "Show only mine" : "Show all policies"}
              </button>
            )}
          </div>
          <button onClick={() => navigate("/create")} style={{ ...btnGold, padding: "12px 24px", fontSize: 10 }}>
            <Plus size={12} /> New Policy
          </button>
        </div>

        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ height: 80, background: C.card, border: `1px solid ${C.border}`, animation: "pulse 2s infinite" }} />
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <div className="ad-card" style={{ background: C.card, border: `1px solid ${C.border}`, padding: "72px 40px", textAlign: "center" }}>
            <div style={{ color: C.faint, marginBottom: 20, display: "flex", justifyContent: "center" }}>
              <FileText size={32} />
            </div>
            <h3 className="font-display" style={{ fontSize: 22, fontWeight: 700, color: C.text, marginBottom: 8 }}>
              {walletAddress ? "No policies for this wallet" : "No policies yet"}
            </h3>
            <p style={{ fontFamily: "sans-serif", fontSize: 14, color: C.muted, maxWidth: 340, margin: "0 auto 28px" }}>
              {walletAddress
                ? "Create your first policy to start protecting your crypto holdings."
                : "Connect your wallet and create a policy to protect against price movements."}
            </p>
            <button onClick={() => walletAddress ? navigate("/create") : onOpenWallet()}
              style={{ ...btnGold, padding: "13px 32px", fontSize: 10 }}>
              {walletAddress ? "Create Policy" : "Connect Wallet"} <ArrowRight size={14} />
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", borderBottom: `1px solid ${C.border}` }}>
            {sorted.map(p => (
              <PolicyCard
                key={p._id}
                policy={p}
                onUpdated={loadPolicies}
                prices={prices}
                currentLedger={currentLedger}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Create Policy Page ────────────────────────────────────────────────────────

function CreatePolicyPage({ walletAddress, onOpenWallet, onDisconnect }: PageProps) {
  const navigate = useNavigate();
  return (
    <div style={{ background: C.bg, minHeight: "100vh" }}>
      <AppNav walletAddress={walletAddress} onOpenWallet={onOpenWallet} onDisconnect={onDisconnect} />
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "48px 52px" }}>
        <div style={{ marginBottom: 36 }}>
          <div style={{ fontFamily: "sans-serif", fontSize: 10, fontWeight: 600, letterSpacing: "0.28em", textTransform: "uppercase", color: C.gold, marginBottom: 16 }}>New Policy</div>
          <h1 className="font-display" style={{ fontSize: 38, fontWeight: 700, color: C.text, letterSpacing: "-0.015em", marginBottom: 10 }}>
            Create Insurance Policy
          </h1>
          <p style={{ fontFamily: "sans-serif", fontSize: 14, color: C.muted }}>
            Lock USDC as collateral. When the oracle condition triggers, claim instantly with a ZK proof.
          </p>
        </div>
        <div className="ad-card" style={{ background: C.card, border: `1px solid ${C.border}`, padding: 40 }}>
          <CreatePolicy
            onCreated={() => setTimeout(() => navigate("/dashboard"), 2500)}
            walletAddress={walletAddress}
            onOpenWallet={onOpenWallet}
          />
        </div>
      </div>
    </div>
  );
}

// ── How It Works ──────────────────────────────────────────────────────────────

function HowItWorksPage({ walletAddress, onOpenWallet, onDisconnect }: PageProps) {
  const stack = [
    { label: "ZK Circuit",            value: "Circom 2 and Groth16 (BN254 curve)" },
    { label: "Proving",               value: "snarkjs in-browser, under 2 seconds" },
    { label: "On-chain Verification", value: "Soroban BN254 host functions (Protocol 25)" },
    { label: "Oracle",                value: "Reflector Network (Stellar-native)" },
    { label: "Payment Token",         value: "USDC via SEP-41 SAC" },
    { label: "Proof Size",            value: "~800 bytes (Groth16)" },
  ];

  return (
    <div style={{ background: C.bg, minHeight: "100vh" }}>
      <AppNav walletAddress={walletAddress} onOpenWallet={onOpenWallet} onDisconnect={onDisconnect} />
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "56px 52px" }}>
        <div style={{ marginBottom: 56 }}>
          <div style={{ fontFamily: "sans-serif", fontSize: 10, fontWeight: 600, letterSpacing: "0.28em", textTransform: "uppercase", color: C.gold, marginBottom: 16 }}>Documentation</div>
          <h1 className="font-display" style={{ fontSize: 48, fontWeight: 700, color: C.text, letterSpacing: "-0.02em", lineHeight: 1.05, marginBottom: 16 }}>
            How ClaimProof Works
          </h1>
          <p style={{ fontFamily: "sans-serif", fontSize: 15, color: C.muted, maxWidth: 460 }}>
            Trustless parametric insurance powered by zero-knowledge proofs on Stellar Soroban.
          </p>
        </div>

        <div style={{ marginBottom: 56 }}>
          {[
            { n: "I",   icon: Shield, title: "Create and fund a policy",  desc: "Lock USDC collateral in a Soroban smart contract. Set your oracle asset, trigger condition, and payout amount. The contract holds the funds until the condition is met or the policy expires." },
            { n: "II",  icon: Eye,    title: "Oracle condition triggers",  desc: "When BTC, ETH, or XLM crosses your defined threshold, the insurance condition is met and you can initiate a claim. The oracle reading is fetched from the Reflector Network." },
            { n: "III", icon: Cpu,    title: "Generate a ZK proof",        desc: "Your browser runs the Circom circuit via snarkjs. The proof confirms the oracle condition was met without revealing the exact price on-chain. This takes under 2 seconds." },
            { n: "IV",  icon: Zap,    title: "Instant payout on Stellar",  desc: "The ClaimProof contract verifies your Groth16 proof using Stellar Protocol 25 native BN254 host functions. Once valid, USDC transfers in seconds. No intermediary, no wait." },
          ].map(({ n, title, desc }, i) => (
            <div key={n} style={{ display: "flex", gap: 28, padding: "36px 0", borderBottom: i < 3 ? `1px solid ${C.border}` : "none" }}>
              <div style={{ width: 44, height: 44, border: `1px solid rgba(201,168,76,0.4)`, background: C.card, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ fontFamily: "sans-serif", fontSize: 11, fontWeight: 700, color: C.gold, letterSpacing: "0.05em" }}>{n}</span>
              </div>
              <div style={{ flex: 1, paddingTop: 4 }}>
                <h3 className="font-display" style={{ fontSize: 20, fontWeight: 700, color: C.text, marginBottom: 10, letterSpacing: "-0.01em" }}>{title}</h3>
                <p style={{ fontFamily: "sans-serif", fontSize: 14, color: C.muted, lineHeight: 1.72 }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>

        <h2 className="font-display" style={{ fontSize: 26, fontWeight: 700, color: C.text, marginBottom: 20 }}>Technical Stack</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 1, marginBottom: 48, background: C.border, border: `1px solid ${C.border}` }}>
          {stack.map(({ label, value }) => (
            <div key={label} style={{ background: C.card, padding: "20px 24px" }}>
              <div style={{ fontFamily: "sans-serif", fontSize: 9, fontWeight: 600, letterSpacing: "0.22em", textTransform: "uppercase", color: C.faint, marginBottom: 6 }}>{label}</div>
              <div style={{ fontFamily: "sans-serif", fontSize: 14, color: C.text }}>{value}</div>
            </div>
          ))}
        </div>

        <div className="ad-card" style={{ background: C.card, border: `1px solid ${C.border}`, padding: "36px 36px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 16 }}>
            <div style={{ color: C.gold, flexShrink: 0, marginTop: 2 }}><Lock size={22} /></div>
            <h3 className="font-display" style={{ fontSize: 20, fontWeight: 700, color: C.text }}>Why zero-knowledge proofs?</h3>
          </div>
          <p style={{ fontFamily: "sans-serif", fontSize: 14, color: C.muted, lineHeight: 1.75, marginBottom: 20 }}>
            Traditional parametric insurance requires publishing oracle data publicly, exposing your financial position on-chain.
            With ZK proofs, you confirm a loss occurred without revealing the exact oracle reading. A fund manager proving a price
            hit their stop-loss does not leak their position size or entry price. The Soroban contract sees one thing: proof valid, transfer USDC.
          </p>
          {[
            "Condition verified cryptographically, no trusted adjuster required",
            "Oracle value never exposed on-chain, only the Poseidon commitment",
            "Groth16 verification costs under 2 seconds in-browser via snarkjs",
          ].map(line => (
            <div key={line} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <CheckCircle2 size={14} style={{ color: C.gold, flexShrink: 0 }} />
              <span style={{ fontFamily: "sans-serif", fontSize: 13, color: C.muted }}>{line}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────

const WALLET_KEY = "claimproof_wallet_address";

export default function App() {
  const [walletAddress, setWalletAddress] = useState<string | null>(() =>
    localStorage.getItem(WALLET_KEY)
  );
  const [showWallet, setShowWallet] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(WALLET_KEY);
    if (!stored) return;
    const messageId = Math.floor(Math.random() * 1e9);
    let done = false;
    const handler = (e: MessageEvent) => {
      if (e.data?.source !== "FREIGHTER_EXTERNAL_MSG_RESPONSE") return;
      if (done) return;
      done = true;
      window.removeEventListener("message", handler);
      clearTimeout(timer);
    };
    const timer = setTimeout(() => {
      if (!done) {
        done = true;
        window.removeEventListener("message", handler);
        setWalletAddress(null);
        localStorage.removeItem(WALLET_KEY);
      }
    }, 1200);
    window.addEventListener("message", handler);
    window.postMessage(
      { source: "FREIGHTER_EXTERNAL_MSG_REQUEST", type: "REQUEST_CONNECTION_STATUS", messageId },
      window.location.origin
    );
    return () => { done = true; clearTimeout(timer); window.removeEventListener("message", handler); };
  }, []);

  const handleConnected = (address: string) => {
    setWalletAddress(address);
    localStorage.setItem(WALLET_KEY, address);
    setShowWallet(false);
  };

  const handleDisconnect = () => {
    setWalletAddress(null);
    localStorage.removeItem(WALLET_KEY);
  };

  const pageProps: PageProps = { walletAddress, onOpenWallet: () => setShowWallet(true), onDisconnect: handleDisconnect };

  return (
    <>
      {showWallet && <WalletModal onConnected={handleConnected} onClose={() => setShowWallet(false)} />}
      <Routes>
        <Route path="/"            element={<LandingPage />} />
        <Route path="/dashboard"   element={<DashboardPage {...pageProps} />} />
        <Route path="/create"      element={<CreatePolicyPage {...pageProps} />} />
        <Route path="/how-it-works" element={<HowItWorksPage {...pageProps} />} />
      </Routes>
    </>
  );
}
