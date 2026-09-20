"use client";

import { useReadContract } from "wagmi";
import { erc20Abi } from "@/lib/abis";
import { formatUnits } from "viem";

export function useTokenBalance(tokenAddress: `0x${string}` | undefined, account: `0x${string}` | undefined) {
  const { data, isLoading, refetch } = useReadContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: account ? [account] : undefined,
    query: {
      enabled: !!tokenAddress && !!account,
    },
  });

  const balance = data ? Number(formatUnits(data as bigint, 18)) : 0;

  return { balance, raw: data as bigint | undefined, isLoading, refetch };
}