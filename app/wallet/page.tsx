"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Header from "@/components/Header";

/* ------------------------------------------------------------------ */
/*  Mock data — swap for wagmi's useAccount / useBalance / useReadContracts  */
/*  once the wallet connector and contracts are wired up. Deliberately */
/*  static (no Math.random / Date.now at render time) so there's no   */
/*  SSR/client hydration mismatch.                                    */
/* ------------------------------------------------------------------ */

type Token = { symbol: string; name: string; balance: number; price: number; change24h: number; color: string };

const BALANCES: Token[] = [
  { symbol: "USDT", name: "Tether USD", balance: 1250.0, price: 1, change24h: 0.01, color: "from-[#26A17B] to-[#1a7a5a]" },
  { symbol: "BNB", name: "BNB", balance: 2.4, price: 589.42, change24h: 2.14, color: "from-[#F0B90B] to-[#a87e05]" },
  { symbol: "ETH", name: "Ethereum", balance: 0.85, price: 3104.1, change24h: -0.86, color: "from-[#627EEA] to-[#3b4d94]" },
  { symbol: "SELL", name: "SellCex Token", balance: 3200, price: 0.0842, change24h: 11.6, color: "from-[var(--gold-300)] to-[var(--gold-700)]" },
  { symbol: "WBTC", name: "Wrapped BTC", balance: 0.04, price: 61920.55, change24h: 1.02, color: "from-[#F7931A] to-[#a5620d]" },
  { symbol: "CAKE", name: "PancakeSwap", balance: 18.6, price: 2.31, change24h: -3.44, color: "from-[#D1884F] to-[#8c5a32]" },
].sort((a, b) => b.balance * b.price - a.balance * a.price);

type Tx = {
  id: number;
  type: "swap" | "add" | "remove" | "approve";
  label: string;
  detail: string;
  hash: string;
  time: string;
  status: "success" | "pending";
};

const TRANSACTIONS: Tx[] = [
  { id: 1, type: "swap", label: "Swap", detail: "500 USDT → 5,935.20 SELL", hash: "0x4f2a…b91c", time: "2 minutes ago", status: "success" },
  { id: 2, type: "add", label: "Add Liquidity", detail: "0.4 BNB + 235.77 USDT", hash: "0x8b1c…2e07", time: "1 hour ago", status: "success" },
  { id: 3, type: "approve", label: "Approve", detail: "SELL for SellCex Router", hash: "0x1ad9…c644", time: "1 hour ago", status: "success" },
  { id: 4, type: "swap", label: "Swap", detail: "0.15 ETH → 465.61 USDT", hash: "0x92e0…7a13", time: "5 hours ago", status: "success" },
  { id: 5, type: "remove", label: "Remove Liquidity", detail: "12.4% of CAKE/BNB position", hash: "0xc731…f402", time: "1 day ago", status: "success" },
  { id: 6, type: "swap", label: "Swap", detail: "1,000 USDT → 0.0162 WBTC", hash: "0x5f6b…9d81", time: "2 days ago", status: "pending" },
];

const MOCK_ADDRESS = "0x7A9F3E2B1C8D4A6F5E0B9C2D1A8F7E6B5C4D3A29";

function short(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}
function fmt(n: number, d = 2) {
  return n.toLocaleString(undefined, { maximumFractionDigits: d });
}
function fmtUsd(n: number) {
  return `$${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

const easeOut = [0.16, 1, 0.3, 1] as const;

const WALLET_OPTIONS = [
  { name: "MetaMask", color: "from-[#F6851B] to-[#c96812]" },
  { name: "WalletConnect", color: "from-[#3B99FC] to-[#1c6cc4]" },
  { name: "Coinbase Wallet", color: "from-[#0052FF] to-[#0033a0]" },
  { name: "Trust Wallet", color: "from-[#3375BB] to-[#204d80]" },
];

/* ------------------------------------------------------------------ */
/*  Icons                                                               */
/* ------------------------------------------------------------------ */

function IconArrowLeft() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M19 12H5M11 6l-6 6 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconCopy() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
      <rect x="9" y="9" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M5 15V5a2 2 0 0 1 2-2h10" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}
function IconCheck() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
      <path d="M5 12.5l4.5 4.5L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconExternal() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
      <path d="M7 17L17 7M17 7H9M17 7v8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconSwapType() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M4 8h13M17 8l-3.5-3.5M17 8l-3.5 3.5M20 16H7M7 16l3.5-3.5M7 16l3.5 3.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconDropletPlus() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M12 3c3.5 4 6 7.2 6 10.2A6 6 0 1 1 6 13.2C6 10.2 8.5 7 12 3Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}
function IconDropletMinus() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M12 3c3.5 4 6 7.2 6 10.2A6 6 0 1 1 6 13.2C6 10.2 8.5 7 12 3Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M9.5 13.5h5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
function IconShieldCheck() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M12 3l7 3v6c0 4.5-3 7.7-7 9-4-1.3-7-4.5-7-9V6l7-3Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}
function Spinner({ size = 22 }: { size?: number }) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      animate={{ rotate: 360 }}
      transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
    >
      <circle cx="12" cy="12" r="9" stroke="var(--border-hair)" strokeWidth="2.5" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="var(--gold-500)" strokeWidth="2.5" strokeLinecap="round" />
    </motion.svg>
  );
}
function TokenBadge({ token, size = 32 }: { token: Token; size?: number }) {
  return (
    <div
      style={{ width: size, height: size }}
      className={`flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${token.color} text-xs font-bold text-[#050407]`}
    >
      {token.symbol.slice(0, 1)}
    </div>
  );
}

function txMeta(type: Tx["type"]) {
  switch (type) {
    case "swap":
      return { icon: <IconSwapType />, tone: "text-[var(--gold-500)] bg-[var(--gold-500)]/10" };
    case "add":
      return { icon: <IconDropletPlus />, tone: "text-[#5FD98A] bg-[#5FD98A]/10" };
    case "remove":
      return { icon: <IconDropletMinus />, tone: "text-[#F1665A] bg-[#F1665A]/10" };
    case "approve":
      return { icon: <IconShieldCheck />, tone: "text-[#7C9CFC] bg-[#7C9CFC]/10" };
  }
}

/* ------------------------------------------------------------------ */
/*  Page                                                                */
/* ------------------------------------------------------------------ */

type ConnState = "disconnected" | "connecting" | "connected";

export default function WalletPage() {
  const [state, setState] = useState<ConnState>("disconnected");
  const [pickedWallet, setPickedWallet] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const totalValue = BALANCES.reduce((s, t) => s + t.balance * t.price, 0);

  function connect(walletName: string) {
    setPickedWallet(walletName);
    setState("connecting");
    setTimeout(() => setState("connected"), 1500);
  }

  function disconnect() {
    setState("disconnected");
    setPickedWallet(null);
  }

  async function copyAddress() {
    try {
      await navigator.clipboard.writeText(MOCK_ADDRESS);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // clipboard unavailable — silently ignore
    }
  }

  return (
    <main className="relative min-h-screen bg-[var(--bg)] pb-24">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-noise">
        <div
          className="animate-mesh absolute inset-0 opacity-50"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, rgba(240,180,41,0.16), transparent 35%), radial-gradient(circle at 85% 70%, rgba(124,92,252,0.12), transparent 40%)",
            backgroundSize: "150% 150%",
          }}
        />
        <div className="grid-overlay absolute inset-0" />
      </div>

      {/* header */}
      <Header/>

      <section className="mx-auto max-w-5xl px-5 pt-36">
        <a href="/" className="mb-3 flex items-center gap-1.5 text-sm text-[var(--text-400)] hover:text-[var(--text-100)]">
          <IconArrowLeft />
          Back
        </a>
        <h1 className="font-display text-3xl font-semibold text-[var(--text-100)]">Wallet</h1>
        <p className="mt-1 text-sm text-[var(--text-400)]">
          Everything here reads directly from your wallet — SellCex never takes custody.
        </p>

        {/* ------------------------------------------------------ */}
        {/* Not connected                                           */}
        {/* ------------------------------------------------------ */}
        {state !== "connected" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: easeOut }}
            className="glass-panel mx-auto mt-10 max-w-md rounded-3xl p-7 text-center"
          >
            {state === "disconnected" ? (
              <>
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--border-hair)] text-[var(--gold-500)]">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="6" width="18" height="13" rx="2.5" stroke="currentColor" strokeWidth="1.6" />
                    <path d="M3 10h18" stroke="currentColor" strokeWidth="1.6" />
                    <circle cx="16.5" cy="14" r="1.2" fill="currentColor" />
                  </svg>
                </div>
                <h2 className="font-display text-xl font-semibold text-[var(--text-100)]">
                  Connect your wallet
                </h2>
                <p className="mt-2 text-sm text-[var(--text-400)]">
                  Connect to view balances, track positions, and start trading on SellCex.
                </p>
                <div className="mt-6 space-y-2.5">
                  {WALLET_OPTIONS.map((w) => (
                    <motion.button
                      key={w.name}
                      whileHover={{ scale: 1.015 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => connect(w.name)}
                      className="flex w-full items-center gap-3 rounded-xl border border-[var(--border-hair)] bg-[var(--bg-surface-2)] px-4 py-3 text-left transition-colors hover:border-[rgba(245,201,92,0.35)]"
                    >
                      <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${w.color} text-xs font-bold text-white`}>
                        {w.name.slice(0, 1)}
                      </div>
                      <span className="text-sm font-medium text-[var(--text-100)]">{w.name}</span>
                    </motion.button>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center py-4">
                <Spinner size={44} />
                <h2 className="mt-5 font-display text-lg font-semibold text-[var(--text-100)]">
                  Connecting to {pickedWallet}
                </h2>
                <p className="mt-2 text-sm text-[var(--text-400)]">Confirm the connection in your wallet.</p>
              </div>
            )}
          </motion.div>
        )}

        {/* ------------------------------------------------------ */}
        {/* Connected                                               */}
        {/* ------------------------------------------------------ */}
        <AnimatePresence>
          {state === "connected" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: easeOut }}
            >
              {/* summary card */}
              <div className="mt-8 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="rounded-2xl border border-[var(--border-hair)] bg-[var(--bg-surface)]/60 p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 rounded-full bg-gradient-to-br from-[var(--gold-300)] via-[#7C5CFC] to-[var(--gold-700)]" />
                      <div>
                        <div className="flex items-center gap-2 text-sm font-medium text-[var(--text-100)]">
                          {short(MOCK_ADDRESS)}
                          <button
                            onClick={copyAddress}
                            className="text-[var(--text-600)] transition-colors hover:text-[var(--gold-500)]"
                            aria-label="Copy address"
                          >
                            {copied ? <IconCheck /> : <IconCopy />}
                          </button>
                        </div>
                        <div className="mt-0.5 flex items-center gap-1.5 text-xs text-[var(--text-600)]">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#5FD98A]" />
                          Connected via {pickedWallet}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={disconnect}
                      className="rounded-lg border border-[var(--border-hair)] px-3 py-1.5 text-xs font-medium text-[var(--text-400)] transition-colors hover:bg-[var(--bg-surface-2)] hover:text-[var(--text-100)]"
                    >
                      Disconnect
                    </button>
                  </div>

                  <div className="mt-6">
                    <div className="text-xs text-[var(--text-600)]">Portfolio value</div>
                    <div className="mt-1 font-display text-3xl font-semibold text-[var(--text-100)]">
                      {fmtUsd(totalValue)}
                    </div>
                  </div>

                  {/* allocation bar */}
                  <div className="mt-5">
                    <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-[var(--bg-surface-2)]">
                      {BALANCES.map((t) => (
                        <div
                          key={t.symbol}
                          style={{ width: `${((t.balance * t.price) / totalValue) * 100}%` }}
                          className={`h-full bg-gradient-to-r ${t.color}`}
                          title={t.symbol}
                        />
                      ))}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
                      {BALANCES.slice(0, 4).map((t) => (
                        <div key={t.symbol} className="flex items-center gap-1.5 text-xs text-[var(--text-600)]">
                          <span className={`h-2 w-2 rounded-full bg-gradient-to-br ${t.color}`} />
                          {t.symbol} · {(((t.balance * t.price) / totalValue) * 100).toFixed(1)}%
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* network info */}
                <div className="rounded-2xl border border-[var(--border-hair)] bg-[var(--bg-surface)]/60 p-6">
                  <div className="text-sm font-medium text-[var(--text-100)]">Network</div>
                  <div className="mt-4 space-y-3 text-sm">
                    {[
                      ["Network", "BSC Testnet"],
                      ["Chain ID", "97"],
                      ["Currency", "tBNB"],
                      ["RPC status", "Connected"],
                    ].map(([label, value]) => (
                      <div key={label} className="flex items-center justify-between border-b border-[var(--border-hair)] pb-3 last:border-0 last:pb-0">
                        <span className="text-[var(--text-600)]">{label}</span>
                        <span className="flex items-center gap-1.5 text-[var(--text-100)]">
                          {label === "RPC status" && <span className="h-1.5 w-1.5 rounded-full bg-[#5FD98A]" />}
                          {value}
                        </span>
                      </div>
                    ))}
                  </div>
                  <a
                    href="#"
                    className="mt-5 flex items-center gap-1.5 text-xs font-medium text-[var(--gold-500)] hover:text-[var(--gold-300)]"
                  >
                    View on BscScan
                    <IconExternal />
                  </a>
                </div>
              </div>

              {/* balances */}
              <div className="mt-6 overflow-hidden rounded-2xl border border-[var(--border-hair)] bg-[var(--bg-surface)]/40">
                <div className="border-b border-[var(--border-hair)] px-5 py-3.5 text-sm font-medium text-[var(--text-100)]">
                  Token balances
                </div>
                {BALANCES.map((t) => (
                  <div
                    key={t.symbol}
                    className="flex items-center justify-between border-t border-[var(--border-hair)] px-5 py-3.5"
                  >
                    <div className="flex items-center gap-3">
                      <TokenBadge token={t} />
                      <div>
                        <div className="text-sm font-medium text-[var(--text-100)]">{t.symbol}</div>
                        <div className="text-xs text-[var(--text-600)]">{t.name}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-[var(--text-100)]">
                        {fmt(t.balance, t.balance < 1 ? 4 : 2)} {t.symbol}
                      </div>
                      <div className="flex items-center justify-end gap-1.5 text-xs">
                        <span className="text-[var(--text-600)]">{fmtUsd(t.balance * t.price)}</span>
                        <span className={t.change24h >= 0 ? "text-[#5FD98A]" : "text-[#F1665A]"}>
                          {t.change24h >= 0 ? "+" : ""}
                          {t.change24h.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* recent transactions */}
              <div className="mt-6 overflow-hidden rounded-2xl border border-[var(--border-hair)] bg-[var(--bg-surface)]/40">
                <div className="border-b border-[var(--border-hair)] px-5 py-3.5 text-sm font-medium text-[var(--text-100)]">
                  Recent transactions
                </div>
                {TRANSACTIONS.map((tx) => {
                  const meta = txMeta(tx.type);
                  return (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between border-t border-[var(--border-hair)] px-5 py-3.5"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${meta.tone}`}>
                          {meta.icon}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-[var(--text-100)]">{tx.label}</div>
                          <div className="text-xs text-[var(--text-600)]">{tx.detail}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center justify-end gap-1.5 text-xs">
                          <span
                            className={`rounded-full px-2 py-0.5 ${
                              tx.status === "success"
                                ? "bg-[#5FD98A]/15 text-[#5FD98A]"
                                : "bg-[var(--gold-500)]/15 text-[var(--gold-300)]"
                            }`}
                          >
                            {tx.status === "success" ? "Success" : "Pending"}
                          </span>
                          <span className="text-[var(--text-600)]">{tx.hash}</span>
                        </div>
                        <div className="mt-1 text-xs text-[var(--text-600)]">{tx.time}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </main>
  );
}