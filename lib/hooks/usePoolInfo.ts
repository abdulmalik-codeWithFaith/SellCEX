"use client";

import { useReadContract } from "wagmi";
import { factoryAbi, pairAbi } from "@/lib/abis";
import { formatUnits } from "viem";

const ZERO = "0x0000000000000000000000000000000000000000";

export function usePoolInfo(
  factoryAddress: `0x${string}` | undefined,
  tokenA: `0x${string}` | undefined,
  tokenB: `0x${string}` | undefined,
  account: `0x${string}` | undefined
) {
  const { data: pairData } = useReadContract({
    address: factoryAddress,
    abi: factoryAbi,
    functionName: "getPair",
    args: tokenA && tokenB ? [tokenA, tokenB] : undefined,
    query: { enabled: !!factoryAddress && !!tokenA && !!tokenB },
  });

  const pair = pairData as `0x${string}` | undefined;
  const hasPair = !!pair && pair.toLowerCase() !== ZERO;

  const { data: reservesData, refetch: refetchReserves } = useReadContract({
    address: hasPair ? pair : undefined,
    abi: pairAbi,
    functionName: "getReserves",
    query: { enabled: hasPair },
  });

  const { data: token0Data } = useReadContract({
    address: hasPair ? pair : undefined,
    abi: pairAbi,
    functionName: "token0",
    query: { enabled: hasPair },
  });

  const { data: totalSupplyData, refetch: refetchSupply } = useReadContract({
    address: hasPair ? pair : undefined,
    abi: pairAbi,
    functionName: "totalSupply",
    query: { enabled: hasPair },
  });

  const { data: userLpData, refetch: refetchUserLp } = useReadContract({
    address: hasPair ? pair : undefined,
    abi: pairAbi,
    functionName: "balanceOf",
    args: account ? [account] : undefined,
    query: { enabled: hasPair && !!account },
  });

  const reserves = reservesData as [bigint, bigint, number] | undefined;
  const token0 = token0Data as `0x${string}` | undefined;

  let reserveA = 0;
  let reserveB = 0;
  if (reserves && token0 && tokenA) {
    const [r0, r1] = reserves;
    if (token0.toLowerCase() === tokenA.toLowerCase()) {
      reserveA = Number(formatUnits(r0, 18));
      reserveB = Number(formatUnits(r1, 18));
    } else {
      reserveA = Number(formatUnits(r1, 18));
      reserveB = Number(formatUnits(r0, 18));
    }
  }

  const totalSupply = totalSupplyData ? Number(formatUnits(totalSupplyData as bigint, 18)) : 0;
  const userLp = userLpData ? Number(formatUnits(userLpData as bigint, 18)) : 0;

  function refetchAll() {
    refetchReserves();
    refetchSupply();
    refetchUserLp();
  }

  return {
    pairAddress: hasPair ? pair : undefined,
    reserveA,
    reserveB,
    totalSupply,
    userLp,
    refetchAll,
  };
}