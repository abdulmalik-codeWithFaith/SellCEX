"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Header from "@/components/Header";

/* ------------------------------------------------------------------ */
/*  Mock data — swap for real pool reads (Factory.allPairs +          */
/*  Pair.getReserves) once contracts are deployed.                    */
/* ------------------------------------------------------------------ */

type Token = { symbol: string; name: string; price: number; color: string };

const T: Record<string, Token> = {
  USDT: { symbol: "USDT", name: "Tether USD", price: 1, color: "from-[#26A17B] to-[#1a7a5a]" },
  SELL: { symbol: "SELL", name: "SellCex Token", price: 0.0842, color: "from-[var(--gold-300)] to-[var(--gold-700)]" },
  BNB: { symbol: "BNB", name: "BNB", price: 589.42, color: "from-[#F0B90B] to-[#a87e05]" },
  ETH: { symbol: "ETH", name: "Ethereum", price: 3104.1, color: "from-[#627EEA] to-[#3b4d94]" },
  WBTC: { symbol: "WBTC", name: "Wrapped BTC", price: 61920.55, color: "from-[#F7931A] to-[#a5620d]" },
  USDC: { symbol: "USDC", name: "USD Coin", price: 1.0001, color: "from-[#2775CA] to-[#164a83]" },
  CAKE: { symbol: "CAKE", name: "PancakeSwap", price: 2.31, color: "from-[#D1884F] to-[#8c5a32]" },
};

type Pool = {
  id: string;
  a: Token;
  b: Token;
  reserveA: number;
  reserveB: number;
  volume24h: number;
  apr: number;
  userLpTokens: number;
  totalLpTokens: number;
};

const rawPools: Omit<Pool, "totalLpTokens">[] = [
  { id: "bnb-usdt", a: T.BNB, b: T.USDT, reserveA: 4200, reserveB: 2475564, volume24h: 812400, apr: 18.4, userLpTokens: 410 },
  { id: "sell-usdt", a: T.SELL, b: T.USDT, reserveA: 9000000, reserveB: 757800, volume24h: 94200, apr: 41.2, userLpTokens: 31300 },
  { id: "eth-usdt", a: T.ETH, b: T.USDT, reserveA: 310, reserveB: 962271, volume24h: 540300, apr: 12.1, userLpTokens: 0 },
  { id: "wbtc-usdt", a: T.WBTC, b: T.USDT, reserveA: 14, reserveB: 866888, volume24h: 301800, apr: 9.6, userLpTokens: 0 },
  { id: "usdc-usdt", a: T.USDC, b: T.USDT, reserveA: 500000, reserveB: 500050, volume24h: 615000, apr: 4.3, userLpTokens: 0 },
  { id: "cake-bnb", a: T.CAKE, b: T.BNB, reserveA: 180000, reserveB: 706, volume24h: 76100, apr: 27.8, userLpTokens: 0 },
];

const POOLS: Pool[] = rawPools.map((p) => ({
  ...p,
  totalLpTokens: Math.sqrt(p.reserveA * p.reserveB),
}));

const easeOut = [0.16, 1, 0.3, 1] as const;

function fmt(n: number, decimals = 2) {
  if (!isFinite(n)) return "0";
  return n.toLocaleString(undefined, { maximumFractionDigits: decimals });
}
function fmtUsd(n: number) {
  if (n >= 1_000_000) return `$${fmt(n / 1_000_000, 2)}M`;
  if (n >= 1_000) return `$${fmt(n / 1_000, 1)}K`;
  return `$${fmt(n, 2)}`;
}
function tvl(p: Pool) {
  return p.reserveA * p.a.price + p.reserveB * p.b.price;
}
function shortHash() {
  const chars = "abcdef0123456789";
  let h = "0x";
  for (let i = 0; i < 8; i++) h += chars[Math.floor(Math.random() * chars.length)];
  h += "…";
  for (let i = 0; i < 4; i++) h += chars[Math.floor(Math.random() * chars.length)];
  return h;
}

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
function IconPlus() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
function IconClose() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
function IconCheck() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
      <motion.path
        d="M5 12.5l4.5 4.5L19 7"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.5, ease: easeOut, delay: 0.15 }}
      />
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
function TokenBadge({ token, size = 30 }: { token: Token; size?: number }) {
  return (
    <div
      style={{ width: size, height: size }}
      className={`flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${token.color} text-xs font-bold text-[#050407]`}
    >
      {token.symbol.slice(0, 1)}
    </div>
  );
}
function PairIcons({ a, b }: { a: Token; b: Token }) {
  return (
    <div className="flex shrink-0 items-center">
      <TokenBadge token={a} />
      <div className="-ml-2.5">
        <TokenBadge token={b} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Add liquidity modal                                                */
/* ------------------------------------------------------------------ */

type FlowStage = "form" | "approving-a" | "approving-b" | "pending" | "success";

function AddLiquidityModal({
  pool,
  onClose,
  onDone,
}: {
  pool: Pool;
  onClose: () => void;
  onDone: (amtA: number, amtB: number) => void;
}) {
  const [amountA, setAmountA] = useState("");
  const [stage, setStage] = useState<FlowStage>("form");
  const [approvedA, setApprovedA] = useState(false);
  const [approvedB, setApprovedB] = useState(false);
  const [txHash, setTxHash] = useState("");

  const ratio = pool.reserveB / pool.reserveA;
  const amtA = parseFloat(amountA) || 0;
  const amtB = amtA * ratio;
  const shareOfPool = pool.totalLpTokens > 0 ? (amtA / (pool.reserveA + amtA)) * 100 : 100;

  function runApprovals() {
    if (!approvedA) {
      setStage("approving-a");
      setTimeout(() => {
        setApprovedA(true);
        if (!approvedB) {
          setStage("approving-b");
          setTimeout(() => {
            setApprovedB(true);
            supply();
          }, 1300);
        } else {
          supply();
        }
      }, 1300);
    } else if (!approvedB) {
      setStage("approving-b");
      setTimeout(() => {
        setApprovedB(true);
        supply();
      }, 1300);
    } else {
      supply();
    }
  }

  function supply() {
    setStage("pending");
    setTimeout(() => {
      setTxHash(shortHash());
      setStage("success");
      onDone(amtA, amtB);
    }, 1600);
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={stage === "form" ? onClose : undefined}
      className="fixed inset-0 z-[70] flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center"
    >
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.97 }}
        transition={{ duration: 0.25, ease: easeOut }}
        onClick={(e) => e.stopPropagation()}
        className="glass-panel w-full max-w-sm rounded-t-3xl border border-[var(--border-hair)] p-6 sm:rounded-3xl"
      >
        {stage === "form" && (
          <>
            <div className="mb-5 flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold text-[var(--text-100)]">
                Add liquidity
              </h3>
              <button onClick={onClose} className="text-[var(--text-400)] hover:text-[var(--text-100)]">
                <IconClose />
              </button>
            </div>

            <div className="mb-2 flex items-center gap-2">
              <PairIcons a={pool.a} b={pool.b} />
              <span className="text-sm font-medium text-[var(--text-100)]">
                {pool.a.symbol} / {pool.b.symbol}
              </span>
            </div>

            <div className="mt-3 rounded-2xl border border-[var(--border-hair)] bg-[var(--bg-surface-2)] p-4">
              <div className="mb-2 flex justify-between text-xs text-[var(--text-600)]">
                <span>{pool.a.symbol} amount</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <input
                  value={amountA}
                  onChange={(e) => setAmountA(e.target.value.replace(/[^0-9.]/g, ""))}
                  placeholder="0.0"
                  inputMode="decimal"
                  className="w-full bg-transparent font-display text-2xl text-[var(--text-100)] placeholder:text-[var(--text-600)] focus:outline-none"
                />
                <div className="flex items-center gap-1.5 rounded-full bg-[var(--bg-surface)] py-1.5 pl-1.5 pr-3">
                  <TokenBadge token={pool.a} size={24} />
                  <span className="text-sm font-medium text-[var(--text-100)]">{pool.a.symbol}</span>
                </div>
              </div>
            </div>

            <div className="mx-auto -my-2.5 flex h-7 w-7 items-center justify-center text-[var(--text-600)]">
              <IconPlus />
            </div>

            <div className="rounded-2xl border border-[var(--border-hair)] bg-[var(--bg-surface-2)] p-4">
              <div className="mb-2 flex justify-between text-xs text-[var(--text-600)]">
                <span>{pool.b.symbol} amount</span>
                <span>Based on pool ratio</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="font-display text-2xl text-[var(--text-100)]">
                  {amtA > 0 ? fmt(amtB, 6) : "0.0"}
                </span>
                <div className="flex items-center gap-1.5 rounded-full bg-[var(--bg-surface)] py-1.5 pl-1.5 pr-3">
                  <TokenBadge token={pool.b} size={24} />
                  <span className="text-sm font-medium text-[var(--text-100)]">{pool.b.symbol}</span>
                </div>
              </div>
            </div>

            {amtA > 0 && (
              <div className="mt-3 space-y-1.5 rounded-xl bg-[var(--bg-surface-2)]/60 p-3.5 text-xs text-[var(--text-600)]">
                <div className="flex justify-between">
                  <span>Rate</span>
                  <span className="text-[var(--text-400)]">
                    1 {pool.a.symbol} = {fmt(ratio, 6)} {pool.b.symbol}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Share of pool</span>
                  <span className="text-[var(--text-400)]">{fmt(shareOfPool, 3)}%</span>
                </div>
              </div>
            )}

            <motion.button
              whileHover={amtA > 0 ? { scale: 1.01 } : {}}
              whileTap={amtA > 0 ? { scale: 0.98 } : {}}
              disabled={amtA <= 0}
              onClick={runApprovals}
              className={`btn-shine mt-5 w-full rounded-xl py-3.5 text-sm font-semibold text-[#050407] ${
                amtA <= 0 ? "cursor-not-allowed opacity-40" : ""
              }`}
            >
              {amtA <= 0 ? "Enter an amount" : "Supply"}
            </motion.button>
          </>
        )}

        {(stage === "approving-a" || stage === "approving-b" || stage === "pending") && (
          <div className="flex flex-col items-center py-6 text-center">
            <Spinner size={44} />
            <h3 className="mt-5 font-display text-lg font-semibold text-[var(--text-100)]">
              {stage === "approving-a"
                ? `Approving ${pool.a.symbol}`
                : stage === "approving-b"
                ? `Approving ${pool.b.symbol}`
                : "Supplying liquidity"}
            </h3>
            <p className="mt-2 max-w-[240px] text-sm text-[var(--text-400)]">
              Waiting for the transaction to be mined.
            </p>
          </div>
        )}

        {stage === "success" && (
          <div className="flex flex-col items-center py-4 text-center">
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, ease: easeOut }}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-[#5FD98A]/15 text-[#5FD98A]"
            >
              <IconCheck />
            </motion.div>
            <h3 className="mt-5 font-display text-lg font-semibold text-[var(--text-100)]">
              Liquidity added
            </h3>
            <p className="mt-2 text-sm text-[var(--text-400)]">
              Supplied {fmt(amtA, 4)} {pool.a.symbol} and {fmt(amtB, 4)} {pool.b.symbol}
            </p>
            <div className="mt-4 flex items-center gap-2 rounded-lg border border-[var(--border-hair)] bg-[var(--bg-surface-2)] px-3 py-2 text-xs text-[var(--text-400)]">
              <span>{txHash}</span>
              <span className="text-[var(--gold-500)]">View on BscScan ↗</span>
            </div>
            <button
              onClick={onClose}
              className="btn-shine mt-6 w-full rounded-xl py-3 text-sm font-semibold text-[#050407]"
            >
              Done
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Remove liquidity modal                                             */
/* ------------------------------------------------------------------ */

function RemoveLiquidityModal({
  pool,
  onClose,
  onDone,
}: {
  pool: Pool;
  onClose: () => void;
  onDone: (pct: number) => void;
}) {
  const [pct, setPct] = useState(50);
  const [stage, setStage] = useState<"form" | "pending" | "success">("form");
  const [txHash, setTxHash] = useState("");

  const userShare = pool.userLpTokens / pool.totalLpTokens;
  const outA = pool.reserveA * userShare * (pct / 100);
  const outB = pool.reserveB * userShare * (pct / 100);

  function remove() {
    setStage("pending");
    setTimeout(() => {
      setTxHash(shortHash());
      setStage("success");
      onDone(pct);
    }, 1600);
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={stage === "form" ? onClose : undefined}
      className="fixed inset-0 z-[70] flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center"
    >
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.97 }}
        transition={{ duration: 0.25, ease: easeOut }}
        onClick={(e) => e.stopPropagation()}
        className="glass-panel w-full max-w-sm rounded-t-3xl border border-[var(--border-hair)] p-6 sm:rounded-3xl"
      >
        {stage === "form" && (
          <>
            <div className="mb-5 flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold text-[var(--text-100)]">
                Remove liquidity
              </h3>
              <button onClick={onClose} className="text-[var(--text-400)] hover:text-[var(--text-100)]">
                <IconClose />
              </button>
            </div>

            <div className="mb-4 flex items-center gap-2">
              <PairIcons a={pool.a} b={pool.b} />
              <span className="text-sm font-medium text-[var(--text-100)]">
                {pool.a.symbol} / {pool.b.symbol}
              </span>
            </div>

            <div className="rounded-2xl border border-[var(--border-hair)] bg-[var(--bg-surface-2)] p-5 text-center">
              <div className="font-display text-4xl font-semibold text-[var(--text-100)]">{pct}%</div>
              <input
                type="range"
                min={1}
                max={100}
                value={pct}
                onChange={(e) => setPct(parseInt(e.target.value))}
                className="mt-4 w-full accent-[var(--gold-500)]"
              />
              <div className="mt-3 flex justify-center gap-2">
                {[25, 50, 75, 100].map((p) => (
                  <button
                    key={p}
                    onClick={() => setPct(p)}
                    className={`rounded-lg border px-3 py-1 text-xs font-medium transition-colors ${
                      pct === p
                        ? "border-[var(--gold-500)] bg-[var(--gold-500)]/10 text-[var(--gold-300)]"
                        : "border-[var(--border-hair)] text-[var(--text-400)] hover:text-[var(--text-100)]"
                    }`}
                  >
                    {p === 100 ? "Max" : `${p}%`}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 space-y-2 rounded-xl bg-[var(--bg-surface-2)]/60 p-3.5 text-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[var(--text-400)]">
                  <TokenBadge token={pool.a} size={20} />
                  {pool.a.symbol}
                </div>
                <span className="text-[var(--text-100)]">{fmt(outA, 6)}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[var(--text-400)]">
                  <TokenBadge token={pool.b} size={20} />
                  {pool.b.symbol}
                </div>
                <span className="text-[var(--text-100)]">{fmt(outB, 6)}</span>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={remove}
              className="mt-5 w-full rounded-xl border border-[#F1665A]/40 bg-[#F1665A]/10 py-3.5 text-sm font-semibold text-[#F1958A]"
            >
              Remove liquidity
            </motion.button>
          </>
        )}

        {stage === "pending" && (
          <div className="flex flex-col items-center py-6 text-center">
            <Spinner size={44} />
            <h3 className="mt-5 font-display text-lg font-semibold text-[var(--text-100)]">
              Removing liquidity
            </h3>
            <p className="mt-2 max-w-[240px] text-sm text-[var(--text-400)]">
              Waiting for the transaction to be mined.
            </p>
          </div>
        )}

        {stage === "success" && (
          <div className="flex flex-col items-center py-4 text-center">
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, ease: easeOut }}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-[#5FD98A]/15 text-[#5FD98A]"
            >
              <IconCheck />
            </motion.div>
            <h3 className="mt-5 font-display text-lg font-semibold text-[var(--text-100)]">
              Liquidity removed
            </h3>
            <p className="mt-2 text-sm text-[var(--text-400)]">
              Received {fmt(outA, 4)} {pool.a.symbol} and {fmt(outB, 4)} {pool.b.symbol}
            </p>
            <div className="mt-4 flex items-center gap-2 rounded-lg border border-[var(--border-hair)] bg-[var(--bg-surface-2)] px-3 py-2 text-xs text-[var(--text-400)]">
              <span>{txHash}</span>
              <span className="text-[var(--gold-500)]">View on BscScan ↗</span>
            </div>
            <button
              onClick={onClose}
              className="btn-shine mt-6 w-full rounded-xl py-3 text-sm font-semibold text-[#050407]"
            >
              Done
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                                */
/* ------------------------------------------------------------------ */

export default function LiquidityPage() {
  const [tab, setTab] = useState<"all" | "yours">("all");
  const [pools, setPools] = useState(POOLS);
  const [addTarget, setAddTarget] = useState<Pool | null>(null);
  const [removeTarget, setRemoveTarget] = useState<Pool | null>(null);

  const yourPools = pools.filter((p) => p.userLpTokens > 0);
  const totalUserValue = yourPools.reduce((sum, p) => {
    const share = p.userLpTokens / p.totalLpTokens;
    return sum + share * tvl(p);
  }, 0);

  function handleAddDone(poolId: string, amtA: number, amtB: number) {
    setPools((prev) =>
      prev.map((p) => {
        if (p.id !== poolId) return p;
        const newReserveA = p.reserveA + amtA;
        const newReserveB = p.reserveB + amtB;
        const mintedLp = p.totalLpTokens * (amtA / p.reserveA);
        return {
          ...p,
          reserveA: newReserveA,
          reserveB: newReserveB,
          totalLpTokens: p.totalLpTokens + mintedLp,
          userLpTokens: p.userLpTokens + mintedLp,
        };
      })
    );
  }

  function handleRemoveDone(poolId: string, pct: number) {
    setPools((prev) =>
      prev.map((p) => {
        if (p.id !== poolId) return p;
        const share = p.userLpTokens / p.totalLpTokens;
        const removedLp = p.userLpTokens * (pct / 100);
        const removedA = p.reserveA * share * (pct / 100);
        const removedB = p.reserveB * share * (pct / 100);
        return {
          ...p,
          reserveA: p.reserveA - removedA,
          reserveB: p.reserveB - removedB,
          totalLpTokens: p.totalLpTokens - removedLp,
          userLpTokens: p.userLpTokens - removedLp,
        };
      })
    );
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
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <a href="/" className="mb-3 flex items-center gap-1.5 text-sm text-[var(--text-400)] hover:text-[var(--text-100)]">
              <IconArrowLeft />
              Back
            </a>
            <h1 className="font-display text-3xl font-semibold text-[var(--text-100)]">Liquidity</h1>
            <p className="mt-1 text-sm text-[var(--text-400)]">
              Deposit a token pair to earn a share of every trade routed through it.
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setAddTarget(pools[0])}
            className="btn-shine flex items-center gap-1.5 self-start rounded-xl px-5 py-3 text-sm font-semibold text-[#050407]"
          >
            <IconPlus />
            Add Liquidity
          </motion.button>
        </div>

        {/* summary strip */}
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: "Total value locked", value: fmtUsd(pools.reduce((s, p) => s + tvl(p), 0)) },
            { label: "24h volume", value: fmtUsd(pools.reduce((s, p) => s + p.volume24h, 0)) },
            { label: "Active pools", value: String(pools.length) },
            { label: "Your liquidity", value: fmtUsd(totalUserValue) },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-[var(--border-hair)] bg-[var(--bg-surface)]/60 p-4">
              <div className="text-xs text-[var(--text-600)]">{s.label}</div>
              <div className="mt-1.5 font-display text-lg font-semibold text-[var(--text-100)]">{s.value}</div>
            </div>
          ))}
        </div>

        {/* tabs */}
        <div className="mb-5 inline-flex rounded-xl border border-[var(--border-hair)] bg-[var(--bg-surface)]/60 p-1">
          {(["all", "yours"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                tab === t
                  ? "bg-gradient-to-r from-[var(--gold-300)] to-[var(--gold-700)] text-[#050407]"
                  : "text-[var(--text-400)] hover:text-[var(--text-100)]"
              }`}
            >
              {t === "all" ? "All pools" : `Your positions (${yourPools.length})`}
            </button>
          ))}
        </div>

        {/* pool list */}
        <div className="overflow-hidden rounded-2xl border border-[var(--border-hair)] bg-[var(--bg-surface)]/40">
          <div className="hidden grid-cols-[1.6fr_1fr_1fr_0.8fr_0.8fr_auto] gap-3 border-b border-[var(--border-hair)] px-5 py-3 text-xs text-[var(--text-600)] md:grid">
            <span>Pool</span>
            <span>TVL</span>
            <span>24h volume</span>
            <span>APR</span>
            <span>Your share</span>
            <span></span>
          </div>

          <AnimatePresence initial={false}>
            {(tab === "all" ? pools : yourPools).map((p) => {
              const share = p.totalLpTokens > 0 ? (p.userLpTokens / p.totalLpTokens) * 100 : 0;
              return (
                <motion.div
                  key={p.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, height: 0 }}
                  className="grid grid-cols-2 items-center gap-3 border-b border-[var(--border-hair)] px-5 py-4 last:border-0 md:grid-cols-[1.6fr_1fr_1fr_0.8fr_0.8fr_auto]"
                >
                  <div className="col-span-2 flex items-center gap-3 md:col-span-1">
                    <PairIcons a={p.a} b={p.b} />
                    <span className="text-sm font-medium text-[var(--text-100)]">
                      {p.a.symbol} / {p.b.symbol}
                    </span>
                  </div>
                  <div className="text-sm text-[var(--text-400)] md:text-[var(--text-100)]">
                    <span className="text-xs text-[var(--text-600)] md:hidden">TVL </span>
                    {fmtUsd(tvl(p))}
                  </div>
                  <div className="text-sm text-[var(--text-400)] md:text-[var(--text-100)]">
                    <span className="text-xs text-[var(--text-600)] md:hidden">Vol </span>
                    {fmtUsd(p.volume24h)}
                  </div>
                  <div className="text-sm text-[#5FD98A]">{p.apr.toFixed(1)}%</div>
                  <div className="text-sm text-[var(--text-400)]">
                    {share > 0 ? `${share.toFixed(3)}%` : "—"}
                  </div>
                  <div className="col-span-2 flex gap-2 md:col-span-1 md:justify-end">
                    <button
                      onClick={() => setAddTarget(p)}
                      className="rounded-lg border border-[var(--border-hair)] px-3 py-1.5 text-xs font-medium text-[var(--text-100)] transition-colors hover:bg-[var(--bg-surface-2)]"
                    >
                      Add
                    </button>
                    {p.userLpTokens > 0 && (
                      <button
                        onClick={() => setRemoveTarget(p)}
                        className="rounded-lg border border-[var(--border-hair)] px-3 py-1.5 text-xs font-medium text-[var(--text-400)] transition-colors hover:bg-[var(--bg-surface-2)] hover:text-[var(--text-100)]"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {tab === "yours" && yourPools.length === 0 && (
            <div className="px-5 py-14 text-center text-sm text-[var(--text-600)]">
              You don't have any liquidity positions yet.
            </div>
          )}
        </div>
      </section>

      <AnimatePresence>
        {addTarget && (
          <AddLiquidityModal
            pool={addTarget}
            onClose={() => setAddTarget(null)}
            onDone={(a, b) => handleAddDone(addTarget.id, a, b)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {removeTarget && (
          <RemoveLiquidityModal
            pool={removeTarget}
            onClose={() => setRemoveTarget(null)}
            onDone={(pct) => handleRemoveDone(removeTarget.id, pct)}
          />
        )}
      </AnimatePresence>
    </main>
  );
}