"use client";

import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { routerAbi } from "@/lib/abis";
import { parseUnits } from "viem";

export function useSwapExactTokens() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  function swap(
    routerAddress: `0x${string}`,
    amountIn: number,
    minAmountOut: number,
    path: [`0x${string}`, `0x${string}`],
    to: `0x${string}`,
    deadlineMinutes: number
  ) {
    const deadline = BigInt(Math.floor(Date.now() / 1000) + deadlineMinutes * 60);
    writeContract({
      address: routerAddress,
      abi: routerAbi,
      functionName: "swapExactTokensForTokens",
      args: [
        parseUnits(amountIn.toString(), 18),
        parseUnits(minAmountOut.toFixed(18), 18),
        path,
        to,
        deadline,
      ],
    });
  }

  return { swap, hash, isPending, isConfirming, isSuccess, error };
}