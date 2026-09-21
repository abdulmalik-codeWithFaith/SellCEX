"use client";

import { useState } from "react";
import { useAccount, useDisconnect } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { motion, AnimatePresence } from "framer-motion";
import Header from "@/components/Header";
import { CONTRACTS } from "@/lib/contracts";
import { useTokenBalance } from "@/lib/hooks/useTokenBalance";
import { useRecentActivity } from "@/lib/hooks/useRecentActivity";

/* ------------------------------------------------------------------ */
/*  Token list — USDT and SELL are live on-chain reads (real          */
/*  contracts deployed). BNB/ETH/WBTC/CAKE stay illustrative until    */
/*  test-token contracts exist for them too.                          */
/* ------------------------------------------------------------------ */

type Token = { symbol: string; name: string; price: number; change24h: number; color: string; isReal?: boolean };

const MOCK_BALANCES: Record<string, number> = {
  BNB: 2.4,
  ETH: 0.85,
  WBTC: 0.04,
  CAKE: 18.6,
};

const TOKENS: Token[] = [
  { symbol: "USDT", name: "Tether USD", price: 1, change24h: 0.01, color: "from-[#26A17B] to-[#1a7a5a]", isReal: true },
  { symbol: "SELL", name: "SellCex Token", price: 0.0842, change24h: 11.6, color: "from-[var(--gold-300)] to-[var(--gold-700)]", isReal: true },
  { symbol: "BNB", name: "BNB", price: 589.42, change24h: 2.14, color: "from-[#F0B90B] to-[#a87e05]" },
  { symbol: "ETH", name: "Ethereum", price: 3104.1, change24h: -0.86, color: "from-[#627EEA] to-[#3b4d94]" },
  { symbol: "WBTC", name: "Wrapped BTC", price: 61920.55, change24h: 1.02, color: "from-[#F7931A] to-[#a5620d]" },
  { symbol: "CAKE", name: "PancakeSwap", price: 2.31, change24h: -3.44, color: "from-[#D1884F] to-[#8c5a32]" },
];

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
function IconArrowUp() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M12 19V5M12 5l-6 6M12 5l6 6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconArrowDown() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M12 5v14M12 19l-6-6M12 19l6-6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
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

/* ------------------------------------------------------------------ */
/*  Page                                                                */
/* ------------------------------------------------------------------ */

export default function WalletPage() {
  const { address, isConnected, chain } = useAccount();
  const { disconnect } = useDisconnect();
  const { openConnectModal } = useConnectModal();
  const [copied, setCopied] = useState(false);

  const usdtBalance = useTokenBalance(CONTRACTS.anvil.usdt as `0x${string}`, address);
  const sellBalance = useTokenBalance(CONTRACTS.anvil.sell as `0x${string}`, address);

  const activity = useRecentActivity(
    [
      { address: CONTRACTS.anvil.usdt as `0x${string}`, symbol: "USDT" },
      { address: CONTRACTS.anvil.sell as `0x${string}`, symbol: "SELL" },
    ],
    address
  );

  const balances = TOKENS.map((t) => {
    if (t.symbol === "USDT") return { ...t, balance: usdtBalance.balance };
    if (t.symbol === "SELL") return { ...t, balance: sellBalance.balance };
    return { ...t, balance: MOCK_BALANCES[t.symbol] ?? 0 };
  }).sort((a, b) => b.balance * b.price - a.balance * a.price);

  const totalValue = balances.reduce((s, t) => s + t.balance * t.price, 0);

  async function copyAddress() {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
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

      <Header />

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
        {!isConnected && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: easeOut }}
            className="glass-panel mx-auto mt-10 max-w-md rounded-3xl p-7 text-center"
          >
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
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={openConnectModal}
              className="btn-shine mt-6 w-full rounded-xl py-3.5 text-sm font-semibold text-[#050407]"
            >
              Connect Wallet
            </motion.button>
          </motion.div>
        )}

        {/* ------------------------------------------------------ */}
        {/* Connected                                               */}
        {/* ------------------------------------------------------ */}
        <AnimatePresence>
          {isConnected && address && (
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
                          {short(address)}
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
                          Connected
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => disconnect()}
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
                  {totalValue > 0 && (
                    <div className="mt-5">
                      <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-[var(--bg-surface-2)]">
                        {balances
                          .filter((t) => t.balance > 0)
                          .map((t) => (
                            <div
                              key={t.symbol}
                              style={{ width: `${((t.balance * t.price) / totalValue) * 100}%` }}
                              className={`h-full bg-gradient-to-r ${t.color}`}
                              title={t.symbol}
                            />
                          ))}
                      </div>
                      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
                        {balances
                          .filter((t) => t.balance > 0)
                          .slice(0, 4)
                          .map((t) => (
                            <div key={t.symbol} className="flex items-center gap-1.5 text-xs text-[var(--text-600)]">
                              <span className={`h-2 w-2 rounded-full bg-gradient-to-br ${t.color}`} />
                              {t.symbol} · {(((t.balance * t.price) / totalValue) * 100).toFixed(1)}%
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* network info */}
                <div className="rounded-2xl border border-[var(--border-hair)] bg-[var(--bg-surface)]/60 p-6">
                  <div className="text-sm font-medium text-[var(--text-100)]">Network</div>
                  <div className="mt-4 space-y-3 text-sm">
                    {[
                      ["Network", chain?.name ?? "Unknown"],
                      ["Chain ID", chain ? String(chain.id) : "—"],
                      ["Currency", chain?.nativeCurrency?.symbol ?? "—"],
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
                  {chain?.id !== 31337 && chain?.id !== undefined && (
                    <p className="mt-3 text-xs text-[#F1B15A]">
                      SellCex contracts are only deployed on Anvil Local right now — switch networks to see real balances.
                    </p>
                  )}
                </div>
              </div>

              {/* balances */}
              <div className="mt-6 overflow-hidden rounded-2xl border border-[var(--border-hair)] bg-[var(--bg-surface)]/40">
                <div className="border-b border-[var(--border-hair)] px-5 py-3.5 text-sm font-medium text-[var(--text-100)]">
                  Token balances
                </div>
                {balances.map((t) => (
                  <div
                    key={t.symbol}
                    className="flex items-center justify-between border-t border-[var(--border-hair)] px-5 py-3.5"
                  >
                    <div className="flex items-center gap-3">
                      <TokenBadge token={t} />
                      <div>
                        <div className="flex items-center gap-1.5 text-sm font-medium text-[var(--text-100)]">
                          {t.symbol}
                          {t.isReal && (
                            <span className="rounded-full bg-[#5FD98A]/15 px-1.5 py-0.5 text-[9px] font-normal text-[#5FD98A]">
                              LIVE
                            </span>
                          )}
                        </div>
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

              {/* recent activity — live feed */}
              <div className="mt-6 overflow-hidden rounded-2xl border border-[var(--border-hair)] bg-[var(--bg-surface)]/40">
                <div className="flex items-center justify-between border-b border-[var(--border-hair)] px-5 py-3.5">
                  <span className="text-sm font-medium text-[var(--text-100)]">Recent transactions</span>
                  <span className="flex items-center gap-1.5 text-xs text-[var(--text-600)]">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-pulse-ring absolute h-1.5 w-1.5 rounded-full bg-[#5FD98A]" />
                      <span className="h-1.5 w-1.5 rounded-full bg-[#5FD98A]" />
                    </span>
                    Live
                  </span>
                </div>

                {activity.length === 0 ? (
                  <div className="px-5 py-10 text-center text-sm text-[var(--text-600)]">
                    No activity yet this session — this feed shows USDT/SELL transfers as they
                    happen while you have this page open (e.g. approve, swap, add/remove
                    liquidity). It doesn't show history from before you opened this page.
                  </div>
                ) : (
                  activity.map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between border-t border-[var(--border-hair)] px-5 py-3.5"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                            tx.type === "sent" ? "bg-[#F1665A]/10 text-[#F1665A]" : "bg-[#5FD98A]/10 text-[#5FD98A]"
                          }`}
                        >
                          {tx.type === "sent" ? <IconArrowUp /> : <IconArrowDown />}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-[var(--text-100)]">
                            {tx.type === "sent" ? "Sent" : "Received"} {tx.tokenSymbol}
                          </div>
                          <div className="text-xs text-[var(--text-600)]">
                            {tx.type === "sent" ? "To" : "From"} {tx.counterparty}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-[var(--text-100)]">
                          {fmt(parseFloat(tx.amount), 4)} {tx.tokenSymbol}
                        </div>
                        <div className="mt-1 text-xs text-[var(--text-600)]">{tx.time}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </main>
  );
}