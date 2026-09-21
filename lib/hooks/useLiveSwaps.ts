"use client";

import { useState } from "react";
import { useWatchContractEvent } from "wagmi";
import { pairAbi } from "@/lib/abis";
import { formatUnits } from "viem";

export type LiveSwap = {
  id: string;
  amountIn: string;
  tokenIn: string;
  amountOut: string;
  tokenOut: string;
  sender: string;
  hash: string;
};

function short(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

/**
 * Watches the pair's Swap event live. Same caveat as the wallet
 * activity feed: only swaps that happen while this is mounted show up
 * here — real history needs an indexer reading past blocks.
 */
export function useLiveSwaps(
  pairAddress: `0x${string}` | undefined,
  token0Symbol: string,
  token1Symbol: string
) {
  const [swaps, setSwaps] = useState<LiveSwap[]>([]);

  useWatchContractEvent({
    address: pairAddress,
    abi: pairAbi,
    eventName: "Swap",
    enabled: !!pairAddress,
    onLogs(logs) {
      logs.forEach((log: any) => {
        const { amount0In, amount1In, amount0Out, amount1Out, sender } = log.args ?? {};
        if (amount0In === undefined) return;

        const zeroForOne = (amount0In as bigint) > BigInt(0);
        const amountIn = zeroForOne ? amount0In : amount1In;
        const amountOut = zeroForOne ? amount1Out : amount0Out;
        const tokenIn = zeroForOne ? token0Symbol : token1Symbol;
        const tokenOut = zeroForOne ? token1Symbol : token0Symbol;

        setSwaps((prev) => [
          {
            id: `${log.transactionHash}-${log.logIndex}`,
            amountIn: formatUnits(amountIn as bigint, 18),
            tokenIn,
            amountOut: formatUnits(amountOut as bigint, 18),
            tokenOut,
            sender: short(sender as string),
            hash: log.transactionHash as string,
          },
          ...prev,
        ].slice(0, 8));
      });
    },
  });

  return swaps;
}