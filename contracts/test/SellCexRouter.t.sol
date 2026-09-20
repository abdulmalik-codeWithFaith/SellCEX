// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {SellCexFactory} from "../src/core/SellCexFactory.sol";
import {SellCexRouter} from "../src/periphery/SellCexRouter.sol";
import {MockERC20} from "../src/test-tokens/MockERC20.sol";
import {MockWETH} from "../src/test-tokens/MockWETH.sol";

contract SellCexRouterTest is Test {
    SellCexFactory factory;
    SellCexRouter router;
    MockWETH weth;
    MockERC20 tokenA; // e.g. stand-in for USDT
    MockERC20 tokenB; // e.g. stand-in for SELL
    MockERC20 tokenC; // third token, for multi-hop routing

    address alice = address(0xA11CE);
    address bob = address(0xB0B);
    uint256 constant DEADLINE_FAR = 4_102_444_800; // year 2100, effectively "never expires"

    function setUp() public {
        factory = new SellCexFactory(address(this));
        weth = new MockWETH();
        router = new SellCexRouter(address(factory), address(weth));

        tokenA = new MockERC20("Token A", "TKA", 18);
        tokenB = new MockERC20("Token B", "TKB", 18);
        tokenC = new MockERC20("Token C", "TKC", 18);

        tokenA.mint(alice, 1_000_000e18);
        tokenB.mint(alice, 1_000_000e18);
        tokenC.mint(alice, 1_000_000e18);
        vm.deal(alice, 100 ether);

        vm.startPrank(alice);
        tokenA.approve(address(router), type(uint256).max);
        tokenB.approve(address(router), type(uint256).max);
        tokenC.approve(address(router), type(uint256).max);
        vm.stopPrank();
    }

    // ------------------------------------------------------------
    // addLiquidity
    // ------------------------------------------------------------

    function test_AddLiquidity_CreatesPairAndMints() public {
        vm.prank(alice);
        (uint256 amountA, uint256 amountB, uint256 liquidity) =
            router.addLiquidity(address(tokenA), address(tokenB), 1000e18, 4000e18, 0, 0, alice, DEADLINE_FAR);

        assertEq(amountA, 1000e18);
        assertEq(amountB, 4000e18);
        assertGt(liquidity, 0);
        assertTrue(factory.getPair(address(tokenA), address(tokenB)) != address(0));
    }

    function test_AddLiquidity_SecondDeposit_RespectsPoolRatio() public {
        vm.startPrank(alice);
        router.addLiquidity(address(tokenA), address(tokenB), 1000e18, 4000e18, 0, 0, alice, DEADLINE_FAR);

        // Alice offers 100 A and 500 B (that's a 1:5 ratio), but the pool
        // is at 1:4 — the router should only take 100 A + 400 B, matching
        // the pool's actual ratio, and leave the rest in her wallet.
        uint256 balanceBBefore = tokenB.balanceOf(alice);
        (uint256 amountA, uint256 amountB,) =
            router.addLiquidity(address(tokenA), address(tokenB), 100e18, 500e18, 0, 0, alice, DEADLINE_FAR);
        vm.stopPrank();

        assertEq(amountA, 100e18);
        assertEq(amountB, 400e18); // NOT 500 — clamped to the pool ratio
        assertEq(tokenB.balanceOf(alice), balanceBBefore - 400e18);
    }

    function test_RevertWhen_AddLiquidity_DeadlineExpired() public {
        vm.prank(alice);
        vm.expectRevert(bytes("SellCexRouter: EXPIRED"));
        router.addLiquidity(address(tokenA), address(tokenB), 1000e18, 4000e18, 0, 0, alice, block.timestamp - 1);
    }

    // ------------------------------------------------------------
    // removeLiquidity
    // ------------------------------------------------------------

    function test_RemoveLiquidity_ReturnsUnderlyingTokens() public {
        vm.startPrank(alice);
        (,, uint256 liquidity) =
            router.addLiquidity(address(tokenA), address(tokenB), 1000e18, 4000e18, 0, 0, alice, DEADLINE_FAR);

        address pair = factory.getPair(address(tokenA), address(tokenB));
        SellCexPairLike(pair).approve(address(router), liquidity);

        (uint256 amountA, uint256 amountB) =
            router.removeLiquidity(address(tokenA), address(tokenB), liquidity, 0, 0, alice, DEADLINE_FAR);
        vm.stopPrank();

        // She gets back ~everything she put in, minus the tiny amount
        // permanently locked as MINIMUM_LIQUIDITY on first deposit
        assertApproxEqRel(amountA, 1000e18, 0.001e18);
        assertApproxEqRel(amountB, 4000e18, 0.001e18);
    }

    // ------------------------------------------------------------
    // swaps
    // ------------------------------------------------------------

    function test_SwapExactTokensForTokens_SingleHop() public {
        vm.startPrank(alice);
        router.addLiquidity(address(tokenA), address(tokenB), 1000e18, 4000e18, 0, 0, alice, DEADLINE_FAR);

        address[] memory path = new address[](2);
        path[0] = address(tokenA);
        path[1] = address(tokenB);

        uint256 bobBalanceBefore = tokenB.balanceOf(bob);
        uint256[] memory amounts = router.getAmountsOut(10e18, path);

        router.swapExactTokensForTokens(10e18, amounts[1], path, bob, DEADLINE_FAR);
        vm.stopPrank();

        assertEq(tokenB.balanceOf(bob) - bobBalanceBefore, amounts[1]);
    }

    function test_SwapExactTokensForTokens_MultiHop() public {
        vm.startPrank(alice);
        // Two pools: A/B and B/C — a trade from A to C has to route through B
        router.addLiquidity(address(tokenA), address(tokenB), 1000e18, 4000e18, 0, 0, alice, DEADLINE_FAR);
        router.addLiquidity(address(tokenB), address(tokenC), 4000e18, 2000e18, 0, 0, alice, DEADLINE_FAR);

        address[] memory path = new address[](3);
        path[0] = address(tokenA);
        path[1] = address(tokenB);
        path[2] = address(tokenC);

        uint256[] memory amounts = router.getAmountsOut(10e18, path);
        uint256 bobBalanceBefore = tokenC.balanceOf(bob);

        router.swapExactTokensForTokens(10e18, amounts[2], path, bob, DEADLINE_FAR);
        vm.stopPrank();

        assertEq(tokenC.balanceOf(bob) - bobBalanceBefore, amounts[2]);
        assertGt(amounts[2], 0);
    }

    function test_RevertWhen_Swap_SlippageExceeded() public {
        vm.startPrank(alice);
        router.addLiquidity(address(tokenA), address(tokenB), 1000e18, 4000e18, 0, 0, alice, DEADLINE_FAR);

        address[] memory path = new address[](2);
        path[0] = address(tokenA);
        path[1] = address(tokenB);
        uint256[] memory amounts = router.getAmountsOut(10e18, path);

        // Demand more output than the pool can actually give at this size
        vm.expectRevert(bytes("SellCexRouter: INSUFFICIENT_OUTPUT_AMOUNT"));
        router.swapExactTokensForTokens(10e18, amounts[1] + 1e18, path, bob, DEADLINE_FAR);
        vm.stopPrank();
    }

    function test_RevertWhen_Swap_DeadlineExpired() public {
        vm.startPrank(alice);
        router.addLiquidity(address(tokenA), address(tokenB), 1000e18, 4000e18, 0, 0, alice, DEADLINE_FAR);

        address[] memory path = new address[](2);
        path[0] = address(tokenA);
        path[1] = address(tokenB);

        vm.expectRevert(bytes("SellCexRouter: EXPIRED"));
        router.swapExactTokensForTokens(10e18, 0, path, bob, block.timestamp - 1);
        vm.stopPrank();
    }

    // ------------------------------------------------------------
    // ETH (BNB) paths
    // ------------------------------------------------------------

    function test_AddLiquidityETH_And_SwapExactETHForTokens() public {
        vm.startPrank(alice);
        router.addLiquidityETH{value: 10 ether}(address(tokenA), 4000e18, 0, 0, alice, DEADLINE_FAR);

        address[] memory path = new address[](2);
        path[0] = address(weth);
        path[1] = address(tokenA);

        uint256 balanceBefore = tokenA.balanceOf(bob);
        router.swapExactETHForTokens{value: 1 ether}(0, path, bob, DEADLINE_FAR);
        vm.stopPrank();

        assertGt(tokenA.balanceOf(bob), balanceBefore);
    }
}

/// @dev Tiny interface so the test can call approve() on the pair's LP
///      token without importing the full ISellCexPair interface here.
interface SellCexPairLike {
    function approve(address spender, uint256 value) external returns (bool);
}