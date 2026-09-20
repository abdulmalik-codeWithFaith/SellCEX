// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ISellCexFactory} from "../../interfaces/ISellCexFactory.sol";
import {ISellCexPair} from "../../interfaces/ISellCexPair.sol";

/// @title SellCexLibrary
/// @notice Pure pricing/quoting math shared by the Router. Nothing here
///         touches storage or makes state-changing calls — it's the same
///         constant-product formula the Pair enforces on-chain, just
///         computed ahead of time so the Router (and off-chain quoting,
///         e.g. the frontend) can know the expected output before sending
///         a transaction.
library SellCexLibrary {
    /// @dev Deterministic ordering, same rule the Factory uses.
    function sortTokens(address tokenA, address tokenB) internal pure returns (address token0, address token1) {
        require(tokenA != tokenB, "SellCexLibrary: IDENTICAL_ADDRESSES");
        (token0, token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        require(token0 != address(0), "SellCexLibrary: ZERO_ADDRESS");
    }

    /// @notice Reads a pair's reserves from the Factory's live mapping,
    ///         then returns them ordered to match (tokenA, tokenB) as the
    ///         caller passed them in — regardless of the pair's internal
    ///         token0/token1 order.
    function getReserves(address factory, address tokenA, address tokenB)
        internal
        view
        returns (uint256 reserveA, uint256 reserveB)
    {
        (address token0,) = sortTokens(tokenA, tokenB);
        address pair = ISellCexFactory(factory).getPair(tokenA, tokenB);
        (uint112 reserve0, uint112 reserve1) = ISellCexPair(pair).getReserves();
        (reserveA, reserveB) = tokenA == token0 ? (reserve0, reserve1) : (reserve1, reserve0);
    }

    /// @notice Given some amount of tokenA, how much of tokenB is
    ///         needed to deposit at the pool's current ratio.
    function quote(uint256 amountA, uint256 reserveA, uint256 reserveB) internal pure returns (uint256 amountB) {
        require(amountA > 0, "SellCexLibrary: INSUFFICIENT_AMOUNT");
        require(reserveA > 0 && reserveB > 0, "SellCexLibrary: INSUFFICIENT_LIQUIDITY");
        amountB = (amountA * reserveB) / reserveA;
    }

    /// @notice The core AMM pricing formula: given an exact input amount,
    ///         how much output the pool will pay out, net of the 0.3% fee.
    ///         This mirrors exactly what SellCexPair.swap()'s K-invariant
    ///         check enforces — if this function says X, the Pair will
    ///         accept a swap requesting X.
    function getAmountOut(uint256 amountIn, uint256 reserveIn, uint256 reserveOut)
        internal
        pure
        returns (uint256 amountOut)
    {
        require(amountIn > 0, "SellCexLibrary: INSUFFICIENT_INPUT_AMOUNT");
        require(reserveIn > 0 && reserveOut > 0, "SellCexLibrary: INSUFFICIENT_LIQUIDITY");
        uint256 amountInWithFee = amountIn * 997;
        uint256 numerator = amountInWithFee * reserveOut;
        uint256 denominator = (reserveIn * 1000) + amountInWithFee;
        amountOut = numerator / denominator;
    }

    /// @notice The inverse: given a desired exact output amount, how much
    ///         input is required. Used for swapTokensForExactTokens.
    function getAmountIn(uint256 amountOut, uint256 reserveIn, uint256 reserveOut)
        internal
        pure
        returns (uint256 amountIn)
    {
        require(amountOut > 0, "SellCexLibrary: INSUFFICIENT_OUTPUT_AMOUNT");
        require(reserveIn > 0 && reserveOut > 0, "SellCexLibrary: INSUFFICIENT_LIQUIDITY");
        uint256 numerator = reserveIn * amountOut * 1000;
        uint256 denominator = (reserveOut - amountOut) * 997;
        amountIn = (numerator / denominator) + 1;
    }

    /// @notice Chains getAmountOut across a multi-hop path, e.g.
    ///         [SELL, USDT, BNB] — quotes SELL→USDT, then feeds that
    ///         output back in as input for USDT→BNB.
    function getAmountsOut(address factory, uint256 amountIn, address[] memory path)
        internal
        view
        returns (uint256[] memory amounts)
    {
        require(path.length >= 2, "SellCexLibrary: INVALID_PATH");
        amounts = new uint256[](path.length);
        amounts[0] = amountIn;
        for (uint256 i; i < path.length - 1; i++) {
            (uint256 reserveIn, uint256 reserveOut) = getReserves(factory, path[i], path[i + 1]);
            amounts[i + 1] = getAmountOut(amounts[i], reserveIn, reserveOut);
        }
    }

    /// @notice Same idea as getAmountsOut but working backward from a
    ///         desired final output — used for swapTokensForExactTokens
    ///         with a multi-hop path.
    function getAmountsIn(address factory, uint256 amountOut, address[] memory path)
        internal
        view
        returns (uint256[] memory amounts)
    {
        require(path.length >= 2, "SellCexLibrary: INVALID_PATH");
        amounts = new uint256[](path.length);
        amounts[amounts.length - 1] = amountOut;
        for (uint256 i = path.length - 1; i > 0; i--) {
            (uint256 reserveIn, uint256 reserveOut) = getReserves(factory, path[i - 1], path[i]);
            amounts[i - 1] = getAmountIn(amounts[i], reserveIn, reserveOut);
        }
    }
}