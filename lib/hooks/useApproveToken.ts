"use client";

import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { erc20Abi } from "@/lib/abis";
import { maxUint256 } from "viem";

export function useApproveToken() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  function approve(tokenAddress: `0x${string}`, spender: `0x${string}`) {
    writeContract({
      address: tokenAddress,
      abi: erc20Abi,
      functionName: "approve",
      args: [spender, maxUint256],
    });
  }

  return { approve, hash, isPending, isConfirming, isSuccess, error };
}