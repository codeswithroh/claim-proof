import React, { useState, useEffect, useCallback } from "react";
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
} from "lucide-react";
import PriceOracle from "./components/PriceOracle";
import CreatePolicy from "./components/CreatePolicy";
import PolicyCard from "./components/PolicyCard";
import AppMockup from "./components/AppMockup";
import WalletModal from "./components/WalletModal";
import type { Policy } from "./types";

const C = {
  bg: "#f5f4ef",
  card: "#ffffff",
  text: "#141414",
  muted: "#878680",
  faint: "#b0afa9",
  border: "#e5e4df",
};

// ── Landing Nav ───────────────────────────────────────────────────────────────

function LandingNav() {
  const navigate = useNavigate();
  return (
    <nav className="absolute top-0 left-0 right-0 z-50">
      <div className="max-w-5xl mx-auto px-8 h-16 flex items-center justify-between">
        <span className="font-display text-xl font-medium" style={{ color: C.text }}>
          ClaimProof
        </span>
        <div className="flex items-center gap-6">
          <a href="#how-it-works" className="text-sm" style={{ color: C.muted, textDecoration: "none" }}>
            How It Works
          </a>
          <a href="#features" className="text-sm" style={{ color: C.muted, textDecoration: "none" }}>
            Features
          </a>
        </div>
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-opacity hover:opacity-80"
          style={{ background: C.text, color: "#fff" }}
        >
          Launch App
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </nav>
  );
}

// ── App Nav ───────────────────────────────────────────────────────────────────

interface AppNavProps {
  walletAddress: string | null;
  onOpenWallet: () => void;
}

function AppNav({ walletAddress, onOpenWallet }: AppNavProps) {
  const navigate = useNavigate();
  return (
    <nav
      className="sticky top-0 z-50"
      style={{
        background: "rgba(245,244,239,0.92)",
        backdropFilter: "blur(12px)",
        borderBottom: `1px solid ${C.border}`,
      }}
    >
      <div className="max-w-5xl mx-auto px-8 h-14 flex items-center justify-between">
        <Link
          to="/"
          className="font-display text-lg font-medium"
          style={{ color: C.text, textDecoration: "none" }}
        >
          ClaimProof
        </Link>

        <div className="flex items-center gap-1">
          {[
            { to: "/dashboard", label: "Policies" },
            { to: "/how-it-works", label: "How It Works" },
          ].map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              style={({ isActive }) => ({
                padding: "5px 12px",
                borderRadius: 9999,
                fontSize: 13,
                fontWeight: 500,
                textDecoration: "none",
                background: isActive ? C.text : "transparent",
                color: isActive ? "#fff" : C.muted,
                transition: "all 0.15s",
              })}
            >
              {label}
            </NavLink>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#2d7d46", boxShadow: "0 0 4px #2d7d46" }} />
            <span className="text-xs" style={{ color: C.faint }}>Testnet</span>
          </div>
          <button
            onClick={() => navigate("/create")}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-opacity hover:opacity-80"
            style={{ border: `1px solid ${C.border}`, color: C.text, background: "white" }}
          >
            <Plus className="w-3.5 h-3.5" />
            New Policy
          </button>
          {walletAddress ? (
            <button
              onClick={onOpenWallet}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium"
              style={{ border: `1px solid #2d7d46`, color: "#2d7d46", background: "rgba(45,125,70,0.06)" }}
            >
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#2d7d46" }} />
              {walletAddress.slice(0, 4)}...{walletAddress.slice(-4)}
            </button>
          ) : (
            <button
              onClick={onOpenWallet}
              className="px-4 py-1.5 rounded-full text-xs font-medium transition-opacity hover:opacity-80"
              style={{ background: C.text, color: "#fff" }}
            >
              Connect Wallet
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}

// ── Landing Page ──────────────────────────────────────────────────────────────

function LandingPage() {
  const navigate = useNavigate();

  const features = [
    {
      icon: Shield,
      title: "No adjusters, ever",
      desc: "Your payout is decided by math, not a claims team. When the oracle condition hits, the contract pays out.",
    },
    {
      icon: Lock,
      title: "Your position stays private",
      desc: "A ZK proof confirms the condition was met without revealing the exact price or your position size on-chain.",
    },
    {
      icon: Zap,
      title: "Seconds, not weeks",
      desc: "Traditional insurance claims take weeks. ClaimProof settles in one Stellar transaction.",
    },
  ];

  return (
    <div style={{ background: C.bg, minHeight: "100vh" }}>
      <LandingNav />

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="pt-16 px-6">
        <div className="max-w-5xl mx-auto">
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              border: `1px solid ${C.border}`,
              background: C.card,
              boxShadow: "0 4px 32px rgba(0,0,0,0.06)",
            }}
          >
            {/* Text */}
            <div className="px-12 pt-14 pb-10 text-center max-w-2xl mx-auto">
              <div
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-8 text-xs font-medium"
                style={{ background: "#f5f4ef", color: C.muted, border: `1px solid ${C.border}` }}
              >
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#2d7d46" }} />
                Built on Stellar Protocol 25
              </div>

              <h1
                className="font-display font-light mb-5 leading-none"
                style={{ fontSize: "clamp(40px, 5.5vw, 64px)", color: C.text, letterSpacing: "-0.02em" }}
              >
                Set it. Prove it.
                <br />
                Get paid.
              </h1>

              <p className="text-base leading-relaxed mb-8" style={{ color: C.muted, maxWidth: 440, margin: "0 auto 2rem" }}>
                Parametric insurance on Stellar. When your price condition hits,
                a ZK proof unlocks your USDC payout automatically.
                No paperwork, no adjusters, no delays.
              </p>

              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => navigate("/dashboard")}
                  className="flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium transition-opacity hover:opacity-80"
                  style={{ background: C.text, color: "#fff" }}
                >
                  Launch App
                  <ArrowRight className="w-4 h-4" />
                </button>
                <a
                  href="#how-it-works"
                  className="px-6 py-3 rounded-full text-sm font-medium"
                  style={{ border: `1px solid ${C.border}`, color: C.muted, textDecoration: "none", background: "white" }}
                >
                  See How It Works
                </a>
              </div>
            </div>

            {/* App mockup */}
            <div className="mx-6 mb-6 rounded-xl overflow-hidden" style={{ border: `1px solid ${C.border}` }}>
              <AppMockup />
            </div>
          </div>
        </div>
      </section>

      {/* ── Trust strip ───────────────────────────────────────────────── */}
      <section className="py-8">
        <div className="max-w-5xl mx-auto px-8">
          <div
            className="flex items-center justify-center gap-8 flex-wrap"
            style={{ borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, padding: "20px 0" }}
          >
            {["No Setup Fee", "ZK Verified", "Instant Payout", "Cancel Anytime"].map((item, i, arr) => (
              <React.Fragment key={item}>
                <span className="text-sm" style={{ color: C.muted }}>{item}</span>
                {i < arr.length - 1 && <span style={{ color: C.border }}>·</span>}
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────────────── */}
      <section id="features" className="py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="mb-12">
            <p className="text-xs font-medium tracking-[0.2em] uppercase mb-3" style={{ color: C.faint }}>
              Why ClaimProof
            </p>
            <h2
              className="font-display font-light"
              style={{ fontSize: "clamp(28px, 4vw, 42px)", color: C.text, letterSpacing: "-0.02em" }}
            >
              Insurance that works the
              <br />
              way markets do.
            </h2>
          </div>

          <div className="grid grid-cols-3 gap-5">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-xl bg-white p-7" style={{ border: `1px solid ${C.border}` }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center mb-5" style={{ background: C.bg }}>
                  <Icon className="w-5 h-5" style={{ color: C.muted }} />
                </div>
                <h3 className="font-display text-lg font-light mb-2" style={{ color: C.text }}>{title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: C.muted }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ──────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-16 px-6" style={{ background: "white" }}>
        <div className="max-w-5xl mx-auto">
          <div className="mb-12">
            <p className="text-xs font-medium tracking-[0.2em] uppercase mb-3" style={{ color: C.faint }}>
              How It Works
            </p>
            <h2
              className="font-display font-light"
              style={{ fontSize: "clamp(28px, 4vw, 42px)", color: C.text, letterSpacing: "-0.02em" }}
            >
              Three steps. Done.
            </h2>
          </div>

          <div className="grid grid-cols-3 gap-10">
            {[
              {
                n: "01",
                icon: Shield,
                title: "Create a policy",
                desc: "Pick your asset, set a trigger price, and lock in your payout amount. Takes about a minute.",
              },
              {
                n: "02",
                icon: Eye,
                title: "Condition triggers",
                desc: "When BTC, ETH, or XLM crosses your threshold, generate a ZK proof in your browser in under 2 seconds.",
              },
              {
                n: "03",
                icon: Zap,
                title: "Claim instantly",
                desc: "Submit the proof to Stellar. Once verified on-chain, your USDC lands in your wallet automatically.",
              },
            ].map(({ n, icon: Icon, title, desc }) => (
              <div key={n}>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-xs font-mono" style={{ color: C.faint }}>{n}</span>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: C.bg }}>
                    <Icon className="w-4 h-4" style={{ color: C.muted }} />
                  </div>
                </div>
                <h3 className="font-display text-lg font-light mb-2" style={{ color: C.text }}>{title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: C.muted }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────── */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="rounded-2xl bg-white text-center px-12 py-16" style={{ border: `1px solid ${C.border}` }}>
            <p className="text-xs font-medium tracking-[0.2em] uppercase mb-4" style={{ color: C.faint }}>
              Get Started
            </p>
            <h2
              className="font-display font-light mb-4"
              style={{ fontSize: "clamp(28px, 4vw, 44px)", color: C.text, letterSpacing: "-0.02em" }}
            >
              Ready to protect what
              <br />
              you have built?
            </h2>
            <p className="text-sm mb-8" style={{ color: C.muted, maxWidth: 360, margin: "0 auto 2rem" }}>
              Create your first policy in under a minute. No account required.
            </p>
            <button
              onClick={() => navigate("/dashboard")}
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-sm font-medium transition-opacity hover:opacity-80"
              style={{ background: C.text, color: "#fff" }}
            >
              Launch App
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <footer className="py-10 px-6" style={{ borderTop: `1px solid ${C.border}` }}>
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <span className="font-display text-base font-medium" style={{ color: C.text }}>ClaimProof</span>
            <p className="text-xs mt-1" style={{ color: C.faint }}>ZK parametric insurance on Stellar</p>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/dashboard" className="text-xs" style={{ color: C.faint, textDecoration: "none" }}>Dashboard</Link>
            <Link to="/how-it-works" className="text-xs" style={{ color: C.faint, textDecoration: "none" }}>How It Works</Link>
            <Link to="/create" className="text-xs" style={{ color: C.faint, textDecoration: "none" }}>Create Policy</Link>
          </div>
          <p className="text-xs" style={{ color: C.faint }}>Built on Stellar Protocol 25</p>
        </div>
      </footer>
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

interface PageProps { walletAddress: string | null; onOpenWallet: () => void; }

function DashboardPage({ walletAddress, onOpenWallet }: PageProps) {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadPolicies = useCallback(async () => {
    try {
      const res = await fetch("/api/policies");
      const data = await res.json();
      if (data.success) setPolicies(data.policies);
    } catch (_) {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadPolicies(); }, [loadPolicies]);

  const active = policies.filter((p) => p.status === "active").length;
  const claimed = policies.filter((p) => p.status === "claimed").length;
  const totalLocked = policies.reduce((s, p) => s + Number(p.payoutAmount) / 1e7, 0);

  return (
    <div style={{ background: C.bg, minHeight: "100vh" }}>
      <AppNav walletAddress={walletAddress} onOpenWallet={onOpenWallet} />
      <div className="max-w-5xl mx-auto px-8 py-10">
        <PriceOracle />

        <div className="grid grid-cols-3 gap-4 mb-10">
          {[
            { label: "Active", value: String(active) },
            { label: "Claimed", value: String(claimed) },
            { label: "Total Locked", value: `${totalLocked.toFixed(0)} USDC` },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-xl bg-white px-6 py-5" style={{ border: `1px solid ${C.border}` }}>
              <div className="text-xs font-medium tracking-wider uppercase mb-2" style={{ color: C.faint }}>{label}</div>
              <div className="font-display text-3xl font-light" style={{ color: C.text }}>{value}</div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-2xl font-light" style={{ color: C.text }}>Your Policies</h2>
          <button
            onClick={() => navigate("/create")}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-opacity hover:opacity-80"
            style={{ background: C.text, color: "#fff" }}
          >
            <Plus className="w-4 h-4" />
            New Policy
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl h-20 animate-pulse" style={{ background: "#eeede8" }} />
            ))}
          </div>
        ) : policies.length === 0 ? (
          <div className="rounded-xl bg-white px-8 py-20 text-center" style={{ border: `1px solid ${C.border}` }}>
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: C.bg }}>
              <FileText className="w-5 h-5" style={{ color: C.faint }} />
            </div>
            <h3 className="font-display text-xl font-light mb-2" style={{ color: C.text }}>No policies yet</h3>
            <p className="text-sm mb-7" style={{ color: C.muted, maxWidth: 300, margin: "0 auto 1.75rem" }}>
              Create your first policy to protect against price movements on BTC, ETH, or XLM.
            </p>
            <button
              onClick={() => navigate("/create")}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full text-sm font-medium transition-opacity hover:opacity-80"
              style={{ background: C.text, color: "#fff" }}
            >
              Create Policy
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {policies.map((p) => (
              <PolicyCard key={p._id} policy={p} onUpdated={loadPolicies} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Create Policy Page ────────────────────────────────────────────────────────

function CreatePolicyPage({ walletAddress, onOpenWallet }: PageProps) {
  const navigate = useNavigate();
  return (
    <div style={{ background: C.bg, minHeight: "100vh" }}>
      <AppNav walletAddress={walletAddress} onOpenWallet={onOpenWallet} />
      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className="mb-8">
          <p className="text-xs font-medium tracking-[0.2em] uppercase mb-3" style={{ color: C.faint }}>
            New Policy
          </p>
          <h1 className="font-display font-light mb-2" style={{ fontSize: 38, color: C.text, letterSpacing: "-0.02em" }}>
            Create Insurance Policy
          </h1>
          <p className="text-sm" style={{ color: C.muted }}>
            Lock USDC as collateral. When the oracle condition triggers, claim instantly with a ZK proof.
          </p>
        </div>
        <div className="rounded-2xl bg-white p-8" style={{ border: `1px solid ${C.border}` }}>
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

function HowItWorksPage({ walletAddress, onOpenWallet }: PageProps) {
  const stack = [
    { label: "ZK Circuit", value: "Circom 2 and Groth16 (BN254 curve)" },
    { label: "Proving", value: "snarkjs in-browser, under 2 seconds" },
    { label: "On-chain Verification", value: "Soroban BN254 host functions (Protocol 25)" },
    { label: "Oracle", value: "Reflector Network (Stellar-native)" },
    { label: "Payment Token", value: "USDC via SEP-41 SAC" },
    { label: "Proof Size", value: "~800 bytes (Groth16)" },
  ];

  return (
    <div style={{ background: C.bg, minHeight: "100vh" }}>
      <AppNav walletAddress={walletAddress} onOpenWallet={onOpenWallet} />
      <div className="max-w-4xl mx-auto px-8 py-14">
        <div className="mb-14">
          <p className="text-xs font-medium tracking-[0.2em] uppercase mb-3" style={{ color: C.faint }}>
            Documentation
          </p>
          <h1
            className="font-display font-light mb-4"
            style={{ fontSize: 48, color: C.text, letterSpacing: "-0.02em", lineHeight: 1.05 }}
          >
            How ClaimProof Works
          </h1>
          <p className="text-base" style={{ color: C.muted, maxWidth: 460 }}>
            Trustless parametric insurance powered by zero-knowledge proofs on Stellar Soroban.
          </p>
        </div>

        <div className="mb-14">
          {[
            {
              n: "01",
              icon: Shield,
              title: "Create and fund a policy",
              desc: "Lock USDC collateral in a Soroban smart contract. Set your oracle asset, trigger condition, and payout amount. The contract holds the funds until the condition is met or the policy expires.",
            },
            {
              n: "02",
              icon: Eye,
              title: "Oracle condition triggers",
              desc: "When BTC, ETH, or XLM crosses your defined threshold, the insurance condition is met and you can initiate a claim. The oracle reading is fetched from the Reflector Network.",
            },
            {
              n: "03",
              icon: Cpu,
              title: "Generate a ZK proof",
              desc: "Your browser runs the Circom circuit via snarkjs. The proof confirms the oracle condition was met without revealing the exact price on-chain. This takes under 2 seconds.",
            },
            {
              n: "04",
              icon: Zap,
              title: "Instant payout on Stellar",
              desc: "The ClaimProof contract verifies your Groth16 proof using Stellar Protocol 25 native BN254 host functions. Once valid, USDC transfers in seconds. No intermediary, no wait.",
            },
          ].map(({ n, icon: Icon, title, desc }, i) => (
            <div key={n} className="flex gap-8 py-9" style={{ borderBottom: i < 3 ? `1px solid ${C.border}` : "none" }}>
              <div className="flex-shrink-0 pt-0.5">
                <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "white", border: `1px solid ${C.border}` }}>
                  <Icon className="w-4 h-4" style={{ color: C.muted }} />
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xs font-mono" style={{ color: C.faint }}>{n}</span>
                  <h3 className="font-display text-xl font-light" style={{ color: C.text }}>{title}</h3>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: C.muted }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>

        <h2 className="font-display text-2xl font-light mb-5" style={{ color: C.text }}>Technical Stack</h2>
        <div
          className="grid grid-cols-2 gap-px mb-12"
          style={{ background: C.border, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}
        >
          {stack.map(({ label, value }) => (
            <div key={label} className="bg-white px-6 py-5">
              <div className="text-xs font-medium tracking-wider uppercase mb-1" style={{ color: C.faint }}>{label}</div>
              <div className="text-sm" style={{ color: C.text }}>{value}</div>
            </div>
          ))}
        </div>

        <div className="rounded-2xl bg-white p-8" style={{ border: `1px solid ${C.border}` }}>
          <div className="flex items-start gap-4 mb-4">
            <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: C.bg }}>
              <Lock className="w-4 h-4" style={{ color: C.muted }} />
            </div>
            <h3 className="font-display text-xl font-light pt-1" style={{ color: C.text }}>
              Why zero-knowledge proofs?
            </h3>
          </div>
          <p className="text-sm leading-relaxed mb-5" style={{ color: C.muted }}>
            Traditional parametric insurance requires publishing oracle data publicly,
            exposing your financial position on-chain. With ZK proofs, you confirm a loss
            occurred without revealing the exact oracle reading. A fund manager proving a price
            hit their stop-loss does not leak their position size or entry price.
            The Soroban contract sees one thing: proof valid, transfer USDC.
          </p>
          {[
            "Condition verified cryptographically, no trusted adjuster required",
            "Oracle value never exposed on-chain, only the Poseidon commitment",
            "Groth16 verification costs under 2 seconds in-browser via snarkjs",
          ].map((line) => (
            <div key={line} className="flex items-center gap-2 text-sm mb-2" style={{ color: C.muted }}>
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: "#2d7d46" }} />
              {line}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [showWallet, setShowWallet] = useState(false);

  const pageProps: PageProps = {
    walletAddress,
    onOpenWallet: () => setShowWallet(true),
  };

  return (
    <>
      {showWallet && (
        <WalletModal
          onConnected={(address) => { setWalletAddress(address); setShowWallet(false); }}
          onClose={() => setShowWallet(false)}
        />
      )}
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/dashboard" element={<DashboardPage {...pageProps} />} />
        <Route path="/create" element={<CreatePolicyPage {...pageProps} />} />
        <Route path="/how-it-works" element={<HowItWorksPage {...pageProps} />} />
      </Routes>
    </>
  );
}
