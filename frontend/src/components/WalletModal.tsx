import React, { useState, useEffect } from "react";
import { X, ExternalLink, Loader2, AlertCircle } from "lucide-react";

const LD = {
  bg:      "#FDF7F4",
  surface: "#FFFFFF",
  text:    "#18181B",
  sub:     "#71717A",
  faint:   "#A1A1AA",
  border:  "#E4E4E7",
  gold:    "#C9A84C",
};

// ── Wallet definitions ────────────────────────────────────────────────────────

interface WalletDef {
  id: string;
  name: string;
  desc: string;
  logo: string;
  detect: () => boolean | Promise<boolean>;
  connect: () => Promise<string>;
  installUrl: string;
  alwaysAvailable?: boolean;
}

const WALLETS: WalletDef[] = [
  {
    id: "freighter",
    name: "Freighter",
    desc: "Official SDF wallet",
    logo: "/wallets/freighter.png",
    detect: () =>
      new Promise<boolean>((resolve) => {
        const messageId = Math.floor(Math.random() * 1e9);
        const done = (val: boolean) => {
          clearTimeout(t);
          window.removeEventListener("message", handler);
          resolve(val);
        };
        const handler = (e: MessageEvent) => {
          if (e.data?.source === "FREIGHTER_EXTERNAL_MSG_RESPONSE") done(true);
        };
        const t = setTimeout(() => done(false), 800);
        window.addEventListener("message", handler);
        window.postMessage(
          { source: "FREIGHTER_EXTERNAL_MSG_REQUEST", type: "REQUEST_CONNECTION_STATUS", messageId },
          window.location.origin
        );
      }),
    connect: async () => {
      const send = (type: string) =>
        new Promise<any>((resolve, reject) => {
          const messageId = Math.floor(Math.random() * 1e9);
          const handler = (e: MessageEvent) => {
            if (e.data?.source !== "FREIGHTER_EXTERNAL_MSG_RESPONSE") return;
            if (e.data?.messagedId !== messageId) return;
            clearTimeout(t);
            window.removeEventListener("message", handler);
            if (e.data.error) reject(new Error(e.data.error));
            else resolve(e.data);
          };
          const t = setTimeout(() => {
            window.removeEventListener("message", handler);
            reject(new Error("Freighter timed out. Make sure the extension is unlocked."));
          }, 30_000);
          window.addEventListener("message", handler);
          window.postMessage(
            { source: "FREIGHTER_EXTERNAL_MSG_REQUEST", type, messageId },
            window.location.origin
          );
        });
      const access = await send("REQUEST_ACCESS");
      if (access.publicKey) return access.publicKey;
      const key = await send("REQUEST_PUBLIC_KEY");
      if (!key.publicKey) throw new Error("Freighter did not return a public key.");
      return key.publicKey;
    },
    installUrl: "https://www.freighter.app/",
  },
  {
    id: "xbull",
    name: "xBull",
    desc: "Feature-rich Stellar wallet",
    logo: "/wallets/xbull.svg",
    detect: () => !!(window as any).xBull,
    connect: async () => {
      const xb = (window as any).xBull;
      const result = await xb.connect();
      return result.publicKey;
    },
    installUrl: "https://xbull.app/",
  },
  {
    id: "lobstr",
    name: "Lobstr",
    desc: "Simple and secure",
    logo: "/wallets/lobstr.png",
    detect: () => !!(window as any).lobstr,
    connect: async () => {
      const lobstr = (window as any).lobstr;
      return lobstr.getPublicKey();
    },
    installUrl: "https://lobstr.co/",
  },
  {
    id: "rabet",
    name: "Rabet",
    desc: "Browser extension wallet",
    logo: "/wallets/rabet.png",
    detect: () => !!(window as any).rabet,
    connect: async () => {
      const rabet = (window as any).rabet;
      const result = await rabet.connect();
      return result.publicKey;
    },
    installUrl: "https://rabet.io/",
  },
  {
    id: "albedo",
    name: "Albedo",
    desc: "No install required",
    logo: "/wallets/albedo.png",
    detect: () => true,
    alwaysAvailable: true,
    connect: async () => {
      const token = Math.random().toString(36).slice(2);
      const url = `https://albedo.link/intent/public_key?token=${token}&callback=postMessage`;
      return new Promise<string>((resolve, reject) => {
        const popup = window.open(url, "albedo", "width=480,height=560,left=400,top=200");
        if (!popup) { reject(new Error("Popup was blocked. Allow popups for this site and try again.")); return; }
        const cleanup = () => window.removeEventListener("message", handler);
        const handler = (e: MessageEvent) => {
          if (e.origin !== "https://albedo.link") return;
          cleanup();
          const { pubkey, error } = e.data ?? {};
          if (pubkey) resolve(pubkey);
          else reject(new Error(error || "Albedo did not return a public key."));
        };
        window.addEventListener("message", handler);
        const poller = setInterval(() => {
          if (popup.closed) { clearInterval(poller); cleanup(); reject(new Error("Albedo popup was closed before authorizing.")); }
        }, 500);
        setTimeout(() => { clearInterval(poller); cleanup(); reject(new Error("Albedo: timed out waiting for authorization.")); }, 120_000);
      });
    },
    installUrl: "https://albedo.link/",
  },
];

// ── Detection ─────────────────────────────────────────────────────────────────

function useWalletDetection() {
  const [detected, setDetected] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let cancelled = false;
    const runDetection = async () => {
      const pairs = await Promise.all(
        WALLETS.map(async (w) => {
          const result = w.alwaysAvailable ? true : await Promise.resolve(w.detect());
          return [w.id, result] as const;
        })
      );
      if (!cancelled) setDetected(Object.fromEntries(pairs));
    };
    runDetection();
    const retryTimer = setTimeout(() => { if (!cancelled) runDetection(); }, 1000);
    return () => { cancelled = true; clearTimeout(retryTimer); };
  }, []);

  return detected;
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props { onConnected: (address: string, walletId: string) => void; onClose: () => void; }
type ConnectState = "idle" | "connecting" | "error";

export default function WalletModal({ onConnected, onClose }: Props) {
  const detected = useWalletDetection();
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [connectState, setConnectState] = useState<ConnectState>("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleConnect = async (wallet: WalletDef) => {
    setConnectingId(wallet.id);
    setConnectState("connecting");
    setError("");
    try {
      const address = await wallet.connect();
      onConnected(address, wallet.id);
    } catch (err: any) {
      setError(err?.message || "Connection failed.");
      setConnectState("error");
      setConnectingId(null);
    }
  };

  const available    = WALLETS.filter(w => detected[w.id]);
  const notInstalled = WALLETS.filter(w => !detected[w.id]);

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, background: "rgba(0,0,0,0.35)", backdropFilter: "blur(6px)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ width: "100%", maxWidth: 380, background: LD.surface, border: `1px solid ${LD.border}`, boxShadow: "0 24px 64px rgba(0,0,0,0.12)" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "22px 24px 18px", borderBottom: `1px solid ${LD.border}` }}>
          <div>
            <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 20, fontWeight: 800, color: LD.text, marginBottom: 3 }}>Connect Wallet</h2>
            <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: 12, color: LD.faint }}>Choose a Stellar-compatible wallet</p>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", background: LD.bg, border: `1px solid ${LD.border}`, cursor: "pointer", color: LD.sub }}>
            <X size={14} />
          </button>
        </div>

        <div style={{ padding: "16px 24px" }}>
          {connectState === "error" && error && (
            <div style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "10px 14px", marginBottom: 16, background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.2)", color: "#dc2626", fontFamily: "'Work Sans', sans-serif", fontSize: 12 }}>
              <AlertCircle size={12} style={{ flexShrink: 0, marginTop: 1 }} />
              {error}
            </div>
          )}

          {available.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: LD.faint, marginBottom: 10 }}>Available</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {available.map(wallet => (
                  <WalletRow key={wallet.id} wallet={wallet} isAvailable loading={connectingId === wallet.id} disabled={connectState === "connecting"} onConnect={() => handleConnect(wallet)} />
                ))}
              </div>
            </div>
          )}

          {notInstalled.length > 0 && (
            <div>
              {available.length > 0 && <div style={{ borderTop: `1px solid ${LD.border}`, marginBottom: 16 }} />}
              <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: LD.faint, marginBottom: 10 }}>Not installed</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {notInstalled.map(wallet => (
                  <WalletRow key={wallet.id} wallet={wallet} isAvailable={false} loading={false} disabled={false} onInstall={() => window.open(wallet.installUrl, "_blank", "noopener")} />
                ))}
              </div>
            </div>
          )}
        </div>

        <div style={{ padding: "8px 24px 20px", textAlign: "center" }}>
          <p style={{ fontFamily: "'Work Sans', sans-serif", fontSize: 11, color: LD.faint }}>
            By connecting you agree to interact with Stellar Testnet only.
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Wallet row ────────────────────────────────────────────────────────────────

interface RowProps { wallet: WalletDef; isAvailable: boolean; loading: boolean; disabled: boolean; onConnect?: () => void; onInstall?: () => void; }

function WalletRow({ wallet, isAvailable, loading, disabled, onConnect, onInstall }: RowProps) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12, padding: "12px 14px",
      border: `1px solid ${LD.border}`,
      background: isAvailable ? LD.surface : LD.bg,
      opacity: disabled && !loading ? 0.45 : 1,
    }}>
      <div style={{ width: 34, height: 34, background: LD.bg, border: `1px solid ${LD.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" }}>
        <img src={wallet.logo} alt={wallet.name} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, fontWeight: 700, color: isAvailable ? LD.text : LD.sub }}>{wallet.name}</div>
        <div style={{ fontFamily: "'Work Sans', sans-serif", fontSize: 11, color: LD.faint }}>{wallet.desc}</div>
      </div>
      {isAvailable ? (
        <button onClick={onConnect} disabled={disabled}
          style={{ fontFamily: "'Work Sans', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", padding: "8px 14px", background: LD.text, color: LD.bg, border: "none", cursor: disabled ? "not-allowed" : "pointer", flexShrink: 0, display: "flex", alignItems: "center", gap: 5 }}>
          {loading ? <><Loader2 size={10} style={{ animation: "spin 1s linear infinite" }} />Connecting</> : "Connect"}
        </button>
      ) : (
        <button onClick={onInstall}
          style={{ fontFamily: "'Work Sans', sans-serif", fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", padding: "7px 12px", background: "transparent", color: LD.sub, border: `1px solid ${LD.border}`, cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center", gap: 5 }}>
          Get <ExternalLink size={10} />
        </button>
      )}
    </div>
  );
}
