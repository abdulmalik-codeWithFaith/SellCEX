"use client";

import { useReadContract } from "wagmi";
import { routerAbi } from "@/lib/abis";
import { parseUnits, formatUnits } from "viem";

export function useSwapQuote(
  routerAddress: `0x${string}` | undefined,
  path: [`0x${string}`, `0x${string}`] | undefined,
  amountIn: number
) {
  const amountInWei = amountIn > 0 ? parseUnits(amountIn.toString(), 18) : undefined;

  const { data, isLoading, isError } = useReadContract({
    address: routerAddress,
    abi: routerAbi,
    functionName: "getAmountsOut",
    args: amountInWei && path ? [amountInWei, path] : undefined,
    query: {
      enabled: !!routerAddress && !!path && !!amountInWei,
    },
  });

  // getAmountsOut returns uint256[] — for a single-hop path that's
  // [amountIn, amountOut], so index 1 is what we actually want.
  const amounts = data as bigint[] | undefined;
  const buyAmount = amounts && amounts.length > 1 ? Number(formatUnits(amounts[1], 18)) : 0;
  const rate = amountIn > 0 && buyAmount > 0 ? buyAmount / amountIn : 0;

  return { buyAmount, rate, isLoading, isError };
}