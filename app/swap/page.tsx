"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAccount } from "wagmi";
import { useSwapExactTokens } from "@/lib/hooks/useSwapExactTokens";
import { motion, AnimatePresence } from "framer-motion";
import Header from "@/components/Header";
import { CONTRACTS } from "@/lib/contracts";
import { useTokenBalance } from "@/lib/hooks/useTokenBalance";
import { useSwapQuote } from "@/lib/hooks/useSwapQuote";
import { useCheckAllowance } from "@/lib/hooks/useCheckAllowance";
import { useApproveToken } from "@/lib/hooks/useApproveToken";

/* ------------------------------------------------------------------ */
/*  Mock data — swap this for real wagmi/viem reads once contracts    */
/*  are deployed. Shape is chosen to make that swap-in painless:      */
/*  balance/price are the only fields that become live reads.         */
/* ------------------------------------------------------------------ */

type Token = {
  symbol: string;
  name: string;
  balance: number;
  price: number; // USD, mock
  color: string; // used for the token badge gradient
};

const TOKENS: Token[] = [
  { symbol: "USDT", name: "Tether USD", balance: 1250.0, price: 1, color: "from-[#26A17B] to-[#1a7a5a]" },
  { symbol: "SELL", name: "SellCex Token", balance: 0, price: 0.0842, color: "from-[var(--gold-300)] to-[var(--gold-700)]" },
  { symbol: "BNB", name: "BNB", balance: 2.4, price: 589.42, color: "from-[#F0B90B] to-[#a87e05]" },
  { symbol: "ETH", name: "Ethereum", balance: 0.85, price: 3104.1, color: "from-[#627EEA] to-[#3b4d94]" },
  { symbol: "WBTC", name: "Wrapped BTC", balance: 0.04, price: 61920.55, color: "from-[#F7931A] to-[#a5620d]" },
  { symbol: "USDC", name: "USD Coin", balance: 640.2, price: 1.0001, color: "from-[#2775CA] to-[#164a83]" },
  { symbol: "CAKE", name: "PancakeSwap", balance: 18.6, price: 2.31, color: "from-[#D1884F] to-[#8c5a32]" },
];

const easeOut = [0.16, 1, 0.3, 1] as const;
const SLIPPAGE_PRESETS = [0.1, 0.5, 1.0];
const ALREADY_APPROVED = new Set(["USDT", "BNB"]); // mock: pretend these already have allowance

function formatNumber(n: number, decimals = 4) {
  if (!isFinite(n) || n === 0) return "0";
  return n.toLocaleString(undefined, { maximumFractionDigits: decimals });
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
/*  Icons                                                              */
/* ------------------------------------------------------------------ */

function IconSwapDirection() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M7 4v13M7 17l-3.5-3.5M7 17l3.5-3.5M17 20V7M17 7l3.5 3.5M17 7l-3.5 3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconChevronDown() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconSettings() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 2.5v2M12 19.5v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2.5 12h2M19.5 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
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
function IconSearch() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
      <path d="M21 21l-4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
function IconArrowLeft() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M19 12H5M11 6l-6 6 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
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
/*  Token select modal                                                 */
/* ------------------------------------------------------------------ */

function TokenModal({
  exclude,
  onPick,
  onClose,
}: {
  exclude: string;
  onPick: (t: Token) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const filtered = TOKENS.filter(
    (t) =>
      t.symbol !== exclude &&
      (t.symbol.toLowerCase().includes(query.toLowerCase()) ||
        t.name.toLowerCase().includes(query.toLowerCase()))
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-[70] flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center"
    >
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.97 }}
        transition={{ duration: 0.25, ease: easeOut }}
        onClick={(e) => e.stopPropagation()}
        className="glass-panel w-full max-w-sm rounded-t-3xl border border-[var(--border-hair)] p-5 sm:rounded-3xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold text-[var(--text-100)]">
            Select a token
          </h3>
          <button onClick={onClose} className="text-[var(--text-400)] hover:text-[var(--text-100)]">
            <IconClose />
          </button>
        </div>

        <div className="mb-3 flex items-center gap-2 rounded-xl border border-[var(--border-hair)] bg-[var(--bg-surface-2)] px-3 py-2.5">
          <span className="text-[var(--text-600)]">
            <IconSearch />
          </span>
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name or symbol"
            className="w-full bg-transparent text-sm text-[var(--text-100)] placeholder:text-[var(--text-600)] focus:outline-none"
          />
        </div>

        <div className="max-h-72 space-y-1 overflow-y-auto">
          {filtered.length === 0 && (
            <p className="py-6 text-center text-sm text-[var(--text-600)]">No tokens found</p>
          )}
          {filtered.map((t) => (
            <button
              key={t.symbol}
              onClick={() => onPick(t)}
              className="flex w-full items-center justify-between rounded-xl px-2.5 py-2.5 text-left transition-colors hover:bg-[var(--bg-surface-2)]"
            >
              <div className="flex items-center gap-3">
                <TokenBadge token={t} />
                <div>
                  <div className="text-sm font-medium text-[var(--text-100)]">{t.symbol}</div>
                  <div className="text-xs text-[var(--text-600)]">{t.name}</div>
                </div>
              </div>
              <div className="text-sm text-[var(--text-400)]">{formatNumber(t.balance, 4)}</div>
            </button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Slippage settings popover                                          */
/* ------------------------------------------------------------------ */

function SlippagePopover({
  slippage,
  setSlippage,
  deadline,
  setDeadline,
  onClose,
}: {
  slippage: number;
  setSlippage: (n: number) => void;
  deadline: number;
  setDeadline: (n: number) => void;
  onClose: () => void;
}) {
  const [custom, setCustom] = useState("");

  return (
    <motion.div
      initial={{ opacity: 0, y: -8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.97 }}
      transition={{ duration: 0.18 }}
      className="glass-panel absolute right-0 top-11 z-20 w-72 rounded-2xl border border-[var(--border-hair)] p-4"
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-medium text-[var(--text-100)]">Transaction settings</span>
        <button onClick={onClose} className="text-[var(--text-400)] hover:text-[var(--text-100)]">
          <IconClose />
        </button>
      </div>

      <div className="text-xs text-[var(--text-600)]">Slippage tolerance</div>
      <div className="mt-2 flex gap-2">
        {SLIPPAGE_PRESETS.map((p) => (
          <button
            key={p}
            onClick={() => {
              setSlippage(p);
              setCustom("");
            }}
            className={`flex-1 rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors ${
              slippage === p && custom === ""
                ? "border-[var(--gold-500)] bg-[var(--gold-500)]/10 text-[var(--gold-300)]"
                : "border-[var(--border-hair)] text-[var(--text-400)] hover:text-[var(--text-100)]"
            }`}
          >
            {p}%
          </button>
        ))}
        <div className="flex flex-1 items-center rounded-lg border border-[var(--border-hair)] px-2">
          <input
            value={custom}
            onChange={(e) => {
              const v = e.target.value.replace(/[^0-9.]/g, "");
              setCustom(v);
              const n = parseFloat(v);
              if (!isNaN(n) && n > 0 && n <= 50) setSlippage(n);
            }}
            placeholder="Custom"
            className="w-full bg-transparent py-1.5 text-xs text-[var(--text-100)] placeholder:text-[var(--text-600)] focus:outline-none"
          />
          <span className="text-xs text-[var(--text-600)]">%</span>
        </div>
      </div>
      {slippage > 5 && (
        <p className="mt-2 text-xs text-[#F1B15A]">High slippage — your trade may be frontrun.</p>
      )}

      <div className="mt-4 text-xs text-[var(--text-600)]">Transaction deadline</div>
      <div className="mt-2 flex items-center gap-2">
        <input
          type="number"
          min={1}
          value={deadline}
          onChange={(e) => setDeadline(Math.max(1, parseInt(e.target.value) || 1))}
          className="w-20 rounded-lg border border-[var(--border-hair)] bg-[var(--bg-surface-2)] px-2.5 py-1.5 text-xs text-[var(--text-100)] focus:outline-none"
        />
        <span className="text-xs text-[var(--text-600)]">minutes</span>
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Swap status modal — approve / confirm / pending / success          */
/* ------------------------------------------------------------------ */

type TxStage = "review" | "approving" | "pending" | "success";

function TxModal({
  stage,
  sell,
  buy,
  sellAmount,
  buyAmount,
  minReceived,
  rateLabel,
  txHash,
  onConfirm,
  onClose,
}: {
  stage: TxStage;
  sell: Token;
  buy: Token;
  sellAmount: string;
  buyAmount: string;
  minReceived: string;
  rateLabel: string;
  txHash: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={stage === "review" ? onClose : undefined}
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
        {stage === "review" && (
          <>
            <div className="mb-5 flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold text-[var(--text-100)]">Confirm swap</h3>
              <button onClick={onClose} className="text-[var(--text-400)] hover:text-[var(--text-100)]">
                <IconClose />
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between rounded-xl border border-[var(--border-hair)] bg-[var(--bg-surface-2)] p-3.5">
                <div className="flex items-center gap-2.5">
                  <TokenBadge token={sell} />
                  <span className="text-sm text-[var(--text-100)]">{sell.symbol}</span>
                </div>
                <span className="font-display text-base text-[var(--text-100)]">{sellAmount}</span>
              </div>
              <div className="mx-auto flex h-7 w-7 items-center justify-center text-[var(--gold-500)]">
                <IconSwapDirection />
              </div>
              <div className="flex items-center justify-between rounded-xl border border-[var(--border-hair)] bg-[var(--bg-surface-2)] p-3.5">
                <div className="flex items-center gap-2.5">
                  <TokenBadge token={buy} />
                  <span className="text-sm text-[var(--text-100)]">{buy.symbol}</span>
                </div>
                <span className="font-display text-base text-[var(--text-100)]">{buyAmount}</span>
              </div>
            </div>

            <div className="mt-4 space-y-1.5 rounded-xl bg-[var(--bg-surface-2)] p-3.5 text-xs text-[var(--text-600)]">
              <div className="flex justify-between">
                <span>Rate</span>
                <span className="text-[var(--text-400)]">{rateLabel}</span>
              </div>
              <div className="flex justify-between">
                <span>Minimum received</span>
                <span className="text-[var(--text-400)]">{minReceived} {buy.symbol}</span>
              </div>
              <div className="flex justify-between">
                <span>Network fee (est.)</span>
                <span className="text-[var(--text-400)]">~0.0004 BNB</span>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.015 }}
              whileTap={{ scale: 0.98 }}
              onClick={onConfirm}
              className="btn-shine mt-5 w-full rounded-xl py-3.5 text-sm font-semibold text-[#050407]"
            >
              Confirm swap
            </motion.button>
          </>
        )}

        {(stage === "approving" || stage === "pending") && (
          <div className="flex flex-col items-center py-6 text-center">
            <Spinner size={44} />
            <h3 className="mt-5 font-display text-lg font-semibold text-[var(--text-100)]">
              {stage === "approving" ? `Approving ${sell.symbol}` : "Confirming swap"}
            </h3>
            <p className="mt-2 max-w-[240px] text-sm text-[var(--text-400)]">
              {stage === "approving"
                ? "Waiting for the approval transaction to be mined."
                : "Waiting for your wallet to confirm and the transaction to be mined."}
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
              Swap confirmed
            </h3>
            <p className="mt-2 text-sm text-[var(--text-400)]">
              Swapped {sellAmount} {sell.symbol} for {buyAmount} {buy.symbol}
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

type RecentTx = { sell: string; buy: string; sellAmt: string; buyAmt: string; hash: string; time: string };

export default function SwapPage() {
  const [sell, setSell] = useState<Token>(TOKENS[0]); // USDT
  const [buy, setBuy] = useState<Token>(TOKENS[1]); // SELL
  const [sellAmount, setSellAmount] = useState("500");
  const [modalSide, setModalSide] = useState<"sell" | "buy" | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [slippage, setSlippage] = useState(0.5);
  const [deadline, setDeadline] = useState(20);
  const [txStage, setTxStage] = useState<TxStage | null>(null);
  const [txHash, setTxHash] = useState("");
  const [approved, setApproved] = useState<Set<string>>(new Set(ALREADY_APPROVED));
  const [recent, setRecent] = useState<RecentTx[]>([]);
  const settingsRef = useRef<HTMLDivElement>(null);

  const { address } = useAccount();
  const sellTokenAddress = sell.symbol === "USDT" ? CONTRACTS.anvil.usdt : CONTRACTS.anvil.sell;
  const buyTokenAddress = buy.symbol === "USDT" ? CONTRACTS.anvil.usdt : CONTRACTS.anvil.sell;

  const sellBalance = useTokenBalance(sellTokenAddress as `0x${string}`, address);
  const buyBalance = useTokenBalance(buyTokenAddress as `0x${string}`, address);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setShowSettings(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const amountNum = parseFloat(sellAmount) || 0;

  const isRealPair =
    (sell.symbol === "USDT" || sell.symbol === "SELL") &&
    (buy.symbol === "USDT" || buy.symbol === "SELL");

  const realQuote = useSwapQuote(
    isRealPair ? (CONTRACTS.anvil.router as `0x${string}`) : undefined,
    isRealPair ? [sellTokenAddress as `0x${string}`, buyTokenAddress as `0x${string}`] : undefined,
    amountNum
  );

  const { allowance, refetch: refetchAllowance } = useCheckAllowance(
    isRealPair ? (sellTokenAddress as `0x${string}`) : undefined,
    address,
    isRealPair ? (CONTRACTS.anvil.router as `0x${string}`) : undefined
  );

  const approveToken = useApproveToken();
  const swapExecutor = useSwapExactTokens();
  useEffect(() => {
  if (swapExecutor.isSuccess) {
    setTxHash(swapExecutor.hash ?? "");
    setRecent((prev) => [
      {
        sell: sell.symbol,
        buy: buy.symbol,
        sellAmt: formatNumber(amountNum, 4),
        buyAmt: formatNumber(buyAmount, 4),
        hash: swapExecutor.hash ?? "",
        time: "just now",
      },
      ...prev,
    ].slice(0, 5));
    setTxStage("success");
    sellBalance.refetch();
    buyBalance.refetch();
    refetchAllowance();
  }
}, [swapExecutor.isSuccess]);

  useEffect(() => {
    if (approveToken.isSuccess) {
      refetchAllowance();
      setTxStage(null);
    }
  }, [approveToken.isSuccess]);

  // Real quote from the Router when both sides have deployed contracts;
  // falls back to illustrative mock math for tokens without one yet
  // (BNB, ETH, WBTC, USDC, CAKE — no test-token contracts deployed).
  const { buyAmount, rate, priceImpact, minReceived } = useMemo(() => {
    if (isRealPair) {
      const min = realQuote.buyAmount * (1 - slippage / 100);
      const impactPct = amountNum > 0 ? Math.max(0, (1 - realQuote.rate / (realQuote.rate || 1)) * 100) : 0;
      return { buyAmount: realQuote.buyAmount, rate: realQuote.rate, priceImpact: impactPct, minReceived: min };
    }

    const raw = (amountNum * sell.price) / buy.price;
    const notional = amountNum * sell.price;
    const impactPct = Math.min(0.05 + (notional / 20000) * 1.2, 9);
    const out = raw * (1 - impactPct / 100);
    const min = out * (1 - slippage / 100);
    return { buyAmount: out, rate: sell.price / buy.price, priceImpact: impactPct, minReceived: min };
  }, [amountNum, sell, buy, slippage, isRealPair, realQuote.buyAmount, realQuote.rate]);

  const amountInWei = amountNum > 0 ? BigInt(Math.floor(amountNum * 1e18)) : BigInt(0);
  const needsApproval = isRealPair
    ? amountNum > 0 && allowance < amountInWei
    : amountNum > 0 && !approved.has(sell.symbol);
  const insufficientBalance = amountNum > sellBalance.balance;

  function pickToken(side: "sell" | "buy", token: Token) {
    if (side === "sell") {
      if (token.symbol === buy.symbol) setBuy(sell);
      setSell(token);
    } else {
      if (token.symbol === sell.symbol) setSell(buy);
      setBuy(token);
    }
    setModalSide(null);
  }

  function flip() {
    setSell(buy);
    setBuy(sell);
    setSellAmount(buyAmount > 0 ? buyAmount.toFixed(6) : "");
  }

  function startApprove() {
    if (isRealPair) {
      setTxStage("approving");
      approveToken.approve(sellTokenAddress as `0x${string}`, CONTRACTS.anvil.router as `0x${string}`);
    } else {
      setTxStage("approving");
      setTimeout(() => {
        setApproved((prev) => new Set(prev).add(sell.symbol));
        setTxStage(null);
      }, 1600);
    }
  }

  function openReview() {
    setTxStage("review");
  }

  // NOTE: still simulated — Stage 3 (real swap execution via
  // swapExactTokensForTokens) hasn't been wired in yet. Approve is real;
  // this confirm step is the next thing to replace.
 function confirmSwap() {
  if (isRealPair) {
    setTxStage("pending");
    swapExecutor.swap(
      CONTRACTS.anvil.router as `0x${string}`,
      amountNum,
      minReceived,
      [sellTokenAddress as `0x${string}`, buyTokenAddress as `0x${string}`],
      address as `0x${string}`,
      deadline
    );
  } else {
    // Fallback simulated flow for placeholder tokens without real contracts
    setTxStage("pending");
    setTimeout(() => {
      const hash = shortHash();
      setTxHash(hash);
      setRecent((prev) => [
        {
          sell: sell.symbol,
          buy: buy.symbol,
          sellAmt: formatNumber(amountNum, 4),
          buyAmt: formatNumber(buyAmount, 4),
          hash,
          time: "just now",
        },
        ...prev,
      ].slice(0, 5));
      setTxStage("success");
    }, 1800);
  }
}

  function closeTxModal() {
    if (txStage === "success") setSellAmount("");
    setTxStage(null);
  }

  const canSwap = amountNum > 0 && !insufficientBalance && !needsApproval;

  return (
    <main className="relative min-h-screen bg-[var(--bg)] pb-24">
      {/* background */}
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

      {/* swap card */}
      <section className="mx-auto flex max-w-md flex-col items-center px-5 pt-36">
        <div className="mb-5 flex w-full items-center justify-between">
          <a href="/" className="flex items-center gap-1.5 text-sm text-[var(--text-400)] hover:text-[var(--text-100)]">
            <IconArrowLeft />
            Back
          </a>
          <h1 className="font-display text-xl font-semibold text-[var(--text-100)]">Swap</h1>
          <div className="relative" ref={settingsRef}>
            <button
              onClick={() => setShowSettings((v) => !v)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border-hair)] text-[var(--text-400)] transition-colors hover:text-[var(--text-100)]"
            >
              <IconSettings />
            </button>
            <AnimatePresence>
              {showSettings && (
                <SlippagePopover
                  slippage={slippage}
                  setSlippage={setSlippage}
                  deadline={deadline}
                  setDeadline={setDeadline}
                  onClose={() => setShowSettings(false)}
                />
              )}
            </AnimatePresence>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: easeOut }}
          className="glass-panel w-full rounded-3xl p-4 shadow-[0_20px_80px_-20px_rgba(0,0,0,0.7)]"
        >
          {/* Sell */}
          <div className="rounded-2xl border border-[var(--border-hair)] bg-[var(--bg-surface-2)] p-4">
            <div className="mb-2 flex justify-between text-xs text-[var(--text-600)]">
              <span>You pay</span>
              <button
                onClick={() => setSellAmount(String(sellBalance.balance))}
                className="hover:text-[var(--gold-500)]"
              >
                Balance: {formatNumber(sellBalance.balance, 4)}
                <span className="ml-1 text-[var(--gold-500)]">MAX</span>
              </button>
            </div>
            <div className="flex items-center justify-between gap-3">
              <input
                value={sellAmount}
                onChange={(e) => setSellAmount(e.target.value.replace(/[^0-9.]/g, ""))}
                placeholder="0.0"
                inputMode="decimal"
                className="w-full bg-transparent font-display text-3xl text-[var(--text-100)] placeholder:text-[var(--text-600)] focus:outline-none"
              />
              <button
                onClick={() => setModalSide("sell")}
                className="flex shrink-0 items-center gap-1.5 rounded-full bg-[var(--bg-surface)] py-1.5 pl-1.5 pr-3 transition-colors hover:bg-[var(--bg)]"
              >
                <TokenBadge token={sell} />
                <span className="text-sm font-medium text-[var(--text-100)]">{sell.symbol}</span>
                <span className="text-[var(--text-600)]"><IconChevronDown /></span>
              </button>
            </div>
            {amountNum > 0 && (
              <div className="mt-1 text-xs text-[var(--text-600)]">
                ≈ ${formatNumber(amountNum * sell.price, 2)}
              </div>
            )}
          </div>

          {/* Flip */}
          <div className="relative z-10 mx-auto -my-3.5 flex h-9 w-9 items-center justify-center">
            <motion.button
              whileHover={{ scale: 1.08, rotate: 180 }}
              whileTap={{ scale: 0.92 }}
              onClick={flip}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border-hair)] bg-[var(--bg-surface)] text-[var(--gold-500)]"
            >
              <IconSwapDirection />
            </motion.button>
          </div>

          {/* Buy */}
          <div className="rounded-2xl border border-[var(--border-hair)] bg-[var(--bg-surface-2)] p-4">
            <div className="mb-2 flex justify-between text-xs text-[var(--text-600)]">
              <span>You receive</span>
              <span>Balance: {formatNumber(buyBalance.balance, 4)}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="font-display text-3xl text-[var(--text-100)]">
                {amountNum > 0 ? formatNumber(buyAmount, 6) : "0.0"}
              </span>
              <button
                onClick={() => setModalSide("buy")}
                className="flex shrink-0 items-center gap-1.5 rounded-full bg-[var(--bg-surface)] py-1.5 pl-1.5 pr-3 transition-colors hover:bg-[var(--bg)]"
              >
                <TokenBadge token={buy} />
                <span className="text-sm font-medium text-[var(--text-100)]">{buy.symbol}</span>
                <span className="text-[var(--text-600)]"><IconChevronDown /></span>
              </button>
            </div>
            {amountNum > 0 && (
              <div className="mt-1 text-xs text-[var(--text-600)]">
                ≈ ${formatNumber(buyAmount * buy.price, 2)}
              </div>
            )}
          </div>

          {/* Rate + details */}
          {amountNum > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-3 space-y-1.5 overflow-hidden rounded-xl bg-[var(--bg-surface-2)]/60 p-3.5 text-xs text-[var(--text-600)]"
            >
              <div className="flex justify-between">
                <span>Rate</span>
                <span className="text-[var(--text-400)]">
                  1 {sell.symbol} = {formatNumber(rate, 6)} {buy.symbol}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Price impact</span>
                <span className={priceImpact > 3 ? "text-[#F1B15A]" : "text-[var(--text-400)]"}>
                  {priceImpact.toFixed(2)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span>Minimum received</span>
                <span className="text-[var(--text-400)]">
                  {formatNumber(minReceived, 6)} {buy.symbol}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Slippage tolerance</span>
                <span className="text-[var(--text-400)]">{slippage}%</span>
              </div>
            </motion.div>
          )}

          {/* Action button */}
          <div className="mt-4">
            {insufficientBalance ? (
              <button
                disabled
                className="w-full cursor-not-allowed rounded-xl border border-[var(--border-hair)] py-3.5 text-sm font-semibold text-[var(--text-600)]"
              >
                Insufficient {sell.symbol} balance
              </button>
            ) : needsApproval ? (
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={startApprove}
                className="w-full rounded-xl border border-[var(--gold-500)]/50 bg-[var(--gold-500)]/10 py-3.5 text-sm font-semibold text-[var(--gold-300)]"
              >
                Approve {sell.symbol}
              </motion.button>
            ) : (
              <motion.button
                whileHover={canSwap ? { scale: 1.01 } : {}}
                whileTap={canSwap ? { scale: 0.98 } : {}}
                disabled={!canSwap}
                onClick={openReview}
                className={`btn-shine w-full rounded-xl py-3.5 text-sm font-semibold text-[#050407] ${
                  !canSwap ? "cursor-not-allowed opacity-40" : ""
                }`}
              >
                {amountNum > 0 ? "Swap" : "Enter an amount"}
              </motion.button>
            )}
          </div>
        </motion.div>

        {/* Recent swaps */}
        {recent.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 w-full rounded-2xl border border-[var(--border-hair)] bg-[var(--bg-surface)]/60 p-4"
          >
            <div className="mb-3 text-xs font-medium uppercase tracking-wide text-[var(--text-600)]">
              Recent transactions
            </div>
            <div className="space-y-3">
              {recent.map((tx, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <div className="text-[var(--text-100)]">
                    {tx.sellAmt} {tx.sell} <span className="text-[var(--text-600)]">→</span> {tx.buyAmt} {tx.buy}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[var(--text-600)]">
                    <span className="rounded-full bg-[#5FD98A]/15 px-2 py-0.5 text-[#5FD98A]">Success</span>
                    <span>{tx.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </section>

      {/* Modals */}
      <AnimatePresence>
        {modalSide && (
          <TokenModal
            exclude={modalSide === "sell" ? buy.symbol : sell.symbol}
            onPick={(t) => pickToken(modalSide, t)}
            onClose={() => setModalSide(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {txStage && (
          <TxModal
            stage={txStage}
            sell={sell}
            buy={buy}
            sellAmount={formatNumber(amountNum, 4)}
            buyAmount={formatNumber(buyAmount, 6)}
            minReceived={formatNumber(minReceived, 6)}
            rateLabel={`1 ${sell.symbol} = ${formatNumber(rate, 6)} ${buy.symbol}`}
            txHash={txHash}
            onConfirm={confirmSwap}
            onClose={closeTxModal}
          />
        )}
      </AnimatePresence>
    </main>
  );
}