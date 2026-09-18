"use client";

import { useEffect, useRef, useState } from "react";
import {
  motion,
  useInView,
  animate,
  useScroll,
  useTransform,
  useMotionValue,
  useSpring,
  AnimatePresence,
} from "framer-motion";

/* ------------------------------------------------------------------ */
/*  Shared motion helpers                                              */
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
/*  Cursor-reactive glow — follows the pointer across the whole page   */
/* ------------------------------------------------------------------ */

function CursorGlow() {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { damping: 30, stiffness: 120 });
  const springY = useSpring(y, { damping: 30, stiffness: 120 });

  useEffect(() => {
    const move = (e: MouseEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
    };
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, [x, y]);

  return (
    <motion.div
      className="pointer-events-none fixed left-0 top-0 z-30 hidden h-[420px] w-[420px] rounded-full opacity-[0.10] mix-blend-screen md:block"
      style={{
        translateX: springX,
        translateY: springY,
        x: "-50%",
        y: "-50%",
        background:
          "radial-gradient(circle, rgba(240,180,41,0.9) 0%, transparent 70%)",
        filter: "blur(10px)",
      }}
    />
  );
}

/* ------------------------------------------------------------------ */
/*  Scroll progress bar                                                */
/* ------------------------------------------------------------------ */

function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { damping: 24, stiffness: 120 });
  return (
    <motion.div
      style={{ scaleX }}
      className="fixed left-0 top-0 z-[60] h-[2.5px] w-full origin-left bg-gradient-to-r from-[var(--gold-300)] via-[var(--gold-500)] to-[var(--gold-700)]"
    />
  );
}

/* ------------------------------------------------------------------ */
/*  3D tilt wrapper — reacts to mouse position                         */
/* ------------------------------------------------------------------ */

function TiltCard({
  children,
  className = "",
  max = 8,
}: {
  children: React.ReactNode;
  className?: string;
  max?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const rx = useSpring(0, { damping: 18, stiffness: 180 });
  const ry = useSpring(0, { damping: 18, stiffness: 180 });

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    ry.set(px * max * 2);
    rx.set(-py * max * 2);
  };
  const reset = () => {
    rx.set(0);
    ry.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={reset}
      style={{ rotateX: rx, rotateY: ry, transformPerspective: 900 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Counter                                                             */
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

/* ------------------------------------------------------------------ */
/*  Icons                                                               */
/* ------------------------------------------------------------------ */

function SwapIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M4 8h13M17 8l-3.5-3.5M17 8l-3.5 3.5M20 16H7M7 16l3.5-3.5M7 16l3.5 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function LiquidityIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M12 3c3.5 4 6 7.2 6 10.2A6 6 0 1 1 6 13.2C6 10.2 8.5 7 12 3Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M9.5 14.2a2.6 2.6 0 0 0 2.6 2.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
function WalletIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="6" width="18" height="13" rx="2.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M3 10h18" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="16.5" cy="14" r="1.2" fill="currentColor" />
    </svg>
  );
}
function ShieldIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M12 3l7 3v6c0 4.5-3 7.7-7 9-4-1.3-7-4.5-7-9V6l7-3Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function ChevronIcon({ open }: { open: boolean }) {
  return (
    <motion.svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      animate={{ rotate: open ? 180 : 0 }}
      transition={{ duration: 0.3 }}
    >
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </motion.svg>
  );
}
function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <motion.path
        d="M4 6h16"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        animate={open ? { d: "M6 6l12 12" } : { d: "M4 6h16" }}
      />
      <motion.path
        d="M4 12h16"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        animate={{ opacity: open ? 0 : 1 }}
      />
      <motion.path
        d="M4 18h16"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        animate={open ? { d: "M6 18L18 6" } : { d: "M4 18h16" }}
      />
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

const roadmap = [
  { phase: "Phase 01", title: "Testnet launch", body: "Core AMM, Router, and Factory live on BSC Testnet with faucet tokens.", status: "In progress" },
  { phase: "Phase 02", title: "Audit & hardening", body: "Fuzz and invariant testing, third-party contract review.", status: "Next" },
  { phase: "Phase 03", title: "Mainnet deployment", body: "SellCex goes live on BSC Mainnet with seeded liquidity.", status: "Planned" },
  { phase: "Phase 04", title: "Multi-chain expansion", body: "Deploying the same core contracts to additional EVM chains.", status: "Planned" },
];

const testimonials = [
  { quote: "Finally a DEX where the pricing curve isn't a black box you have to trust blindly.", name: "0x4f...a91c", role: "Testnet user" },
  { quote: "The slippage controls and minimum-received display are exactly what a swap screen should show.", name: "0x8b...2e07", role: "Liquidity provider" },
  { quote: "Watched the router quote update live as I typed. That's the kind of detail that builds trust.", name: "0x1a...c644", role: "Early tester" },
];

const faqs = [
  { q: "Is SellCex custodial?", a: "No. SellCex never takes custody of your funds at any point. You approve a contract, sign a transaction, and tokens settle directly to your wallet." },
  { q: "What network is SellCex live on?", a: "SellCex is currently live on BSC Testnet so you can connect a wallet and execute real swaps without risking real funds. Mainnet follows after audits." },
  { q: "How is the swap price calculated?", a: "Each pool uses a constant-product AMM curve (x·y=k). The Router reads pool reserves and computes your output before you ever sign anything." },
  { q: "Can I provide liquidity and earn fees?", a: "Yes. Depositing a token pair mints you an LP position representing your share of the pool, which earns a cut of every trade routed through it." },
];

const tokenBadges = ["B", "E", "U", "S", "$"];

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

  const [menuOpen, setMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <main className="relative min-h-screen bg-[var(--bg)]">
      <ScrollProgress />
      <CursorGlow />

      {/* ---------------------------------------------------------- */}
      {/* Navbar                                                      */}
      {/* ---------------------------------------------------------- */}
      <header className="fixed top-0 z-50 w-full">
        <div className="glass-panel mx-auto mt-4 flex max-w-6xl items-center justify-between rounded-2xl px-5 py-3 md:mt-6 md:px-6">
          <div className="flex items-center gap-2">
            <motion.div
              animate={{ rotate: [0, 8, -8, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--gold-300)] to-[var(--gold-700)] text-sm font-bold text-[#050407]"
            >
              S
            </motion.div>
            <span className="font-display text-lg font-semibold tracking-tight text-[var(--text-100)]">
              SellCex
            </span>
          </div>

          <nav className="hidden items-center gap-8 text-sm text-[var(--text-400)] md:flex">
            <a href="/swap" className="transition-colors hover:text-[var(--text-100)]">Swap</a>
            <a href="/liquidity" className="transition-colors hover:text-[var(--text-100)]">Liquidity</a>
            <a href="#how-it-works" className="transition-colors hover:text-[var(--text-100)]">How it works</a>
            <a href="#security" className="transition-colors hover:text-[var(--text-100)]">Security</a>
            <a href="#roadmap" className="transition-colors hover:text-[var(--text-100)]">Roadmap</a>
            <a href="#faq" className="transition-colors hover:text-[var(--text-100)]">FAQ</a>
          </nav>

          <div className="flex items-center gap-2">
            <button className="btn-shine hidden rounded-xl px-4 py-2 text-sm font-semibold text-[#050407] transition-transform hover:scale-[1.03] active:scale-[0.98] sm:inline-block">
              Connect Wallet
            </button>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border-hair)] text-[var(--text-100)] md:hidden"
              aria-label="Toggle menu"
            >
              <MenuIcon open={menuOpen} />
            </button>
          </div>
        </div>

        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: easeOut }}
              className="glass-panel mx-4 mt-2 overflow-hidden rounded-2xl md:hidden"
            >
              <div className="flex flex-col gap-1 p-3 text-sm text-[var(--text-400)]">
                {[
                  ["Swap", "/swap"],
                  ["Liquidity", "/liquidity"],
                  ["How it works", "#how-it-works"],
                  ["Security", "#security"],
                  ["Roadmap", "#roadmap"],
                  ["FAQ", "#faq"],
                ].map(([label, href]) => (
                  <a
                    key={href}
                    href={href}
                    onClick={() => setMenuOpen(false)}
                    className="rounded-lg px-3 py-2.5 transition-colors hover:bg-[var(--bg-surface-2)] hover:text-[var(--text-100)]"
                  >
                    {label}
                  </a>
                ))}
                <button className="btn-shine mt-1 rounded-xl px-4 py-2.5 text-sm font-semibold text-[#050407]">
                  Connect Wallet
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ---------------------------------------------------------- */}
      {/* Hero                                                        */}
      {/* ---------------------------------------------------------- */}
      <section
        ref={heroRef}
        className="relative flex min-h-screen items-center overflow-hidden pt-28"
      >
        <div className="absolute inset-0 -z-20">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-[0.18]"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1760978631985-590e3b5f4057?fm=jpg&q=70&w=2400&auto=format&fit=crop')",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[var(--bg)] via-[var(--bg)]/85 to-[var(--bg)]" />
        </div>

        {/* animated mesh + orbs + particles, always running */}
        <div className="pointer-events-none absolute inset-0 -z-10 bg-noise">
          <div
            className="animate-mesh absolute inset-0 opacity-70"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 20%, rgba(240,180,41,0.22), transparent 35%), radial-gradient(circle at 85% 70%, rgba(124,92,252,0.16), transparent 40%), radial-gradient(circle at 50% 100%, rgba(240,180,41,0.12), transparent 45%)",
              backgroundSize: "150% 150%",
            }}
          />
          <div className="animate-float-slow absolute -left-24 top-10 h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,rgba(240,180,41,0.22),transparent_70%)] blur-3xl" />
          <div className="animate-float-slower absolute right-[-10%] top-1/3 h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle,rgba(124,92,252,0.14),transparent_70%)] blur-3xl" />
          <div className="grid-overlay absolute inset-0" />

          {/* twinkling particles */}
          {[...Array(18)].map((_, i) => (
            <div
              key={i}
              className="particle absolute h-1 w-1 rounded-full bg-[var(--gold-300)]"
              style={{
                left: `${(i * 37) % 100}%`,
                top: `${(i * 53) % 100}%`,
                animationDelay: `${(i % 6) * 0.6}s`,
              }}
            />
          ))}

          {/* floating token badges, continuous bob */}
          {tokenBadges.map((t, i) => (
            <div
              key={t}
              className="animate-bob absolute hidden h-10 w-10 items-center justify-center rounded-full border border-[var(--border-hair)] bg-[var(--bg-surface)]/70 text-xs font-semibold text-[var(--gold-300)] backdrop-blur-sm md:flex"
              style={{
                left: `${8 + i * 18}%`,
                top: `${18 + (i % 3) * 22}%`,
                animationDelay: `${i * 0.8}s`,
              }}
            >
              {t}
            </div>
          ))}
        </div>

        <motion.div
          style={{ opacity: heroOpacity, y: heroY }}
          className="mx-auto grid w-full max-w-6xl gap-16 px-6 pb-24 md:grid-cols-[1.1fr_0.9fr] md:items-center"
        >
          <motion.div variants={heroContainer} initial="hidden" animate="show">
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
              <span className="text-gradient-gold bg-[length:200%_auto]">
                Own your assets.
              </span>
            </motion.h1>

            <motion.p
              variants={heroItem}
              className="mt-6 max-w-md text-lg leading-relaxed text-[var(--text-400)]"
            >
              SellCex is a decentralized exchange. Connect your wallet, swap
              tokens, and provide liquidity — settled on-chain, held in your
              own custody the entire time.
            </motion.p>

            <motion.div variants={heroItem} className="mt-9 flex flex-wrap items-center gap-4">
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                className="btn-shine relative overflow-hidden rounded-xl px-7 py-3.5 text-sm font-semibold text-[#050407] shadow-[0_0_30px_-6px_rgba(240,180,41,0.6)]"
              >
                Launch App
              </motion.button>
              <motion.a
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                href="#how-it-works"
                className="rounded-xl border border-[var(--border-hair)] px-7 py-3.5 text-sm font-semibold text-[var(--text-100)] transition-colors hover:bg-[var(--bg-surface)]"
              >
                See how it works
              </motion.a>
            </motion.div>

            <motion.div
              variants={heroItem}
              className="mt-14 grid max-w-md grid-cols-3 gap-6 border-t border-[var(--border-hair)] pt-7"
            >
              <div>
                <div className="font-display text-2xl font-semibold text-[var(--text-100)]">
                  <Counter value={4.82} prefix="$" suffix="M" decimals={2} />
                </div>
                <div className="mt-1 text-xs text-[var(--text-600)]">Total liquidity</div>
              </div>
              <div>
                <div className="font-display text-2xl font-semibold text-[var(--text-100)]">
                  <Counter value={1.14} prefix="$" suffix="M" decimals={2} />
                </div>
                <div className="mt-1 text-xs text-[var(--text-600)]">24h volume</div>
              </div>
              <div>
                <div className="font-display text-2xl font-semibold text-[var(--text-100)]">
                  <Counter value={38} decimals={0} />
                </div>
                <div className="mt-1 text-xs text-[var(--text-600)]">Active pools</div>
              </div>
            </motion.div>
          </motion.div>

          {/* Mock swap card, tilts toward the cursor */}
          <TiltCard className="md:justify-self-end" max={6}>
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.9, delay: 0.4, ease: easeOut }}
              className="glass-panel relative rounded-3xl p-6 shadow-[0_20px_80px_-20px_rgba(0,0,0,0.7)] md:p-7"
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
                    <span className="font-display text-2xl text-[var(--text-100)]">500.00</span>
                    <span className="rounded-full bg-[var(--bg-surface)] px-3 py-1.5 text-sm font-medium text-[var(--text-100)]">
                      USDT
                    </span>
                  </div>
                </div>

                <motion.div
                  animate={{ rotate: [0, 180, 360] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear", repeatDelay: 2 }}
                  className="relative z-10 mx-auto -my-4 flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border-hair)] bg-[var(--bg-surface)] text-[var(--gold-500)]"
                >
                  <SwapIcon />
                </motion.div>

                <div className="rounded-2xl border border-[var(--border-hair)] bg-[var(--bg-surface-2)] p-4">
                  <div className="mb-2 flex justify-between text-xs text-[var(--text-600)]">
                    <span>You receive</span>
                    <span>Balance: 0.00</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-display text-2xl text-[var(--text-100)]">5,935.20</span>
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

              <motion.button
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.98 }}
                className="btn-shine mt-5 w-full rounded-xl py-3.5 text-sm font-semibold text-[#050407]"
              >
                Swap
              </motion.button>
            </motion.div>
          </TiltCard>
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
                <span className={t.up ? "text-[#5FD98A]" : "text-[#F1665A]"}>{t.change}</span>
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

        <div id="liquidity" className="grid gap-5 md:grid-cols-3">
          {features.map((f, i) => (
            <TiltCard key={f.title} max={5}>
              <motion.div
                variants={revealUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-80px" }}
                transition={{ delay: i * 0.12 }}
                whileHover={{ y: -6 }}
                className="group relative h-full overflow-hidden rounded-2xl border border-[var(--border-hair)] bg-[var(--bg-surface)]/60 p-7 transition-colors hover:border-[rgba(245,201,92,0.35)]"
              >
                <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[radial-gradient(circle,rgba(240,180,41,0.18),transparent_70%)] opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100" />
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--border-hair)] text-[var(--gold-500)]">
                  <f.icon />
                </div>
                <h3 className="font-display text-xl font-semibold text-[var(--text-100)]">{f.title}</h3>
                <p className="mt-2.5 text-sm leading-relaxed text-[var(--text-400)]">{f.body}</p>
                <ul className="mt-5 space-y-2 border-t border-[var(--border-hair)] pt-5">
                  {f.points.map((p) => (
                    <li key={p} className="flex items-center gap-2 text-sm text-[var(--text-400)]">
                      <span className="h-1 w-1 rounded-full bg-[var(--gold-500)]" />
                      {p}
                    </li>
                  ))}
                </ul>
              </motion.div>
            </TiltCard>
          ))}
        </div>
      </section>

      {/* ---------------------------------------------------------- */}
      {/* How it works                                                */}
      {/* ---------------------------------------------------------- */}
      <section id="how-it-works" className="relative border-y border-[var(--border-hair)] bg-[var(--bg-surface)]/30 py-28">
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
                <h3 className="mt-3 text-base font-semibold text-[var(--text-100)]">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--text-400)]">{s.body}</p>
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
                <motion.div
                  key={stat.label}
                  whileHover={{ y: -4, borderColor: "rgba(245,201,92,0.4)" }}
                  className="rounded-xl border border-[var(--border-hair)] bg-[var(--bg-surface)]/60 p-4"
                >
                  <div className="text-xs text-[var(--text-600)]">{stat.label}</div>
                  <div className="mt-1.5 font-display text-lg font-semibold text-[var(--text-100)]">
                    {stat.value}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <TiltCard max={4}>
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
          </TiltCard>
        </motion.div>
      </section>

      {/* ---------------------------------------------------------- */}
      {/* Security                                                    */}
      {/* ---------------------------------------------------------- */}
      <section id="security" className="relative overflow-hidden border-y border-[var(--border-hair)] py-28">
        <div
          className="absolute inset-0 -z-10 bg-cover bg-center opacity-[0.08]"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1744324509518-d61c11a4d509?fm=jpg&q=70&w=2000&auto=format&fit=crop')",
          }}
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[var(--bg)] via-[var(--bg-surface)]/60 to-[var(--bg)]" />

        <div className="mx-auto max-w-6xl px-6">
          <motion.div
            variants={revealUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
            className="mb-14 max-w-xl"
          >
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--border-hair)] text-[var(--gold-500)]">
              <ShieldIcon />
            </div>
            <h2 className="font-display text-3xl font-semibold tracking-tight text-[var(--text-100)] sm:text-4xl">
              Built to be read, not just trusted
            </h2>
            <p className="mt-4 text-[var(--text-400)]">
              The AMM, Router, and Factory are our own implementation, tested
              with Foundry's fuzz and invariant suites before a single
              testnet deployment.
            </p>
          </motion.div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Reentrancy guarded", body: "Mint, burn, and swap are locked against re-entry." },
              { label: "K-invariant enforced", body: "Every swap is checked to never decrease pool reserves' product." },
              { label: "Slippage protected", body: "Minimum-received checks revert trades that move too far." },
              { label: "Deadline enforced", body: "Stale transactions expire instead of executing at a bad price." },
            ].map((item, i) => (
              <motion.div
                key={item.label}
                variants={revealUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-80px" }}
                transition={{ delay: i * 0.08 }}
                className="rounded-2xl border border-[var(--border-hair)] bg-[var(--bg-surface)]/60 p-5"
              >
                <div className="text-sm font-semibold text-[var(--text-100)]">{item.label}</div>
                <p className="mt-2 text-sm leading-relaxed text-[var(--text-400)]">{item.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------- */}
      {/* Testimonials                                                */}
      {/* ---------------------------------------------------------- */}
      <section className="relative mx-auto max-w-6xl px-6 py-28">
        <motion.h2
          variants={revealUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="mb-14 font-display text-3xl font-semibold tracking-tight text-[var(--text-100)] sm:text-4xl"
        >
          What testers are saying
        </motion.h2>
        <div className="grid gap-5 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              variants={revealUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-80px" }}
              transition={{ delay: i * 0.12 }}
              whileHover={{ y: -6 }}
              className="rounded-2xl border border-[var(--border-hair)] bg-[var(--bg-surface)]/60 p-6"
            >
              <p className="text-sm leading-relaxed text-[var(--text-100)]">"{t.quote}"</p>
              <div className="mt-5 flex items-center gap-3 border-t border-[var(--border-hair)] pt-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[var(--gold-300)] to-[var(--gold-700)] text-xs font-bold text-[#050407]">
                  {t.name.slice(2, 4).toUpperCase()}
                </div>
                <div>
                  <div className="text-xs font-medium text-[var(--text-100)]">{t.name}</div>
                  <div className="text-xs text-[var(--text-600)]">{t.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ---------------------------------------------------------- */}
      {/* Roadmap                                                     */}
      {/* ---------------------------------------------------------- */}
      <section id="roadmap" className="relative border-y border-[var(--border-hair)] bg-[var(--bg-surface)]/30 py-28">
        <div className="mx-auto max-w-6xl px-6">
          <motion.h2
            variants={revealUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
            className="mb-14 font-display text-3xl font-semibold tracking-tight text-[var(--text-100)] sm:text-4xl"
          >
            Where SellCex is headed
          </motion.h2>

          <div className="relative">
            <div className="absolute left-[15px] top-2 hidden h-[calc(100%-16px)] w-px bg-gradient-to-b from-[var(--gold-500)] via-[var(--border-hair)] to-transparent md:block" />
            <div className="space-y-8">
              {roadmap.map((r, i) => (
                <motion.div
                  key={r.phase}
                  variants={revealUp}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ delay: i * 0.1 }}
                  className="relative flex gap-6 pl-0 md:pl-10"
                >
                  <div className="absolute left-0 top-1.5 hidden h-2 w-2 rounded-full bg-[var(--gold-500)] md:block" />
                  <div className="flex-1 rounded-2xl border border-[var(--border-hair)] bg-[var(--bg-surface)]/60 p-5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-medium uppercase tracking-wide text-[var(--gold-500)]">
                        {r.phase}
                      </span>
                      <span className="rounded-full border border-[var(--border-hair)] px-2.5 py-1 text-xs text-[var(--text-400)]">
                        {r.status}
                      </span>
                    </div>
                    <h3 className="mt-2 font-display text-lg font-semibold text-[var(--text-100)]">
                      {r.title}
                    </h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-[var(--text-400)]">{r.body}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------- */}
      {/* FAQ                                                         */}
      {/* ---------------------------------------------------------- */}
      <section id="faq" className="relative mx-auto max-w-3xl px-6 py-28">
        <motion.h2
          variants={revealUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="mb-10 font-display text-3xl font-semibold tracking-tight text-[var(--text-100)] sm:text-4xl"
        >
          Questions, answered
        </motion.h2>

        <div className="space-y-3">
          {faqs.map((f, i) => {
            const isOpen = openFaq === i;
            return (
              <motion.div
                key={f.q}
                variants={revealUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-60px" }}
                transition={{ delay: i * 0.06 }}
                className="overflow-hidden rounded-2xl border border-[var(--border-hair)] bg-[var(--bg-surface)]/60"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : i)}
                  className="flex w-full items-center justify-between px-5 py-4 text-left text-sm font-medium text-[var(--text-100)]"
                >
                  {f.q}
                  <ChevronIcon open={isOpen} />
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: easeOut }}
                    >
                      <p className="px-5 pb-5 text-sm leading-relaxed text-[var(--text-400)]">
                        {f.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
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
            Connect your wallet and make your first swap on SellCex Testnet
            — no signup, no funds at risk.
          </p>
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            className="btn-shine mt-8 rounded-xl px-8 py-3.5 text-sm font-semibold text-[#050407] shadow-[0_0_30px_-6px_rgba(240,180,41,0.6)]"
          >
            Launch App
          </motion.button>
        </motion.div>
      </section>

      {/* ---------------------------------------------------------- */}
      {/* Footer                                                      */}
      {/* ---------------------------------------------------------- */}
      <footer className="border-t border-[var(--border-hair)] px-6 pb-10 pt-16">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-10 border-b border-[var(--border-hair)] pb-10 md:grid-cols-[1.3fr_0.7fr_0.7fr_1fr]">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--gold-300)] to-[var(--gold-700)] text-xs font-bold text-[#050407]">
                  S
                </div>
                <span className="font-display text-base font-semibold text-[var(--text-100)]">
                  SellCex
                </span>
              </div>
              <p className="mt-3 max-w-xs text-sm text-[var(--text-400)]">
                Trade crypto. Own your assets. A decentralized exchange
                built on Next.js, Solidity, and Foundry.
              </p>
            </div>

            <div>
              <div className="text-xs font-medium uppercase tracking-wide text-[var(--text-600)]">
                Product
              </div>
              <div className="mt-3 flex flex-col gap-2.5 text-sm text-[var(--text-400)]">
                <a href="/swap" className="hover:text-[var(--text-100)]">Swap</a>
                <a href="/liquidity" className="hover:text-[var(--text-100)]">Liquidity</a>
                <a href="/dashboard" className="hover:text-[var(--text-100)]">Dashboard</a>
              </div>
            </div>

            <div>
              <div className="text-xs font-medium uppercase tracking-wide text-[var(--text-600)]">
                Resources
              </div>
              <div className="mt-3 flex flex-col gap-2.5 text-sm text-[var(--text-400)]">
                <a href="#" className="hover:text-[var(--text-100)]">Docs</a>
                <a href="#" className="hover:text-[var(--text-100)]">GitHub</a>
                <a href="#faq" className="hover:text-[var(--text-100)]">FAQ</a>
              </div>
            </div>

            <div>
              <div className="text-xs font-medium uppercase tracking-wide text-[var(--text-600)]">
                Stay updated
              </div>
              <div className="mt-3 flex gap-2">
                <input
                  type="email"
                  placeholder="you@wallet.eth"
                  className="w-full rounded-lg border border-[var(--border-hair)] bg-[var(--bg-surface-2)] px-3 py-2 text-sm text-[var(--text-100)] placeholder:text-[var(--text-600)] focus:outline-none focus:ring-1 focus:ring-[var(--gold-500)]"
                />
                <button className="btn-shine shrink-0 rounded-lg px-3.5 py-2 text-sm font-semibold text-[#050407]">
                  Join
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center justify-between gap-4 pt-6 sm:flex-row">
            <span className="text-xs text-[var(--text-600)]">
              © {new Date().getFullYear()} SellCex. Built on BSC Testnet.
            </span>
            <div className="flex gap-5 text-sm text-[var(--text-400)]">
              <a href="#" className="hover:text-[var(--text-100)]">Twitter</a>
              <a href="#" className="hover:text-[var(--text-100)]">Discord</a>
              <a href="#" className="hover:text-[var(--text-100)]">GitHub</a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}