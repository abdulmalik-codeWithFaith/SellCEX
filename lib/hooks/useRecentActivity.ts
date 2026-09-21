"use client";

import { useState } from "react";
import { useWatchContractEvent } from "wagmi";
import { erc20Abi } from "@/lib/abis";
import { formatUnits } from "viem";

export type ActivityItem = {
  id: string;
  type: "sent" | "received";
  tokenSymbol: string;
  amount: string;
  counterparty: string;
  hash: string;
  time: string;
};

function short(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

/**
 * Watches live Transfer events on the given tokens, filtered to ones
 * involving `account`. This only catches transfers that happen WHILE
 * this hook is mounted — it's a real-time feed, not transaction
 * history. Getting full history requires an indexer reading past
 * blocks (the Supabase piece from the original architecture plan),
 * which isn't wired up yet.
 */
export function useRecentActivity(
  tokens: { address: `0x${string}`; symbol: string }[],
  account: `0x${string}` | undefined
) {
  const [activity, setActivity] = useState<ActivityItem[]>([]);

  tokens.forEach((token) => {
    useWatchContractEvent({
      address: token.address,
      abi: erc20Abi,
      eventName: "Transfer",
      enabled: !!account,
      onLogs(logs) {
        logs.forEach((log: any) => {
          const { from, to, value } = log.args ?? {};
          if (!account || !from || !to) return;
          const involvesUser =
            from.toLowerCase() === account.toLowerCase() || to.toLowerCase() === account.toLowerCase();
          if (!involvesUser) return;

          const isSent = from.toLowerCase() === account.toLowerCase();
          setActivity((prev) => [
            {
              id: `${log.transactionHash}-${log.logIndex}`,
              type: (isSent ? "sent" : "received") as ActivityItem["type"],
              tokenSymbol: token.symbol,
              amount: formatUnits(value as bigint, 18),
              counterparty: short(isSent ? to : from),
              hash: log.transactionHash as string,
              time: "just now",
            },
            ...prev,
          ].slice(0, 10));
        });
      },
    });
  });

  return activity;
}