"use client";

import { useReadContract } from "wagmi";
import { erc20Abi } from "@/lib/abis";

export function useCheckAllowance(
  tokenAddress: `0x${string}` | undefined,
  owner: `0x${string}` | undefined,
  spender: `0x${string}` | undefined
) {
  const { data, refetch } = useReadContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: "allowance",
    args: owner && spender ? [owner, spender] : undefined,
    query: { enabled: !!tokenAddress && !!owner && !!spender },
  });

 return { allowance: (data as bigint | undefined) ?? BigInt(0), refetch };
}