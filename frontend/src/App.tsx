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

// ── Landing palette (light editorial) ────────────────────────────────────────

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

const ldH: React.CSSProperties = {
  fontFamily: "'Plus Jakarta Sans', sans-serif",
  fontWeight: 800,
  lineHeight: 1.05,
  letterSpacing: "-0.025em",
  color: LD.text,
};
const ldBody: React.CSSProperties = {
  fontFamily: "'Work Sans', sans-serif",
  fontSize: 16,
  lineHeight: 1.75,
  color: LD.sub,
};
const ldLabel: React.CSSProperties = {
  fontFamily: "'Work Sans', sans-serif",
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "0.13em",
  textTransform: "uppercase",
  color: LD.gold,
  display: "block",
  marginBottom: 14,
};
const ldBtnDark: React.CSSProperties = {
  fontFamily: "'Work Sans', sans-serif",
  fontSize: 14,
  fontWeight: 600,
  padding: "12px 26px",
  background: LD.text,
  color: LD.bg,
  border: "none",
  cursor: "pointer",
  borderRadius: 8,
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  textDecoration: "none",
};
const ldBtnOutline: React.CSSProperties = {
  fontFamily: "'Work Sans', sans-serif",
  fontSize: 14,
  fontWeight: 600,
  padding: "11px 24px",
  background: "transparent",
  color: LD.text,
  border: `1.5px solid ${LD.border}`,
  cursor: "pointer",
  borderRadius: 8,
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  textDecoration: "none",
};

// ── Landing Nav ───────────────────────────────────────────────────────────────

function LandingNav() {
  const navigate = useNavigate();
  return (
    <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 50, background: "rgba(250,250,248,0.92)", backdropFilter: "blur(14px)", borderBottom: `1px solid ${LD.border}` }}>
      <div style={{ maxWidth: 1140, margin: "0 auto", padding: "0 48px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img src="/logo.png" alt="ClaimProof" style={{ height: 40, width: "auto", display: "block" }} />
        </div>
        <div style={{ display: "flex", gap: 32 }}>
          {[["#how-it-works", "How It Works"], ["#features", "Features"]].map(([href, label]) => (
            <a key={href} href={href} style={{ fontFamily: "'Work Sans', sans-serif", fontSize: 14, fontWeight: 500, color: LD.sub, textDecoration: "none" }}>
              {label}
            </a>
          ))}
        </div>
        <button onClick={() => navigate("/dashboard")} style={{ ...ldBtnDark, padding: "9px 22px", fontSize: 13, borderRadius: 6 }}>
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
    <nav style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(253,247,244,0.92)", backdropFilter: "blur(14px)", borderBottom: `1px solid ${LD.border}` }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 52px", height: 66, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <img src="/logo.png" alt="ClaimProof" style={{ height: 40, width: "auto", display: "block" }} />
        </Link>

        <div style={{ display: "flex", gap: 4 }}>
          {[{ to: "/dashboard", label: "Policies" }, { to: "/how-it-works", label: "How It Works" }].map(({ to, label }) => (
            <NavLink key={to} to={to} style={({ isActive }) => ({
              fontFamily: "'Work Sans', sans-serif", fontSize: 13, fontWeight: 500,
              textDecoration: "none", padding: "7px 14px",
              background: isActive ? LD.goldBg : "transparent",
              color: isActive ? LD.gold : LD.sub,
              transition: "all 0.15s",
            })}>
              {label}
            </NavLink>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 6, height: 6, background: "#22c55e", borderRadius: "50%", animation: "ad-blink 2.4s ease-in-out infinite" }} />
            <span style={{ fontFamily: "'Work Sans', sans-serif", fontSize: 11, color: LD.faint }}>Testnet</span>
          </div>
          <button onClick={() => navigate("/create")} style={{ fontFamily: "'Work Sans', sans-serif", fontSize: 13, fontWeight: 500, padding: "8px 16px", background: "transparent", color: LD.text, border: `1px solid ${LD.border}`, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
            <Plus size={13} /> New Policy
          </button>
          <div style={{ position: "relative" }}>
            {walletAddress ? (
              <button onClick={() => setShowAccount(s => !s)} style={{ fontFamily: "'Work Sans', sans-serif", fontSize: 13, color: LD.text, border: `1px solid ${LD.border}`, background: LD.surface, padding: "8px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 6, height: 6, background: LD.gold, borderRadius: "50%" }} />
                {walletAddress.slice(0, 4)}...{walletAddress.slice(-4)}
              </button>
            ) : (
              <button onClick={onOpenWallet} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, fontWeight: 700, padding: "9px 20px", background: LD.text, color: LD.bg, border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
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
    <div style={{ background: LD.bg, minHeight: "100vh" }}>
      <LandingNav />

      {/* ── Hero ── */}
      <section style={{ paddingTop: 112, paddingBottom: 88, paddingLeft: 48, paddingRight: 48 }}>
        <div style={{ maxWidth: 1140, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 72, alignItems: "center" }}>

          {/* Left: copy */}
          <div>
            <span style={ldLabel}>Stellar Soroban · Groth16 ZK · Testnet Live</span>
            <h1 style={{ ...ldH, fontSize: "clamp(44px, 5.5vw, 72px)", marginBottom: 22 }}>
              Trustless<br />
              <em style={{ fontStyle: "italic", color: LD.gold }}>Insurance.</em>
            </h1>
            <p style={{ ...ldBody, maxWidth: 440, marginBottom: 36 }}>
              Parametric insurance policies on Stellar Soroban, settled by zero-knowledge proofs.
              Your oracle value stays private. The payout is mathematically inevitable.
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 48 }}>
              <button onClick={() => navigate("/dashboard")} style={ldBtnDark}>
                Create a Policy <ArrowRight size={14} />
              </button>
              <a href="#how-it-works" style={ldBtnOutline}>How It Works</a>
            </div>

            {/* Live price strip */}
            <div style={{ display: "flex", border: `1px solid ${LD.border}`, borderRadius: 10, overflow: "hidden", background: LD.surface }}>
              {[["BTC / USD", "$59,934"], ["ETH / USD", "$1,575"], ["XLM / USD", "$0.178"]].map(([label, val], i) => (
                <div key={label} style={{ flex: 1, padding: "14px 18px", borderRight: i < 2 ? `1px solid ${LD.border}` : "none" }}>
                  <div style={{ fontFamily: "'Work Sans', sans-serif", fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: LD.faint, marginBottom: 5, display: "flex", alignItems: "center", gap: 5 }}>
                    <span style={{ display: "inline-block", width: 5, height: 5, background: LD.gold, borderRadius: "50%", animation: "ad-blink 2s ease-in-out infinite" }} />
                    {label}
                  </div>
                  <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 17, fontWeight: 700, color: LD.text }}>{val}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: hero image — blends into bg */}
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
            <img src="/landing/claimproof1.png" alt="Trustless protection" style={{ width: "110%", maxWidth: 580, height: "auto", display: "block" }} />
          </div>
        </div>
      </section>

      {/* ── Trust strip ── */}
      <div style={{ borderTop: `1px solid ${LD.border}`, borderBottom: `1px solid ${LD.border}`, padding: "16px 48px", background: LD.surface }}>
        <div style={{ maxWidth: 1140, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "center", gap: 36, flexWrap: "wrap" }}>
          {["No Setup Fee", "ZK Verified", "Instant Payout", "Cancel Anytime"].map((item, i, arr) => (
            <React.Fragment key={item}>
              <span style={{ fontFamily: "'Work Sans', sans-serif", fontSize: 13, fontWeight: 600, color: LD.sub }}>{item}</span>
              {i < arr.length - 1 && <span style={{ color: LD.border, fontSize: 20, lineHeight: 1 }}>·</span>}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* ── Features ── */}
      <section id="features" style={{ padding: "96px 48px" }}>
        <div style={{ maxWidth: 1140, margin: "0 auto" }}>
          <div style={{ maxWidth: 540, marginBottom: 56 }}>
            <span style={ldLabel}>Why ClaimProof</span>
            <h2 style={{ ...ldH, fontSize: "clamp(28px, 3.5vw, 44px)" }}>
              Insurance without <em style={{ fontStyle: "italic", color: LD.gold }}>trust.</em>
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
            {[
              { icon: Shield, title: "No adjusters, ever", desc: "Your payout is decided by math, not a claims team. When the oracle condition hits, the contract pays out. Automatically. Permanently." },
              { icon: Lock,   title: "Your position stays private", desc: "A ZK proof confirms the condition was met without revealing the exact price or your position size on-chain. The oracle value never touches the blockchain." },
              { icon: Zap,    title: "Seconds, not weeks", desc: "Traditional insurance claims take weeks of back-and-forth. ClaimProof settles in a single Stellar transaction, the moment a valid proof is submitted." },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} style={{ background: LD.surface, border: `1px solid ${LD.border}`, borderRadius: 14, padding: "32px 28px", transition: "box-shadow 0.2s, transform 0.2s" }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,0,0,0.08)"; e.currentTarget.style.transform = "translateY(-3px)"; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = ""; }}>
                <div style={{ width: 46, height: 46, background: LD.goldBg, borderRadius: 11, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
                  <Icon size={20} style={{ color: LD.gold }} />
                </div>
                <h3 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 17, fontWeight: 700, color: LD.text, marginBottom: 10, letterSpacing: "-0.01em" }}>{title}</h3>
                <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: 14, color: LD.sub, lineHeight: 1.72 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── "Make sense" — text left + image right ── */}
      <section style={{ padding: "80px 48px", background: LD.bg, borderTop: `1px solid ${LD.border}`, borderBottom: `1px solid ${LD.border}` }}>
        <div style={{ maxWidth: 1140, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center" }}>
          <div>
            <img src="/landing/claimproof2.png" alt="Trustless coverage" style={{ width: "110%", display: "block" }} />
          </div>
          <div>
            <h2 style={{ ...ldH, fontSize: "clamp(26px, 3vw, 40px)", marginBottom: 18 }}>
              Make sense of DeFi risk.
            </h2>
            <p style={{ ...ldBody, marginBottom: 20 }}>
              There's a lot to managing crypto exposure — market crashes, volatility spikes, and black swan events.
              Understanding the importance of downside protection is key. But where do you start?
              What makes a good parametric policy? ClaimProof can help you hedge with precision.
            </p>
            <p style={{ ...ldBody, fontSize: 14, marginBottom: 32 }}>
              Today, most DeFi hedging tools require complex options strategies or trusted custodians.
              You won't find tools focused on simple, verifiable, private parametric insurance.
              ClaimProof pairs cryptographic guarantees with a one-minute setup flow.
            </p>
            <button onClick={() => navigate("/dashboard")} style={{ ...ldBtnDark, fontSize: 13 }}>
              Create a Policy <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" style={{ padding: "96px 48px" }}>
        <div style={{ maxWidth: 1140, margin: "0 auto" }}>
          <div style={{ textAlign: "center", maxWidth: 520, margin: "0 auto 64px" }}>
            <span style={ldLabel}>How It Works</span>
            <h2 style={{ ...ldH, fontSize: "clamp(26px, 3.5vw, 44px)" }}>
              Four steps. <em style={{ fontStyle: "italic", color: LD.gold }}>Zero intermediaries.</em>
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 40 }}>
            {[
              { n: "01", icon: Shield, title: "Create Policy",     desc: "Lock USDC collateral in a Soroban smart contract. Set your oracle asset, trigger condition, and payout amount." },
              { n: "02", icon: Eye,    title: "Condition Triggers", desc: "When BTC, ETH, or XLM crosses your defined threshold, the condition is met and the policy becomes claimable." },
              { n: "03", icon: Cpu,    title: "Generate ZK Proof",  desc: "Your browser runs the Circom circuit. The proof confirms the condition was met without revealing the price on-chain." },
              { n: "04", icon: Zap,    title: "Instant Payout",     desc: "Soroban verifies the Groth16 proof via native BN254 host functions. USDC transfers to your beneficiary immediately." },
            ].map(({ n, icon: Icon, title, desc }) => (
              <div key={n}>
                <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, fontWeight: 800, letterSpacing: "0.12em", color: LD.gold, marginBottom: 16 }}>{n}</div>
                <div style={{ width: 40, height: 40, background: LD.goldBg, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                  <Icon size={18} style={{ color: LD.gold }} />
                </div>
                <h3 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 15, fontWeight: 700, color: LD.text, marginBottom: 8 }}>{title}</h3>
                <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: 13, color: LD.sub, lineHeight: 1.72 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding: "96px 48px", background: LD.text }}>
        <div style={{ maxWidth: 640, margin: "0 auto", textAlign: "center" }}>
          <span style={{ ...ldLabel, color: LD.gold }}>Get Started</span>
          <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: "clamp(28px, 4vw, 48px)", lineHeight: 1.1, color: LD.bg, letterSpacing: "-0.025em", marginBottom: 18 }}>
            Ready to hedge with <em style={{ fontStyle: "italic", color: LD.gold }}>mathematics?</em>
          </h2>
          <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: 15, color: "#A1A1AA", lineHeight: 1.75, marginBottom: 36 }}>
            Create your first policy in under a minute. When the market moves, a proof settles it on Stellar in seconds.
          </p>
          <button onClick={() => navigate("/dashboard")} style={{ fontFamily: "'Work Sans', sans-serif", fontSize: 14, fontWeight: 600, padding: "14px 36px", background: LD.gold, color: LD.text, border: "none", cursor: "pointer", borderRadius: 8 }}>
            Create Your First Policy
          </button>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ borderTop: `1px solid ${LD.border}`, padding: "32px 48px", background: LD.bg }}>
        <div style={{ maxWidth: 1140, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <img src="/logo.png" alt="ClaimProof" style={{ height: 36, width: "auto", display: "block" }} />
          </div>
          <div style={{ display: "flex", gap: 28 }}>
            {[{ to: "/dashboard", label: "Dashboard" }, { to: "/how-it-works", label: "How It Works" }, { to: "/create", label: "Create Policy" }].map(({ to, label }) => (
              <Link key={to} to={to} style={{ fontFamily: "'Work Sans', sans-serif", fontSize: 13, color: LD.sub, textDecoration: "none" }}>
                {label}
              </Link>
            ))}
          </div>
          <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: 12, color: LD.faint }}>Built on Stellar Protocol 25</p>
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
    <div style={{ background: LD.bg, minHeight: "100vh" }}>
      <AppNav walletAddress={walletAddress} onOpenWallet={onOpenWallet} onDisconnect={onDisconnect} />
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 52px" }}>

        <PriceOracle />

        {/* Claimable alert banner */}
        <ClaimableBanner policies={policies} prices={prices} />

        {/* Portfolio stats strip */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 40 }}>
          {[
            { label: "Active Policies",  value: String(activePolicies.length),        sub: "currently open" },
            { label: "Total Protected",  value: `${totalProtected.toFixed(0)} USDC`, sub: "locked collateral" },
            { label: "Claimable Now",    value: String(claimableCount),               sub: claimableCount > 0 ? "conditions triggered" : "none triggered" },
            { label: "Total Claimed",    value: `${totalClaimed.toFixed(0)} USDC`,   sub: "paid out" },
          ].map(({ label, value, sub }) => (
            <div key={label} style={{ background: LD.surface, border: `1px solid ${LD.border}`, padding: "22px 24px" }}>
              <div style={{ fontFamily: "'Work Sans', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: LD.faint, marginBottom: 8 }}>{label}</div>
              <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 28, fontWeight: 800, color: LD.gold, letterSpacing: "-0.03em", lineHeight: 1.1 }}>{value}</div>
              <div style={{ fontFamily: "'Work Sans', sans-serif", fontSize: 11, color: LD.faint, marginTop: 4 }}>{sub}</div>
            </div>
          ))}
        </div>

        {/* Policies header */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 26, fontWeight: 800, color: LD.text, letterSpacing: "-0.02em", marginBottom: 4 }}>
              {walletAddress && !showAll ? "Your Policies" : "All Policies"}
            </h2>
            {walletAddress && (
              <button onClick={() => setShowAll(s => !s)}
                style={{ background: "transparent", border: "none", cursor: "pointer", fontFamily: "'Work Sans', sans-serif", fontSize: 12, color: LD.faint, padding: 0, textDecoration: "underline" }}>
                {showAll ? "Show only mine" : "Show all policies"}
              </button>
            )}
          </div>
          <button onClick={() => navigate("/create")} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, fontWeight: 700, padding: "12px 24px", background: LD.text, color: LD.bg, border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
            <Plus size={13} /> New Policy
          </button>
        </div>

        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ height: 80, background: LD.surface, border: `1px solid ${LD.border}`, animation: "pulse 2s infinite" }} />
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <div style={{ background: LD.surface, border: `1px solid ${LD.border}`, padding: "72px 40px", textAlign: "center" }}>
            <div style={{ color: LD.faint, marginBottom: 20, display: "flex", justifyContent: "center" }}>
              <FileText size={32} />
            </div>
            <h3 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 22, fontWeight: 800, color: LD.text, marginBottom: 8 }}>
              {walletAddress ? "No policies for this wallet" : "No policies yet"}
            </h3>
            <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: 14, color: LD.sub, maxWidth: 340, margin: "0 auto 28px" }}>
              {walletAddress
                ? "Create your first policy to start protecting your crypto holdings."
                : "Connect your wallet and create a policy to protect against price movements."}
            </p>
            <button onClick={() => walletAddress ? navigate("/create") : onOpenWallet()}
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, fontWeight: 700, padding: "13px 32px", background: LD.text, color: LD.bg, border: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8 }}>
              {walletAddress ? "Create Policy" : "Connect Wallet"} <ArrowRight size={14} />
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", borderBottom: `1px solid ${LD.border}` }}>
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
    <div style={{ background: LD.bg, minHeight: "100vh" }}>
      <AppNav walletAddress={walletAddress} onOpenWallet={onOpenWallet} onDisconnect={onDisconnect} />
      <div style={{ maxWidth: 700, margin: "0 auto", padding: "48px 52px" }}>
        <div style={{ marginBottom: 36 }}>
          <span style={{ fontFamily: "'Work Sans', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: LD.gold }}>New Policy</span>
          <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 38, fontWeight: 800, color: LD.text, letterSpacing: "-0.025em", marginTop: 10, marginBottom: 10 }}>
            Create Insurance Policy
          </h1>
          <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: 15, color: LD.sub, lineHeight: 1.6 }}>
            Lock USDC as collateral. When the oracle condition triggers, claim instantly with a ZK proof.
          </p>
        </div>
        <CreatePolicy
          onCreated={() => setTimeout(() => navigate("/dashboard"), 2500)}
          walletAddress={walletAddress}
          onOpenWallet={onOpenWallet}
        />
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
    <div style={{ background: LD.bg, minHeight: "100vh" }}>
      <AppNav walletAddress={walletAddress} onOpenWallet={onOpenWallet} onDisconnect={onDisconnect} />
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "56px 52px" }}>
        <div style={{ marginBottom: 56 }}>
          <span style={{ fontFamily: "'Work Sans', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: LD.gold }}>Documentation</span>
          <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 48, fontWeight: 800, color: LD.text, letterSpacing: "-0.03em", lineHeight: 1.05, marginTop: 10, marginBottom: 16 }}>
            How ClaimProof Works
          </h1>
          <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: 16, color: LD.sub, maxWidth: 480, lineHeight: 1.65 }}>
            Trustless parametric insurance powered by zero-knowledge proofs on Stellar Soroban.
          </p>
        </div>

        <div style={{ marginBottom: 56 }}>
          {[
            { n: "01", icon: Shield, title: "Create and fund a policy",  desc: "Lock USDC collateral in a Soroban smart contract. Set your oracle asset, trigger condition, and payout amount. The contract holds the funds until the condition is met or the policy expires." },
            { n: "02", icon: Eye,    title: "Oracle condition triggers",  desc: "When BTC, ETH, or XLM crosses your defined threshold, the insurance condition is met and you can initiate a claim. The oracle reading is fetched from the Reflector Network." },
            { n: "03", icon: Cpu,    title: "Generate a ZK proof",        desc: "Your browser runs the Circom circuit via snarkjs. The proof confirms the oracle condition was met without revealing the exact price on-chain. This takes under 2 seconds." },
            { n: "04", icon: Zap,    title: "Instant payout on Stellar",  desc: "The ClaimProof contract verifies your Groth16 proof using Stellar Protocol 25 native BN254 host functions. Once valid, USDC transfers in seconds. No intermediary, no wait." },
          ].map(({ n, title, desc }, i) => (
            <div key={n} style={{ display: "flex", gap: 32, padding: "36px 0", borderBottom: i < 3 ? `1px solid ${LD.border}` : "none" }}>
              <div style={{ width: 48, height: 48, background: LD.goldBg, border: `1px solid rgba(201,168,76,0.2)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, fontWeight: 800, color: LD.gold }}>{n}</span>
              </div>
              <div style={{ flex: 1, paddingTop: 6 }}>
                <h3 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 20, fontWeight: 700, color: LD.text, marginBottom: 10 }}>{title}</h3>
                <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: 15, color: LD.sub, lineHeight: 1.72 }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>

        <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 26, fontWeight: 800, color: LD.text, marginBottom: 20 }}>Technical Stack</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, marginBottom: 48 }}>
          {stack.map(({ label, value }) => (
            <div key={label} style={{ background: LD.surface, border: `1px solid ${LD.border}`, padding: "20px 24px" }}>
              <div style={{ fontFamily: "'Work Sans', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: LD.faint, marginBottom: 6 }}>{label}</div>
              <div style={{ fontFamily: "'Work Sans', sans-serif", fontSize: 14, fontWeight: 500, color: LD.text }}>{value}</div>
            </div>
          ))}
        </div>

        <div style={{ background: LD.surface, border: `1px solid ${LD.border}`, padding: "36px 36px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 16 }}>
            <div style={{ color: LD.gold, flexShrink: 0, marginTop: 2 }}><Lock size={22} /></div>
            <h3 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 20, fontWeight: 700, color: LD.text }}>Why zero-knowledge proofs?</h3>
          </div>
          <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: 14, color: LD.sub, lineHeight: 1.8, marginBottom: 20 }}>
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
              <CheckCircle2 size={14} style={{ color: LD.gold, flexShrink: 0 }} />
              <span style={{ fontFamily: "'Work Sans', sans-serif", fontSize: 13, color: LD.sub }}>{line}</span>
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
