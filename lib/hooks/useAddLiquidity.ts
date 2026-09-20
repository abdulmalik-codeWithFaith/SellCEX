"use client";

import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { routerAbi } from "@/lib/abis";
import { parseUnits } from "viem";

export function useAddLiquidity() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  function addLiquidity(
    routerAddress: `0x${string}`,
    tokenA: `0x${string}`,
    tokenB: `0x${string}`,
    amountA: number,
    amountB: number,
    slippagePct: number,
    to: `0x${string}`,
    deadlineMinutes: number
  ) {
    const deadline = BigInt(Math.floor(Date.now() / 1000) + deadlineMinutes * 60);
    const amountAWei = parseUnits(amountA.toString(), 18);
    const amountBWei = parseUnits(amountB.toString(), 18);
    const amountAMin = parseUnits((amountA * (1 - slippagePct / 100)).toFixed(18), 18);
    const amountBMin = parseUnits((amountB * (1 - slippagePct / 100)).toFixed(18), 18);

    writeContract({
      address: routerAddress,
      abi: routerAbi,
      functionName: "addLiquidity",
      args: [tokenA, tokenB, amountAWei, amountBWei, amountAMin, amountBMin, to, deadline],
    });
  }

  return { addLiquidity, hash, isPending, isConfirming, isSuccess, error };
}