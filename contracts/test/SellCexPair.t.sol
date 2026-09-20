// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {SellCexPair} from "../src/core/SellCexPair.sol";
import {MockERC20} from "../src/test-tokens/MockERC20.sol";

contract SellCexPairTest is Test {
    SellCexPair pair;
    MockERC20 token0;
    MockERC20 token1;

    address alice = address(0xA11CE);
    address bob = address(0xB0B);

    function setUp() public {
        MockERC20 tokenA = new MockERC20("Token A", "TKA", 18);
        MockERC20 tokenB = new MockERC20("Token B", "TKB", 18);

        // Pair expects token0 < token1, same ordering the Factory enforces
        (token0, token1) = address(tokenA) < address(tokenB) ? (tokenA, tokenB) : (tokenB, tokenA);

        pair = new SellCexPair(); // this test contract becomes `factory`
        pair.initialize(address(token0), address(token1));
    }

    /// @dev Mirrors what the Router does: transfer tokens into the pair
    ///      directly, then call mint(). The Pair never pulls tokens itself.
    function _addLiquidity(uint256 amount0, uint256 amount1, address to) internal returns (uint256 liquidity) {
        token0.mint(address(pair), amount0);
        token1.mint(address(pair), amount1);
        liquidity = pair.mint(to);
    }

    // ------------------------------------------------------------
    // Mint
    // ------------------------------------------------------------

    function test_FirstMint_LocksMinimumLiquidity() public {
        uint256 liquidity = _addLiquidity(1000e18, 4000e18, alice);

        // sqrt(1000e18 * 4000e18) = sqrt(4,000,000e36) = 2,000,000e18... scaled correctly:
        uint256 expected = _sqrt(1000e18 * 4000e18) - pair.MINIMUM_LIQUIDITY();
        assertEq(liquidity, expected);
        assertEq(pair.balanceOf(alice), expected);
        assertEq(pair.balanceOf(address(0)), pair.MINIMUM_LIQUIDITY());
        assertEq(pair.totalSupply(), expected + pair.MINIMUM_LIQUIDITY());
    }

    function test_SecondMint_IsProportionalToReserves() public {
        _addLiquidity(1000e18, 4000e18, alice);

        // Bob deposits at exactly the pool's existing 1:4 ratio
        uint256 bobLiquidity = _addLiquidity(100e18, 400e18, bob);

        // Bob owns 10% of what was already in the pool at deposit time
        uint256 totalSupplyBefore = pair.totalSupply() - bobLiquidity;
        assertApproxEqRel(bobLiquidity, totalSupplyBefore / 10, 0.01e18); // within 1%
    }

    function test_RevertWhen_MintWithZeroLiquidity() public {
    // Transfer zero tokens in directly, then attempt to mint — this
    // should revert because sqrt(0 * 0) underflows against
    // MINIMUM_LIQUIDITY (1000), not silently mint nothing.
    token0.mint(address(pair), 0);
    token1.mint(address(pair), 0);
    vm.expectRevert();
    pair.mint(alice);
}

    // ------------------------------------------------------------
    // Burn
    // ------------------------------------------------------------

    function test_Burn_ReturnsProportionalTokens() public {
        uint256 liquidity = _addLiquidity(1000e18, 4000e18, alice);

        vm.prank(alice);
        pair.transfer(address(pair), liquidity); // Router-style: send LP tokens in first
        (uint256 amount0, uint256 amount1) = pair.burn(alice);

        // Alice owned ~100% of the pool (minus the locked minimum), so she
        // should get back ~100% of the reserves
        assertApproxEqRel(amount0, 1000e18, 0.001e18);
        assertApproxEqRel(amount1, 4000e18, 0.001e18);
    }

    // ------------------------------------------------------------
    // Swap
    // ------------------------------------------------------------

    function test_Swap_Token0ForToken1() public {
        _addLiquidity(1000e18, 4000e18, alice);

        uint256 amountIn = 10e18;
        token0.mint(address(pair), amountIn);

        // Same formula as SellCexLibrary.getAmountOut
        uint256 amountInWithFee = amountIn * 997;
        uint256 expectedOut = (amountInWithFee * 4000e18) / (1000e18 * 1000 + amountInWithFee);

        pair.swap(0, expectedOut, bob, "");

        assertEq(token1.balanceOf(bob), expectedOut);
    }

    function test_RevertWhen_SwapWithoutPayment() public {
        _addLiquidity(1000e18, 4000e18, alice);
        // No tokens transferred in before calling swap — the Pair should
        // notice the balance didn't actually increase and revert.
        vm.expectRevert(bytes("SellCex: INSUFFICIENT_INPUT_AMOUNT"));
        pair.swap(0, 1e18, bob, "");
    }

    function test_RevertWhen_SwapRequestsMoreThanKAllows() public {
        _addLiquidity(1000e18, 4000e18, alice);

        uint256 amountIn = 10e18;
        token0.mint(address(pair), amountIn);

        // Ask for slightly more output than the fee-adjusted curve allows
        uint256 amountInWithFee = amountIn * 997;
        uint256 maxOut = (amountInWithFee * 4000e18) / (1000e18 * 1000 + amountInWithFee);

        vm.expectRevert(bytes("SellCex: K"));
        pair.swap(0, maxOut + 1e15, bob, "");
    }

    // ------------------------------------------------------------
    // Fuzz: the invariant that actually matters
    // ------------------------------------------------------------

    function testFuzz_SwapNeverDecreasesK(uint256 amountIn) public {
        _addLiquidity(1000e18, 4000e18, alice);
        (uint112 r0Before, uint112 r1Before) = pair.getReserves();
        uint256 kBefore = uint256(r0Before) * uint256(r1Before);

        // Bound to a realistic range — from dust up to half the pool's
        // token0 reserve, so we're not testing absurd, unreachable trades
        amountIn = bound(amountIn, 1e15, 500e18);
        token0.mint(address(pair), amountIn);

        uint256 amountInWithFee = amountIn * 997;
        uint256 amountOut = (amountInWithFee * r1Before) / (uint256(r0Before) * 1000 + amountInWithFee);
        if (amountOut == 0) return; // dust trades that round to zero output aren't valid swaps

        pair.swap(0, amountOut, bob, "");

        (uint112 r0After, uint112 r1After) = pair.getReserves();
        uint256 kAfter = uint256(r0After) * uint256(r1After);

        assertGe(kAfter, kBefore);
    }

    // ------------------------------------------------------------
    // helper
    // ------------------------------------------------------------

    function _sqrt(uint256 y) internal pure returns (uint256 z) {
        if (y > 3) {
            z = y;
            uint256 x = y / 2 + 1;
            while (x < z) {
                z = x;
                x = (y / x + x) / 2;
            }
        } else if (y != 0) {
            z = 1;
        }
    }
}