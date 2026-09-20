import type { Metadata } from "next";
import { Inter, Bricolage_Grotesque } from "next/font/google";
import Web3Provider from "@/components/Web3Provider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "SellCex — Trade Crypto. Own Your Assets.",
  description:
    "SellCex is a decentralized exchange for swapping tokens, providing liquidity, and managing crypto directly on-chain. No custodians, no middlemen — just your wallet and the protocol.",
  keywords: [
    "SellCex",
    "DEX",
    "decentralized exchange",
    "crypto swap",
    "liquidity pools",
    "Web3",
    "DeFi",
  ],
  openGraph: {
    title: "SellCex — Trade Crypto. Own Your Assets.",
    description:
      "Swap tokens, provide liquidity, and manage crypto directly on-chain.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${bricolage.variable}`}>
      <body><Web3Provider>{children}</Web3Provider></body>
    </html>
  );
}