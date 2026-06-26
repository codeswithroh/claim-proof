import React, { useState, useEffect } from "react";
import { X, ExternalLink, Loader2, AlertCircle } from "lucide-react";

const C = {
  bg: "#f5f4ef",
  card: "#ffffff",
  text: "#141414",
  muted: "#878680",
  faint: "#b0afa9",
  border: "#e5e4df",
};

// ── Wallet definitions ────────────────────────────────────────────────────────

interface WalletDef {
  id: string;
  name: string;
  desc: string;
  logo: string;
  /** Sync or async — returns true if the wallet is installed/available */
  detect: () => boolean | Promise<boolean>;
  connect: () => Promise<string>;
  installUrl: string;
  /** Always show as Available regardless of detection (e.g. web-based) */
  alwaysAvailable?: boolean;
}

const WALLETS: WalletDef[] = [
  {
    id: "freighter",
    name: "Freighter",
    desc: "Official SDF wallet",
    logo: "/wallets/freighter.png",
    // Freighter v5+ (Manifest V3) no longer injects window.freighter.
    // It uses a postMessage bridge — content script listens for FREIGHTER_EXTERNAL_MSG_REQUEST
    // and replies with FREIGHTER_EXTERNAL_MSG_RESPONSE. Detection pings REQUEST_CONNECTION_STATUS
    // with a short timeout; silence means not installed.
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
      // Sends a message through the postMessage bridge and resolves with the full response.
      // Note: Freighter's content script has a typo — response field is "messagedId" not "messageId".
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

      // REQUEST_ACCESS opens the approval popup; response contains publicKey on approval.
      const access = await send("REQUEST_ACCESS");
      if (access.publicKey) return access.publicKey;
      // Fallback: fetch explicitly
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
      // Albedo uses a popup + postMessage.
      // Token prevents replay attacks; response field is `pubkey` (not `public_key`).
      const token = Math.random().toString(36).slice(2);
      const url = `https://albedo.link/intent/public_key?token=${token}&callback=postMessage`;

      return new Promise<string>((resolve, reject) => {
        const popup = window.open(url, "albedo", "width=480,height=560,left=400,top=200");
        if (!popup) {
          reject(new Error("Popup was blocked. Allow popups for this site and try again."));
          return;
        }

        const cleanup = () => window.removeEventListener("message", handler);

        const handler = (e: MessageEvent) => {
          if (e.origin !== "https://albedo.link") return;
          cleanup();
          const { pubkey, error } = e.data ?? {};
          if (pubkey) resolve(pubkey);
          else reject(new Error(error || "Albedo did not return a public key."));
        };

        window.addEventListener("message", handler);

        // Poll for closed popup (user dismissed without authorizing)
        const poller = setInterval(() => {
          if (popup.closed) {
            clearInterval(poller);
            cleanup();
            reject(new Error("Albedo popup was closed before authorizing."));
          }
        }, 500);

        // Hard timeout
        setTimeout(() => {
          clearInterval(poller);
          cleanup();
          reject(new Error("Albedo: timed out waiting for authorization."));
        }, 120_000);
      });
    },
    installUrl: "https://albedo.link/",
  },
];

// ── Detection ─────────────────────────────────────────────────────────────────
// Detection is async: Freighter v5 uses a postMessage round-trip (no window property).
// Other wallets resolve synchronously. We run all in parallel on modal open, then
// do one retry after 1 s to catch extensions that inject slightly late.

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

    // First pass immediately
    runDetection();

    // Second pass after 1 s for extensions that inject slightly late
    const retryTimer = setTimeout(() => {
      if (!cancelled) runDetection();
    }, 1000);

    return () => {
      cancelled = true;
      clearTimeout(retryTimer);
    };
  }, []);

  return detected;
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  onConnected: (address: string, walletId: string) => void;
  onClose: () => void;
}

type ConnectState = "idle" | "connecting" | "error";

export default function WalletModal({ onConnected, onClose }: Props) {
  const detected = useWalletDetection();
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [connectState, setConnectState] = useState<ConnectState>("idle");
  const [error, setError] = useState("");

  // Close on Escape
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

  const available = WALLETS.filter((w) => detected[w.id]);
  const notInstalled = WALLETS.filter((w) => !detected[w.id]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: "rgba(20,20,20,0.45)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-sm rounded-2xl"
        style={{ background: C.card, border: `1px solid ${C.border}`, boxShadow: "0 20px 60px rgba(0,0,0,0.18)" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 pt-6 pb-4"
          style={{ borderBottom: `1px solid ${C.border}` }}
        >
          <div>
            <h2 className="font-display text-xl font-light" style={{ color: C.text }}>
              Connect Wallet
            </h2>
            <p className="text-xs mt-0.5" style={{ color: C.faint }}>
              Choose a Stellar-compatible wallet
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full"
            style={{ background: C.bg, color: C.muted }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-4">
          {/* Error banner */}
          {connectState === "error" && error && (
            <div
              className="flex items-start gap-2 rounded-lg px-3 py-2.5 mb-4 text-xs"
              style={{ background: "rgba(155,28,28,0.06)", border: "1px solid rgba(155,28,28,0.18)", color: "#9b1c1c" }}
            >
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          {/* Available wallets */}
          {available.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-medium tracking-wider uppercase mb-3" style={{ color: C.faint }}>
                Available
              </p>
              <div className="space-y-2">
                {available.map((wallet) => (
                  <WalletRow
                    key={wallet.id}
                    wallet={wallet}
                    isAvailable
                    loading={connectingId === wallet.id}
                    disabled={connectState === "connecting"}
                    onConnect={() => handleConnect(wallet)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Not installed */}
          {notInstalled.length > 0 && (
            <div>
              {available.length > 0 && (
                <div style={{ borderTop: `1px solid ${C.border}`, marginBottom: 16 }} />
              )}
              <p className="text-xs font-medium tracking-wider uppercase mb-3" style={{ color: C.faint }}>
                Not installed
              </p>
              <div className="space-y-2">
                {notInstalled.map((wallet) => (
                  <WalletRow
                    key={wallet.id}
                    wallet={wallet}
                    isAvailable={false}
                    loading={false}
                    disabled={false}
                    onInstall={() => window.open(wallet.installUrl, "_blank", "noopener")}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="px-6 pb-5 pt-1">
          <p className="text-xs text-center" style={{ color: C.faint }}>
            By connecting you agree to interact with Stellar Testnet only.
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Wallet row ────────────────────────────────────────────────────────────────

interface RowProps {
  wallet: WalletDef;
  isAvailable: boolean;
  loading: boolean;
  disabled: boolean;
  onConnect?: () => void;
  onInstall?: () => void;
}

function WalletRow({ wallet, isAvailable, loading, disabled, onConnect, onInstall }: RowProps) {
  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-xl transition-opacity"
      style={{
        border: `1px solid ${C.border}`,
        background: isAvailable ? "white" : C.bg,
        opacity: disabled && !loading ? 0.5 : 1,
      }}
    >
      <div
        className="w-9 h-9 rounded-xl flex-shrink-0 overflow-hidden"
        style={{ background: C.bg }}
      >
        <img
          src={wallet.logo}
          alt={wallet.name}
          className="w-full h-full object-contain"
        />
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium" style={{ color: isAvailable ? C.text : C.muted }}>
          {wallet.name}
        </div>
        <div className="text-xs" style={{ color: C.faint }}>{wallet.desc}</div>
      </div>

      {isAvailable ? (
        <button
          onClick={onConnect}
          disabled={disabled}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-opacity hover:opacity-80"
          style={{ background: C.text, color: "white", flexShrink: 0 }}
        >
          {loading ? (
            <><Loader2 className="w-3 h-3 animate-spin" />Connecting</>
          ) : "Connect"}
        </button>
      ) : (
        <button
          onClick={onInstall}
          className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-opacity hover:opacity-80"
          style={{ border: `1px solid ${C.border}`, color: C.muted, background: "white", flexShrink: 0 }}
        >
          Get <ExternalLink className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}
