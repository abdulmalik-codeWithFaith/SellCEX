"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence, useInView, animate } from "framer-motion";
import { useAccount } from "wagmi";
import { CONTRACTS } from "@/lib/contracts";
import { usePoolInfo } from "@/lib/hooks/usePoolInfo";
import { useLiveSwaps } from "@/lib/hooks/useLiveSwaps";
import Header from "@/components/Header";

/* ------------------------------------------------------------------ */
/*  Mock data — swap for indexed Supabase reads (Sync/Swap/Mint/Burn  */
/*  events) once the indexer is wired up.                             */
/* ------------------------------------------------------------------ */

type Token = { symbol: string; name: string; price: number; change24h: number; color: string; series: number[] };

function walk(seed: number, n: number, vol: number) {
  let v = seed;
  const out = [v];
  let s = seed * 97 + 13;
  for (let i = 1; i < n; i++) {
    s = (s * 9301 + 49297) % 233280;
    const r = s / 233280 - 0.5;
    v = Math.max(v * (1 + r * vol), 0.0001);
    out.push(v);
  }
  return out;
}

const TOKENS: Token[] = [
  { symbol: "BNB", name: "BNB", price: 589.42, change24h: 2.14, color: "from-[#F0B90B] to-[#a87e05]", series: walk(560, 12, 0.03) },
  { symbol: "SELL", name: "SellCex Token", price: 0.0842, change24h: 11.6, color: "from-[var(--gold-300)] to-[var(--gold-700)]", series: walk(0.07, 12, 0.06) },
  { symbol: "ETH", name: "Ethereum", price: 3104.1, change24h: -0.86, color: "from-[#627EEA] to-[#3b4d94]", series: walk(3140, 12, 0.02) },
  { symbol: "WBTC", name: "Wrapped BTC", price: 61920.55, change24h: 1.02, color: "from-[#F7931A] to-[#a5620d]", series: walk(61000, 12, 0.015) },
  { symbol: "USDC", name: "USD Coin", price: 1.0001, change24h: 0.01, color: "from-[#2775CA] to-[#164a83]", series: walk(1, 12, 0.001) },
  { symbol: "CAKE", name: "PancakeSwap", price: 2.31, change24h: -3.44, color: "from-[#D1884F] to-[#8c5a32]", series: walk(2.5, 12, 0.04) },
];

type Pool = { id: string; a: Token; b: Token; tvl: number; volume24h: number; apr: number; series: number[] };

const POOLS: Pool[] = [
  { id: "bnb-usdt", a: TOKENS[0], b: TOKENS[4], tvl: 2475564 + 4200 * 589.42, volume24h: 812400, apr: 18.4, series: walk(700000, 12, 0.08) },
  { id: "sell-usdt", a: TOKENS[1], b: TOKENS[4], tvl: 757800 + 9000000 * 0.0842, volume24h: 94200, apr: 41.2, series: walk(70000, 12, 0.15) },
  { id: "eth-usdt", a: TOKENS[2], b: TOKENS[4], tvl: 962271 + 310 * 3104.1, volume24h: 540300, apr: 12.1, series: walk(500000, 12, 0.07) },
  { id: "wbtc-usdt", a: TOKENS[3], b: TOKENS[4], tvl: 866888 + 14 * 61920.55, volume24h: 301800, apr: 9.6, series: walk(280000, 12, 0.06) },
  { id: "usdc-usdt", a: TOKENS[4], b: TOKENS[4], tvl: 1000050, volume24h: 615000, apr: 4.3, series: walk(560000, 12, 0.03) },
  { id: "cake-bnb", a: TOKENS[5], b: TOKENS[0], tvl: 415800 + 706 * 589.42, volume24h: 76100, apr: 27.8, series: walk(70000, 12, 0.1) },
].sort((a, b) => b.volume24h - a.volume24h);

const DAILY_VOLUME = [612000, 745000, 690000, 890000, 1040000, 980000, 1140000];
const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const ADDR_POOL = ["0x4f2a", "0x8b1c", "0x1ad9", "0x92e0", "0xc731", "0x5f6b", "0xa204"];

function randomAddr() {
  const p = ADDR_POOL[Math.floor(Math.random() * ADDR_POOL.length)];
  const suffix = Math.random().toString(16).slice(2, 6);
  return `${p}…${suffix}`;
}

function fmtUsd(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toLocaleString(undefined, { maximumFractionDigits: 2 })}M`;
  if (n >= 1_000) return `$${(n / 1_000).toLocaleString(undefined, { maximumFractionDigits: 1 })}K`;
  return `$${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}
function fmt(n: number, d = 2) {
  return n.toLocaleString(undefined, { maximumFractionDigits: d });
}

const easeOut = [0.16, 1, 0.3, 1] as const;

/* ------------------------------------------------------------------ */
/*  Small chart primitives                                             */
/* ------------------------------------------------------------------ */

function Sparkline({ data, positive, width = 90, height = 30 }: { data: number[]; positive: boolean; width?: number; height?: number }) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((v - min) / range) * height;
      return `${x},${y}`;
    })
    .join(" ");
  const color = positive ? "#5FD98A" : "#F1665A";

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <motion.polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }}
        whileInView={{ pathLength: 1, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1, ease: easeOut }}
      />
    </svg>
  );
}

function VolumeChart({ values, labels }: { values: number[]; labels: string[] }) {
  const max = Math.max(...values);
  const [hover, setHover] = useState<number | null>(null);
  return (
    <div>
      <div className="flex h-48 items-end gap-3 sm:gap-4">
        {values.map((v, i) => (
          <div
            key={i}
            className="group relative flex flex-1 flex-col items-center justify-end"
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
          >
            <AnimatePresence>
              {hover === i && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  className="glass-panel absolute -top-9 rounded-lg px-2.5 py-1 text-xs font-medium text-[var(--text-100)]"
                >
                  {fmtUsd(v)}
                </motion.div>
              )}
            </AnimatePresence>
            <motion.div
              initial={{ height: 0 }}
              whileInView={{ height: `${(v / max) * 100}%` }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.8, delay: i * 0.06, ease: easeOut }}
              className={`w-full rounded-t-md bg-gradient-to-t transition-[filter] duration-200 ${
                hover === i ? "brightness-125" : ""
              } from-[var(--gold-700)] to-[var(--gold-300)]`}
            />
          </div>
        ))}
      </div>
      <div className="mt-3 flex gap-3 sm:gap-4">
        {labels.map((l) => (
          <div key={l} className="flex-1 text-center text-xs text-[var(--text-600)]">
            {l}
          </div>
        ))}
      </div>
    </div>
  );
}

function Counter({ value, prefix = "", suffix = "", decimals = 0 }: { value: number; prefix?: string; suffix?: string; decimals?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (!isInView) return;
    const controls = animate(0, value, {
      duration: 1.6,
      ease: easeOut,
      onUpdate(v) {
        setDisplay(v);
      },
    });
    return () => controls.stop();
  }, [isInView, value]);
  return (
    <span ref={ref}>
      {prefix}
      {display.toLocaleString(undefined, { maximumFractionDigits: decimals, minimumFractionDigits: decimals })}
      {suffix}
    </span>
  );
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
function TokenBadge({ token, size = 28 }: { token: Token; size?: number }) {
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
      <div className="-ml-2">
        <TokenBadge token={b} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Live recent swaps feed                                             */
/* ------------------------------------------------------------------ */

type Swap = { id: number; pair: string; sellSym: string; buySym: string; sellAmt: string; buyAmt: string; addr: string; usd: number };

function randomSwap(id: number): Swap {
  const pool = POOLS[Math.floor(Math.random() * POOLS.length)];
  const flip = Math.random() > 0.5;
  const sell = flip ? pool.a : pool.b;
  const buy = flip ? pool.b : pool.a;
  const usd = Math.round(50 + Math.random() * 12000);
  const sellAmt = usd / sell.price;
  const buyAmt = (usd * 0.997) / buy.price;
  return {
    id,
    pair: `${pool.a.symbol}/${pool.b.symbol}`,
    sellSym: sell.symbol,
    buySym: buy.symbol,
    sellAmt: fmt(sellAmt, sellAmt < 1 ? 4 : 2),
    buyAmt: fmt(buyAmt, buyAmt < 1 ? 4 : 2),
    addr: randomAddr(),
    usd,
  };
}

function RecentSwaps() {
  const idRef = useRef(0);
  // Start empty on both server and client so the first paint matches
  // exactly. Math.random()-based content only gets generated client-side,
  // inside useEffect, which never runs during SSR.
  const [swaps, setSwaps] = useState<Swap[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    idRef.current = 0;
    setSwaps(
      Array.from({ length: 6 }, () => {
        idRef.current += 1;
        return randomSwap(idRef.current);
      })
    );
    setMounted(true);

    const interval = setInterval(() => {
      idRef.current += 1;
      setSwaps((prev) => [randomSwap(idRef.current), ...prev].slice(0, 8));
    }, 4200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--border-hair)] bg-[var(--bg-surface)]/40">
      <div className="flex items-center justify-between border-b border-[var(--border-hair)] px-5 py-3.5">
        <span className="text-sm font-medium text-[var(--text-100)]">Recent swaps</span>
        <span className="flex items-center gap-1.5 text-xs text-[var(--text-600)]">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-pulse-ring absolute h-1.5 w-1.5 rounded-full bg-[#5FD98A]" />
            <span className="h-1.5 w-1.5 rounded-full bg-[#5FD98A]" />
          </span>
          Live
        </span>
      </div>
      <div className="hidden grid-cols-[1.4fr_1fr_1fr_0.8fr] gap-3 px-5 py-2.5 text-xs text-[var(--text-600)] md:grid">
        <span>Trade</span>
        <span>Wallet</span>
        <span>Value</span>
        <span className="text-right">Time</span>
      </div>
      {!mounted && (
        <div className="animate-pulse">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="grid grid-cols-2 items-center gap-2 border-t border-[var(--border-hair)] px-5 py-3 text-sm md:grid-cols-[1.4fr_1fr_1fr_0.8fr]"
            >
              <div className="col-span-2 h-4 w-2/3 rounded bg-[var(--bg-surface-2)] md:col-span-1" />
              <div className="hidden h-4 w-16 rounded bg-[var(--bg-surface-2)] md:block" />
              <div className="h-4 w-14 rounded bg-[var(--bg-surface-2)]" />
              <div className="ml-auto h-4 w-10 rounded bg-[var(--bg-surface-2)]" />
            </div>
          ))}
        </div>
      )}
      <AnimatePresence initial={false}>
        {swaps.map((s, i) => (
          <motion.div
            key={s.id}
            layout
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: easeOut }}
            className="grid grid-cols-2 items-center gap-2 border-t border-[var(--border-hair)] px-5 py-3 text-sm md:grid-cols-[1.4fr_1fr_1fr_0.8fr]"
          >
            <div className="col-span-2 text-[var(--text-100)] md:col-span-1">
              {s.sellAmt} {s.sellSym} <span className="text-[var(--text-600)]">→</span> {s.buyAmt} {s.buySym}
            </div>
            <div className="hidden text-[var(--text-400)] md:block">{s.addr}</div>
            <div className="text-[var(--text-400)]">{fmtUsd(s.usd)}</div>
            <div className="text-right text-xs text-[var(--text-600)]">
              {i === 0 ? "just now" : `${i * 4}s ago`}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                                */
/* ------------------------------------------------------------------ */

export default function DashboardPage() {
  const { address } = useAccount();
  const realPool = usePoolInfo(
    CONTRACTS.anvil.factory as `0x${string}`,
    CONTRACTS.anvil.sell as `0x${string}`,
    CONTRACTS.anvil.usdt as `0x${string}`,
    address
  );
  const liveSwaps = useLiveSwaps(realPool.pairAddress, "SELL", "USDT");

  const realTvl = realPool.reserveA * 0.0842 + realPool.reserveB * 1;
  const mockPoolsExcludingReal = POOLS.filter((p) => p.id !== "sell-usdt");
  const totalTvl = mockPoolsExcludingReal.reduce((s, p) => s + p.tvl, 0) + realTvl;
  const totalVolume = POOLS.reduce((s, p) => s + p.volume24h, 0);

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
      <Header />

      <section className="mx-auto max-w-6xl px-5 pt-36">
        <a href="/" className="mb-3 flex items-center gap-1.5 text-sm text-[var(--text-400)] hover:text-[var(--text-100)]">
          <IconArrowLeft />
          Back
        </a>
        <h1 className="font-display text-3xl font-semibold text-[var(--text-100)]">Dashboard</h1>
        <p className="mt-1 text-sm text-[var(--text-400)]">
          Live protocol activity — liquidity, volume, prices, and trades as they happen.
        </p>

        {/* top stats */}
        <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            { label: "Total liquidity", value: <Counter value={totalTvl / 1_000_000} prefix="$" suffix="M" decimals={2} />, trend: "+3.2%", up: true },
            { label: "24h volume", value: <Counter value={totalVolume / 1_000_000} prefix="$" suffix="M" decimals={2} />, trend: "+9.1%", up: true },
            { label: "Active pools", value: <Counter value={POOLS.length} decimals={0} />, trend: "stable", up: true },
            { label: "24h trades", value: <Counter value={1204} decimals={0} />, trend: "-1.4%", up: false },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, delay: i * 0.08, ease: easeOut }}
              className="rounded-2xl border border-[var(--border-hair)] bg-[var(--bg-surface)]/60 p-5"
            >
              <div className="text-xs text-[var(--text-600)]">{s.label}</div>
              <div className="mt-1.5 font-display text-2xl font-semibold text-[var(--text-100)]">{s.value}</div>
              <div className={`mt-1 text-xs ${s.up ? "text-[#5FD98A]" : "text-[#F1665A]"}`}>{s.trend}</div>
            </motion.div>
          ))}
        </div>

        {/* volume chart */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: easeOut }}
          className="mt-8 rounded-2xl border border-[var(--border-hair)] bg-[var(--bg-surface)]/60 p-6"
        >
          <div className="mb-6 flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-[var(--text-100)]">Trading volume</div>
              <div className="text-xs text-[var(--text-600)]">Last 7 days</div>
            </div>
            <div className="font-display text-xl font-semibold text-[var(--text-100)]">
              {fmtUsd(DAILY_VOLUME.reduce((a, b) => a + b, 0))}
            </div>
          </div>
          <VolumeChart values={DAILY_VOLUME} labels={DAY_LABELS} />
        </motion.div>

        {/* pools + prices */}
        <div className="mt-8 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
          {/* popular pools */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, ease: easeOut }}
            className="overflow-hidden rounded-2xl border border-[var(--border-hair)] bg-[var(--bg-surface)]/40"
          >
            <div className="border-b border-[var(--border-hair)] px-5 py-3.5 text-sm font-medium text-[var(--text-100)]">
              Popular pools
            </div>
            <div className="hidden grid-cols-[1.4fr_0.8fr_0.8fr_0.6fr_0.8fr] gap-3 px-5 py-2.5 text-xs text-[var(--text-600)] md:grid">
              <span>Pool</span>
              <span>TVL</span>
              <span>Volume</span>
              <span>APR</span>
              <span>Trend</span>
            </div>
            {POOLS.map((p, i) => (
              <div
                key={p.id}
                className="grid grid-cols-2 items-center gap-2 border-t border-[var(--border-hair)] px-5 py-3.5 text-sm md:grid-cols-[1.4fr_0.8fr_0.8fr_0.6fr_0.8fr]"
              >
                <div className="col-span-2 flex items-center gap-2.5 md:col-span-1">
                  <span className="w-4 text-xs text-[var(--text-600)]">{i + 1}</span>
                  <PairIcons a={p.a} b={p.b} />
                  <span className="font-medium text-[var(--text-100)]">
                    {p.a.symbol}/{p.b.symbol}
                  </span>
                </div>
                <div className="text-[var(--text-400)]">{fmtUsd(p.tvl)}</div>
                <div className="text-[var(--text-400)]">{fmtUsd(p.volume24h)}</div>
                <div className="text-[#5FD98A]">{p.apr.toFixed(1)}%</div>
                <Sparkline data={p.series} positive={p.series[p.series.length - 1] >= p.series[0]} width={72} height={24} />
              </div>
            ))}
          </motion.div>

          {/* token prices */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, delay: 0.1, ease: easeOut }}
            className="overflow-hidden rounded-2xl border border-[var(--border-hair)] bg-[var(--bg-surface)]/40"
          >
            <div className="border-b border-[var(--border-hair)] px-5 py-3.5 text-sm font-medium text-[var(--text-100)]">
              Token prices
            </div>
            {TOKENS.map((t) => (
              <div
                key={t.symbol}
                className="flex items-center justify-between border-t border-[var(--border-hair)] px-5 py-3.5"
              >
                <div className="flex items-center gap-2.5">
                  <TokenBadge token={t} />
                  <div>
                    <div className="text-sm font-medium text-[var(--text-100)]">{t.symbol}</div>
                    <div className="text-xs text-[var(--text-600)]">${fmt(t.price, t.price < 1 ? 4 : 2)}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Sparkline data={t.series} positive={t.change24h >= 0} width={64} height={22} />
                  <span
                    className={`w-14 text-right text-xs font-medium ${
                      t.change24h >= 0 ? "text-[#5FD98A]" : "text-[#F1665A]"
                    }`}
                  >
                    {t.change24h >= 0 ? "+" : ""}
                    {t.change24h.toFixed(2)}%
                  </span>
                </div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* recent swaps */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: easeOut }}
          className="mt-8"
        >
          <RecentSwaps />
        </motion.div>

        {/* live on-chain swaps — real, not mock */}
        {liveSwaps.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, ease: easeOut }}
            className="mt-6 overflow-hidden rounded-2xl border border-[var(--border-hair)] bg-[var(--bg-surface)]/40"
          >
            <div className="flex items-center justify-between border-b border-[var(--border-hair)] px-5 py-3.5">
              <span className="text-sm font-medium text-[var(--text-100)]">Live on-chain swaps (SELL/USDT)</span>
              <span className="flex items-center gap-1.5 text-xs text-[#5FD98A]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#5FD98A]" />
                Real
              </span>
            </div>
            {liveSwaps.map((s) => (
              <div key={s.id} className="flex items-center justify-between border-t border-[var(--border-hair)] px-5 py-3">
                <div className="text-sm text-[var(--text-100)]">
                  {parseFloat(s.amountIn).toFixed(4)} {s.tokenIn} <span className="text-[var(--text-600)]">→</span>{" "}
                  {parseFloat(s.amountOut).toFixed(4)} {s.tokenOut}
                </div>
                <div className="text-xs text-[var(--text-600)]">{s.sender}</div>
              </div>
            ))}
          </motion.div>
        )}
      </section>
    </main>
  );
}