"use client";

import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { routerAbi } from "@/lib/abis";
import { parseUnits } from "viem";

export function useRemoveLiquidity() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  function removeLiquidity(
    routerAddress: `0x${string}`,
    tokenA: `0x${string}`,
    tokenB: `0x${string}`,
    liquidity: number,
    minAmountA: number,
    minAmountB: number,
    to: `0x${string}`,
    deadlineMinutes: number
  ) {
    const deadline = BigInt(Math.floor(Date.now() / 1000) + deadlineMinutes * 60);
    writeContract({
      address: routerAddress,
      abi: routerAbi,
      functionName: "removeLiquidity",
      args: [
        tokenA,
        tokenB,
        parseUnits(liquidity.toString(), 18),
        parseUnits(minAmountA.toFixed(18), 18),
        parseUnits(minAmountB.toFixed(18), 18),
        to,
        deadline,
      ],
    });
  }

  return { removeLiquidity, hash, isPending, isConfirming, isSuccess, error };
}