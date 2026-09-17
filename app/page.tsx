"use client";

import { useEffect, useRef, useState } from "react";
import {
  motion,
  useInView,
  animate,
  useScroll,
  useTransform,
} from "framer-motion";

/* ------------------------------------------------------------------ */
/*  Shared motion variants                                             */
/* ------------------------------------------------------------------ */

const easeOut = [0.16, 1, 0.3, 1] as const;

const heroContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.15 } },
};

const heroItem = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: easeOut } },
};

const revealUp = {
  hidden: { opacity: 0, y: 40 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: easeOut } },
};

/* ------------------------------------------------------------------ */
/*  Small building blocks                                              */
/* ------------------------------------------------------------------ */

function Counter({
  value,
  prefix = "",
  suffix = "",
  decimals = 0,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    const controls = animate(0, value, {
      duration: 1.8,
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
      {display.toLocaleString(undefined, {
        maximumFractionDigits: decimals,
        minimumFractionDigits: decimals,
      })}
      {suffix}
    </span>
  );
}

function SwapIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path
        d="M4 8h13M17 8l-3.5-3.5M17 8l-3.5 3.5M20 16H7M7 16l3.5-3.5M7 16l3.5 3.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LiquidityIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 3c3.5 4 6 7.2 6 10.2A6 6 0 1 1 6 13.2C6 10.2 8.5 7 12 3Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M9.5 14.2a2.6 2.6 0 0 0 2.6 2.4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function WalletIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <rect
        x="3"
        y="6"
        width="18"
        height="13"
        rx="2.5"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path d="M3 10h18" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="16.5" cy="14" r="1.2" fill="currentColor" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Data                                                                */
/* ------------------------------------------------------------------ */

const tickerPairs = [
  { pair: "BNB / USDT", price: "$589.42", change: "+2.14%", up: true },
  { pair: "SELL / USDT", price: "$0.0842", change: "+11.6%", up: true },
  { pair: "ETH / USDT", price: "$3,104.10", change: "-0.86%", up: false },
  { pair: "WBTC / USDT", price: "$61,920.55", change: "+1.02%", up: true },
  { pair: "USDC / USDT", price: "$1.0001", change: "+0.01%", up: true },
  { pair: "CAKE / USDT", price: "$2.31", change: "-3.44%", up: false },
];

const features = [
  {
    icon: SwapIcon,
    title: "Swap",
    body: "Trade any listed token at a rate priced live by the pool's own reserves — no order book, no waiting for a match.",
    points: ["Adjustable slippage", "Live rate & minimum received", "One approval, then you're done"],
  },
  {
    icon: LiquidityIcon,
    title: "Liquidity",
    body: "Deposit a pair of tokens into a pool and earn a share of every trade that passes through it.",
    points: ["Add or remove anytime", "Track your pool share", "LP position always visible"],
  },
  {
    icon: WalletIcon,
    title: "Wallet",
    body: "Everything stays in your own wallet. SellCex never holds custody of your funds — the contracts execute, you keep the keys.",
    points: ["Balances across networks", "Full transaction history", "Nothing leaves self-custody"],
  },
];

const flowSteps = [
  { title: "Connect wallet", body: "Link your wallet — no account, no email, no KYC." },
  { title: "Choose a pair", body: "Pick the token you're selling and the token you want." },
  { title: "Router finds the path", body: "The SellCex Router quotes the best rate across pools." },
  { title: "AMM prices the trade", body: "The pool's constant-product curve sets your output." },
  { title: "Confirm on-chain", body: "Sign once. Tokens settle directly to your wallet." },
];

/* ------------------------------------------------------------------ */
/*  Page                                                                */
/* ------------------------------------------------------------------ */

export default function Home() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0.2]);
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 80]);

  return (
    <main className="relative min-h-screen bg-[var(--bg)]">
      {/* ---------------------------------------------------------- */}
      {/* Navbar                                                      */}
      {/* ---------------------------------------------------------- */}
      <header className="fixed top-0 z-50 w-full">
        <div className="glass-panel mx-auto mt-4 flex max-w-6xl items-center justify-between rounded-2xl px-5 py-3 md:mt-6 md:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--gold-300)] to-[var(--gold-700)] text-sm font-bold text-[#050407]">
              S
            </div>
            <span className="font-display text-lg font-semibold tracking-tight text-[var(--text-100)]">
              SellCex
            </span>
          </div>

          <nav className="hidden items-center gap-8 text-sm text-[var(--text-400)] md:flex">
            <a href="#swap" className="transition-colors hover:text-[var(--text-100)]">Swap</a>
            <a href="#liquidity" className="transition-colors hover:text-[var(--text-100)]">Liquidity</a>
            <a href="#how-it-works" className="transition-colors hover:text-[var(--text-100)]">How it works</a>
            <a href="#dashboard" className="transition-colors hover:text-[var(--text-100)]">Dashboard</a>
          </nav>

          <button className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--gold-300)] to-[var(--gold-700)] px-4 py-2 text-sm font-semibold text-[#050407] transition-transform hover:scale-[1.03] active:scale-[0.98]">
            Connect Wallet
          </button>
        </div>
      </header>

      {/* ---------------------------------------------------------- */}
      {/* Hero                                                        */}
      {/* ---------------------------------------------------------- */}
      <section
        ref={heroRef}
        className="relative flex min-h-screen items-center overflow-hidden pt-28"
      >
        {/* background image + gradient wash */}
        <div className="absolute inset-0 -z-20">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-[0.16]"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1760978631985-590e3b5f4057?fm=jpg&q=70&w=2400&auto=format&fit=crop')",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[var(--bg)] via-[var(--bg)]/85 to-[var(--bg)]" />
        </div>

        {/* floating gradient orbs */}
        <div className="pointer-events-none absolute inset-0 -z-10 bg-noise">
          <div className="animate-float-slow absolute -left-24 top-10 h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,rgba(240,180,41,0.28),transparent_70%)] blur-3xl" />
          <div className="animate-float-slower absolute right-[-10%] top-1/3 h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle,rgba(124,92,252,0.16),transparent_70%)] blur-3xl" />
          <div className="grid-overlay absolute inset-0" />
        </div>

        <motion.div
          style={{ opacity: heroOpacity, y: heroY }}
          className="mx-auto grid w-full max-w-6xl gap-16 px-6 pb-24 md:grid-cols-[1.1fr_0.9fr] md:items-center"
        >
          <motion.div
            variants={heroContainer}
            initial="hidden"
            animate="show"
          >
            <motion.div
              variants={heroItem}
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--border-hair)] bg-[var(--bg-surface)]/60 px-3.5 py-1.5 text-xs text-[var(--text-400)]"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-pulse-ring absolute h-2 w-2 rounded-full bg-[var(--gold-500)]" />
                <span className="h-2 w-2 rounded-full bg-[var(--gold-500)]" />
              </span>
              Live on BSC Testnet
            </motion.div>

            <motion.h1
              variants={heroItem}
              className="font-display text-5xl font-semibold leading-[1.05] tracking-tight text-[var(--text-100)] sm:text-6xl lg:text-7xl"
            >
              Trade crypto.
              <br />
              <span className="text-gradient-gold">Own your assets.</span>
            </motion.h1>

            <motion.p
              variants={heroItem}
              className="mt-6 max-w-md text-lg leading-relaxed text-[var(--text-400)]"
            >
              SellCex is a decentralized exchange. Connect your wallet, swap
              tokens, and provide liquidity — settled on-chain, held in your
              own custody the entire time.
            </motion.p>

            <motion.div
              variants={heroItem}
              className="mt-9 flex flex-wrap items-center gap-4"
            >
              <button className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-[var(--gold-300)] via-[var(--gold-500)] to-[var(--gold-700)] bg-[length:200%_100%] px-7 py-3.5 text-sm font-semibold text-[#050407] shadow-[0_0_30px_-6px_rgba(240,180,41,0.6)] transition-[background-position,transform] duration-500 hover:bg-[100%_0] hover:scale-[1.02]">
                Launch App
              </button>
              <a
                href="#how-it-works"
                className="rounded-xl border border-[var(--border-hair)] px-7 py-3.5 text-sm font-semibold text-[var(--text-100)] transition-colors hover:bg-[var(--bg-surface)]"
              >
                See how it works
              </a>
            </motion.div>

            <motion.div
              variants={heroItem}
              className="mt-14 grid max-w-md grid-cols-3 gap-6 border-t border-[var(--border-hair)] pt-7"
            >
              <div>
                <div className="font-display text-2xl font-semibold text-[var(--text-100)]">
                  <Counter value={4.82} prefix="$" suffix="M" decimals={2} />
                </div>
                <div className="mt-1 text-xs text-[var(--text-600)]">
                  Total liquidity
                </div>
              </div>
              <div>
                <div className="font-display text-2xl font-semibold text-[var(--text-100)]">
                  <Counter value={1.14} prefix="$" suffix="M" decimals={2} />
                </div>
                <div className="mt-1 text-xs text-[var(--text-600)]">
                  24h volume
                </div>
              </div>
              <div>
                <div className="font-display text-2xl font-semibold text-[var(--text-100)]">
                  <Counter value={38} suffix="" decimals={0} />
                </div>
                <div className="mt-1 text-xs text-[var(--text-600)]">
                  Active pools
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Mock swap card */}
          <motion.div
            initial={{ opacity: 0, x: 40, rotate: 2 }}
            animate={{ opacity: 1, x: 0, rotate: 0 }}
            transition={{ duration: 0.9, delay: 0.4, ease: easeOut }}
            className="glass-panel relative rounded-3xl p-6 shadow-[0_20px_80px_-20px_rgba(0,0,0,0.7)] md:justify-self-end md:p-7"
          >
            <div className="mb-5 flex items-center justify-between text-sm text-[var(--text-400)]">
              <span>Swap</span>
              <span className="rounded-md bg-[var(--bg-surface-2)] px-2 py-1 text-xs">
                Slippage 0.5%
              </span>
            </div>

            <div className="space-y-2">
              <div className="rounded-2xl border border-[var(--border-hair)] bg-[var(--bg-surface-2)] p-4">
                <div className="mb-2 flex justify-between text-xs text-[var(--text-600)]">
                  <span>You pay</span>
                  <span>Balance: 1,250.00</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-display text-2xl text-[var(--text-100)]">
                    500.00
                  </span>
                  <span className="rounded-full bg-[var(--bg-surface)] px-3 py-1.5 text-sm font-medium text-[var(--text-100)]">
                    USDT
                  </span>
                </div>
              </div>

              <div className="relative z-10 mx-auto -my-4 flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border-hair)] bg-[var(--bg-surface)] text-[var(--gold-500)]">
                <SwapIcon />
              </div>

              <div className="rounded-2xl border border-[var(--border-hair)] bg-[var(--bg-surface-2)] p-4">
                <div className="mb-2 flex justify-between text-xs text-[var(--text-600)]">
                  <span>You receive</span>
                  <span>Balance: 0.00</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-display text-2xl text-[var(--text-100)]">
                    5,935.20
                  </span>
                  <span className="rounded-full bg-gradient-to-r from-[var(--gold-300)] to-[var(--gold-700)] px-3 py-1.5 text-sm font-semibold text-[#050407]">
                    SELL
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 space-y-1.5 text-xs text-[var(--text-600)]">
              <div className="flex justify-between">
                <span>Rate</span>
                <span className="text-[var(--text-400)]">1 USDT = 11.87 SELL</span>
              </div>
              <div className="flex justify-between">
                <span>Minimum received</span>
                <span className="text-[var(--text-400)]">5,905.55 SELL</span>
              </div>
            </div>

            <button className="mt-5 w-full rounded-xl bg-gradient-to-r from-[var(--gold-300)] to-[var(--gold-700)] py-3.5 text-sm font-semibold text-[#050407] transition-transform hover:scale-[1.01] active:scale-[0.99]">
              Swap
            </button>
          </motion.div>
        </motion.div>
      </section>

      {/* ---------------------------------------------------------- */}
      {/* Ticker marquee                                              */}
      {/* ---------------------------------------------------------- */}
      <section className="relative border-y border-[var(--border-hair)] bg-[var(--bg-surface)]/40 py-4">
        <div className="flex overflow-hidden">
          <div className="animate-marquee flex shrink-0 gap-10 pr-10">
            {[...tickerPairs, ...tickerPairs].map((t, i) => (
              <div key={i} className="flex shrink-0 items-center gap-2.5 text-sm">
                <span className="font-medium text-[var(--text-100)]">{t.pair}</span>
                <span className="text-[var(--text-400)]">{t.price}</span>
                <span className={t.up ? "text-[#5FD98A]" : "text-[#F1665A]"}>
                  {t.change}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------- */}
      {/* Features                                                    */}
      {/* ---------------------------------------------------------- */}
      <section id="swap" className="relative mx-auto max-w-6xl px-6 py-28">
        <motion.div
          variants={revealUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="mb-14 max-w-xl"
        >
          <h2 className="font-display text-3xl font-semibold tracking-tight text-[var(--text-100)] sm:text-4xl">
            Three primitives, entirely on-chain
          </h2>
          <p className="mt-4 text-[var(--text-400)]">
            No middlemen holding your funds, no black-box pricing. Every
            swap, deposit, and withdrawal runs through contracts you can
            read yourself.
          </p>
        </motion.div>

        <div className="grid gap-5 md:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              variants={revealUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-80px" }}
              transition={{ delay: i * 0.12 }}
              className="group relative overflow-hidden rounded-2xl border border-[var(--border-hair)] bg-[var(--bg-surface)]/60 p-7 transition-colors hover:border-[rgba(245,201,92,0.35)]"
            >
              <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[radial-gradient(circle,rgba(240,180,41,0.18),transparent_70%)] opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100" />
              <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--border-hair)] text-[var(--gold-500)]">
                <f.icon />
              </div>
              <h3 className="font-display text-xl font-semibold text-[var(--text-100)]">
                {f.title}
              </h3>
              <p className="mt-2.5 text-sm leading-relaxed text-[var(--text-400)]">
                {f.body}
              </p>
              <ul className="mt-5 space-y-2 border-t border-[var(--border-hair)] pt-5">
                {f.points.map((p) => (
                  <li
                    key={p}
                    className="flex items-center gap-2 text-sm text-[var(--text-400)]"
                  >
                    <span className="h-1 w-1 rounded-full bg-[var(--gold-500)]" />
                    {p}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ---------------------------------------------------------- */}
      {/* How it works — sequence, so numbered markers earn their keep */}
      {/* ---------------------------------------------------------- */}
      <section
        id="how-it-works"
        className="relative border-y border-[var(--border-hair)] bg-[var(--bg-surface)]/30 py-28"
      >
        <div className="mx-auto max-w-6xl px-6">
          <motion.h2
            variants={revealUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
            className="mb-14 font-display text-3xl font-semibold tracking-tight text-[var(--text-100)] sm:text-4xl"
          >
            From wallet to settlement, in five steps
          </motion.h2>

          <div className="grid gap-6 md:grid-cols-5">
            {flowSteps.map((s, i) => (
              <motion.div
                key={s.title}
                variants={revealUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-80px" }}
                transition={{ delay: i * 0.1 }}
                className="relative"
              >
                <div className="font-display text-3xl font-semibold text-[var(--gold-700)]">
                  {String(i + 1).padStart(2, "0")}
                </div>
                <h3 className="mt-3 text-base font-semibold text-[var(--text-100)]">
                  {s.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--text-400)]">
                  {s.body}
                </p>
                {i < flowSteps.length - 1 && (
                  <div className="absolute right-[-14px] top-2 hidden h-px w-6 bg-gradient-to-r from-[var(--gold-700)] to-transparent md:block" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------- */}
      {/* Dashboard preview                                           */}
      {/* ---------------------------------------------------------- */}
      <section id="dashboard" className="relative mx-auto max-w-6xl px-6 py-28">
        <motion.div
          variants={revealUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="grid gap-12 md:grid-cols-2 md:items-center"
        >
          <div>
            <h2 className="font-display text-3xl font-semibold tracking-tight text-[var(--text-100)] sm:text-4xl">
              Every pool, every trade, in one dashboard
            </h2>
            <p className="mt-4 max-w-md text-[var(--text-400)]">
              Track total liquidity, trading volume, and popular pairs as
              they happen. Nothing is delayed, nothing is cached from a
              centralized server pretending to be the chain.
            </p>
            <div className="mt-8 grid grid-cols-2 gap-5">
              {[
                { label: "Total liquidity", value: "$4.82M" },
                { label: "24h volume", value: "$1.14M" },
                { label: "Popular pool", value: "BNB / USDT" },
                { label: "Recent swaps", value: "1,204 today" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-xl border border-[var(--border-hair)] bg-[var(--bg-surface)]/60 p-4"
                >
                  <div className="text-xs text-[var(--text-600)]">
                    {stat.label}
                  </div>
                  <div className="mt-1.5 font-display text-lg font-semibold text-[var(--text-100)]">
                    {stat.value}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative rounded-3xl border border-[var(--border-hair)] p-1.5">
            <div
              className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-cover bg-center"
              style={{
                backgroundImage:
                  "url('https://images.unsplash.com/photo-1760978631985-590e3b5f4057?fm=jpg&q=75&w=1600&auto=format&fit=crop')",
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg)] via-[var(--bg)]/50 to-transparent" />
              <div className="glass-panel absolute bottom-5 left-5 right-5 rounded-xl p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[var(--text-400)]">SELL / USDT</span>
                  <span className="text-[#5FD98A]">+11.6%</span>
                </div>
                <div className="mt-1 font-display text-xl font-semibold text-[var(--text-100)]">
                  $0.0842
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ---------------------------------------------------------- */}
      {/* Final CTA                                                   */}
      {/* ---------------------------------------------------------- */}
      <section className="relative mx-auto max-w-6xl px-6 pb-28">
        <motion.div
          variants={revealUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="bg-noise relative overflow-hidden rounded-3xl border border-[var(--border-hair)] bg-gradient-to-br from-[var(--bg-surface)] to-[var(--bg-surface-2)] px-8 py-16 text-center sm:px-16"
        >
          <div className="animate-float-slow pointer-events-none absolute left-1/2 top-0 h-[300px] w-[500px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(240,180,41,0.22),transparent_70%)] blur-3xl" />
          <h2 className="font-display text-3xl font-semibold tracking-tight text-[var(--text-100)] sm:text-4xl">
            Ready to trade without a middleman?
          </h2>
          <p className="mx-auto mt-4 max-w-md text-[var(--text-400)]">
            Connect your wallet and make your first swap on SellCex
            Testnet — no signup, no funds at risk.
          </p>
          <button className="mt-8 rounded-xl bg-gradient-to-r from-[var(--gold-300)] to-[var(--gold-700)] px-8 py-3.5 text-sm font-semibold text-[#050407] shadow-[0_0_30px_-6px_rgba(240,180,41,0.6)] transition-transform hover:scale-[1.03] active:scale-[0.98]">
            Launch App
          </button>
        </motion.div>
      </section>

      {/* ---------------------------------------------------------- */}
      {/* Footer                                                      */}
      {/* ---------------------------------------------------------- */}
      <footer className="border-t border-[var(--border-hair)] px-6 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--gold-300)] to-[var(--gold-700)] text-xs font-bold text-[#050407]">
              S
            </div>
            <span className="font-display text-base font-semibold text-[var(--text-100)]">
              SellCex
            </span>
          </div>
          <div className="flex gap-6 text-sm text-[var(--text-400)]">
            <a href="#" className="hover:text-[var(--text-100)]">Docs</a>
            <a href="#" className="hover:text-[var(--text-100)]">GitHub</a>
            <a href="#" className="hover:text-[var(--text-100)]">Twitter</a>
          </div>
          <span className="text-xs text-[var(--text-600)]">
            © {new Date().getFullYear()} SellCex. Built on BSC Testnet.
          </span>
        </div>
      </footer>
    </main>
  );
}