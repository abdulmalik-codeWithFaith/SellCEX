"use client";

import { useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

const easeOut = [0.16, 1, 0.3, 1] as const;

export type NavItem = { label: string; href: string };

// Used on the app pages (Swap, Liquidity, Dashboard, Wallet). The landing
// page passes its own set of in-page anchors instead — see usage notes
// below the component.
export const DEFAULT_NAV: NavItem[] = [
  { label: "Swap", href: "/swap" },
  { label: "Liquidity", href: "/liquidity" },
  { label: "Dashboard", href: "/dashboard" },
  { label: "Wallet", href: "/wallet" },
];

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

/**
 * Resolves a nav href relative to the current page. Hash anchors like
 * "#faq" only exist on the landing page's sections, so from any other
 * route they need to be rewritten to "/#faq" or the browser will just
 * do nothing. Real routes ("/swap") pass through unchanged.
 */
function resolveHref(href: string, pathname: string) {
  if (href.startsWith("#")) {
    return pathname === "/" ? href : `/${href}`;
  }
  return href;
}

export default function Header({
  navItems = DEFAULT_NAV,
  showNetworkBadge = true,
  ctaLabel = "Connect Wallet",
  onCtaClick,
}: {
  navItems?: NavItem[];
  showNetworkBadge?: boolean;
  ctaLabel?: string;
  onCtaClick?: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="fixed top-0 z-50 w-full">
      <div className="glass-panel mx-auto mt-4 flex max-w-6xl items-center justify-between rounded-2xl px-5 py-3 md:mt-6 md:px-6">
        <Link href="/" className="flex items-center gap-2">
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
        </Link>

        <nav className="hidden items-center gap-8 text-sm md:flex">
          {navItems.map((item) => {
            const href = resolveHref(item.href, pathname);
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={href}
                className={`transition-colors hover:text-[var(--text-100)] ${
                  active ? "text-[var(--text-100)]" : "text-[var(--text-400)]"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          {showNetworkBadge && (
            <span className="hidden items-center gap-1.5 rounded-full border border-[var(--border-hair)] px-3 py-1.5 text-xs text-[var(--text-400)] sm:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-[#5FD98A]" />
              BSC Testnet
            </span>
          )}
          <div className="hidden sm:block">
  <ConnectButton.Custom>
    {({ account, chain, openConnectModal, openAccountModal, openChainModal, mounted }) => {
      const ready = mounted;
      const connected = ready && account && chain;

      if (!ready) return null;

      if (!connected) {
        return (
          <button
            onClick={openConnectModal}
            className="btn-shine rounded-xl px-4 py-2 text-sm font-semibold text-[#050407] transition-transform hover:scale-[1.03] active:scale-[0.98]"
          >
            Connect Wallet
          </button>
        );
      }

      if (chain.unsupported) {
        return (
          <button
            onClick={openChainModal}
            className="rounded-xl border border-[#F1665A]/40 bg-[#F1665A]/10 px-4 py-2 text-sm font-semibold text-[#F1958A]"
          >
            Wrong network
          </button>
        );
      }

      return (
        <button
          onClick={openAccountModal}
          className="rounded-xl border border-[var(--border-hair)] px-4 py-2 text-sm font-medium text-[var(--text-100)] transition-colors hover:bg-[var(--bg-surface-2)]"
        >
          {account.displayName}
        </button>
      );
    }}
  </ConnectButton.Custom>
</div>
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
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={resolveHref(item.href, pathname)}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-lg px-3 py-2.5 transition-colors hover:bg-[var(--bg-surface-2)] hover:text-[var(--text-100)]"
                >
                  {item.label}
                </Link>
              ))}
              <button
                onClick={onCtaClick}
                className="btn-shine mt-1 rounded-xl px-4 py-2.5 text-sm font-semibold text-[#050407]"
              >
                {ctaLabel}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}