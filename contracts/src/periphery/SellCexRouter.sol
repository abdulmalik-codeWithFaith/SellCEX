// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ISellCexFactory} from "../interfaces/ISellCexFactory.sol";
import {ISellCexPair} from "../interfaces/ISellCexPair.sol";
import {IERC20} from "../interfaces/IERC20.sol";
import {IWETH} from "../interfaces/IWETH.sol";
import {SellCexLibrary} from "./libraries/SellCexLibrary.sol";
import {TransferHelper} from "./libraries/TransferHelper.sol";

/// @title SellCexRouter
/// @notice The user-facing entrypoint for SellCex. Users (and the
///         frontend) only ever call this contract — never a Pair
///         directly — because this is where slippage protection,
///         deadline enforcement, multi-hop routing, and ETH/BNB
///         wrapping all live. The Pair contracts trust the Router to
///         have already transferred tokens in before calling swap/mint.
contract SellCexRouter {
    address public immutable factory;
    address public immutable WETH; // WBNB on BSC

    modifier ensure(uint256 deadline) {
        require(deadline >= block.timestamp, "SellCexRouter: EXPIRED");
        _;
    }

    constructor(address _factory, address _WETH) {
        require(_factory != address(0) && _WETH != address(0), "SellCexRouter: ZERO_ADDRESS");
        factory = _factory;
        WETH = _WETH;
    }

    receive() external payable {
        // Only accept plain BNB transfers from the WETH contract itself
        // (during unwrap). Anyone else sending BNB directly here would
        // have those funds stuck, so we reject it outright.
        require(msg.sender == WETH, "SellCexRouter: ETH_NOT_ACCEPTED");
    }

    // ------------------------------------------------------------
    // Liquidity
    // ------------------------------------------------------------

    /// @dev Shared logic for both addLiquidity and addLiquidityETH.
    ///      Creates the pair on first use, then figures out the actual
    ///      amounts to deposit: if the pool already has reserves, it
    ///      respects the existing ratio (adjusting whichever side would
    ///      otherwise deposit more than the pool's current price allows)
    ///      rather than letting the caller set an arbitrary price.
    function _addLiquidity(
        address tokenA,
        address tokenB,
        uint256 amountADesired,
        uint256 amountBDesired,
        uint256 amountAMin,
        uint256 amountBMin
    ) internal returns (uint256 amountA, uint256 amountB) {
        if (ISellCexFactory(factory).getPair(tokenA, tokenB) == address(0)) {
            ISellCexFactory(factory).createPair(tokenA, tokenB);
        }
        (uint256 reserveA, uint256 reserveB) = SellCexLibrary.getReserves(factory, tokenA, tokenB);

        if (reserveA == 0 && reserveB == 0) {
            (amountA, amountB) = (amountADesired, amountBDesired);
        } else {
            uint256 amountBOptimal = SellCexLibrary.quote(amountADesired, reserveA, reserveB);
            if (amountBOptimal <= amountBDesired) {
                require(amountBOptimal >= amountBMin, "SellCexRouter: INSUFFICIENT_B_AMOUNT");
                (amountA, amountB) = (amountADesired, amountBOptimal);
            } else {
                uint256 amountAOptimal = SellCexLibrary.quote(amountBDesired, reserveB, reserveA);
                require(amountAOptimal <= amountADesired, "SellCexRouter: EXCESSIVE_A_AMOUNT");
                require(amountAOptimal >= amountAMin, "SellCexRouter: INSUFFICIENT_A_AMOUNT");
                (amountA, amountB) = (amountAOptimal, amountBDesired);
            }
        }
    }

    function _pairFor(address tokenA, address tokenB) private view returns (address pair) {
        pair = ISellCexFactory(factory).getPair(tokenA, tokenB);
    }

    function addLiquidity(
        address tokenA,
        address tokenB,
        uint256 amountADesired,
        uint256 amountBDesired,
        uint256 amountAMin,
        uint256 amountBMin,
        address to,
        uint256 deadline
    ) external ensure(deadline) returns (uint256 amountA, uint256 amountB, uint256 liquidity) {
        (amountA, amountB) = _addLiquidity(tokenA, tokenB, amountADesired, amountBDesired, amountAMin, amountBMin);
        address pair = _pairFor(tokenA, tokenB);
        TransferHelper.safeTransferFrom(tokenA, msg.sender, pair, amountA);
        TransferHelper.safeTransferFrom(tokenB, msg.sender, pair, amountB);
        liquidity = ISellCexPair(pair).mint(to);
    }

    function addLiquidityETH(
        address token,
        uint256 amountTokenDesired,
        uint256 amountTokenMin,
        uint256 amountETHMin,
        address to,
        uint256 deadline
    ) external payable ensure(deadline) returns (uint256 amountToken, uint256 amountETH, uint256 liquidity) {
        (amountToken, amountETH) =
            _addLiquidity(token, WETH, amountTokenDesired, msg.value, amountTokenMin, amountETHMin);
        address pair = _pairFor(token, WETH);
        TransferHelper.safeTransferFrom(token, msg.sender, pair, amountToken);
        IWETH(WETH).deposit{value: amountETH}();
        require(IWETH(WETH).transfer(pair, amountETH), "SellCexRouter: WETH_TRANSFER_FAILED");
        liquidity = ISellCexPair(pair).mint(to);
        // Refund any leftover BNB if the caller sent more than was needed
        if (msg.value > amountETH) {
            (bool success,) = msg.sender.call{value: msg.value - amountETH}("");
            require(success, "SellCexRouter: REFUND_FAILED");
        }
    }

    function removeLiquidity(
        address tokenA,
        address tokenB,
        uint256 liquidity,
        uint256 amountAMin,
        uint256 amountBMin,
        address to,
        uint256 deadline
    ) public ensure(deadline) returns (uint256 amountA, uint256 amountB) {
        address pair = _pairFor(tokenA, tokenB);
        require(pair != address(0), "SellCexRouter: PAIR_NOT_FOUND");
        require(ISellCexPair(pair).transferFrom(msg.sender, pair, liquidity), "SellCexRouter: LP_TRANSFER_FAILED");
        (uint256 amount0, uint256 amount1) = ISellCexPair(pair).burn(to);
        (address token0,) = SellCexLibrary.sortTokens(tokenA, tokenB);
        (amountA, amountB) = tokenA == token0 ? (amount0, amount1) : (amount1, amount0);
        require(amountA >= amountAMin, "SellCexRouter: INSUFFICIENT_A_AMOUNT");
        require(amountB >= amountBMin, "SellCexRouter: INSUFFICIENT_B_AMOUNT");
    }

    function removeLiquidityETH(
        address token,
        uint256 liquidity,
        uint256 amountTokenMin,
        uint256 amountETHMin,
        address to,
        uint256 deadline
    ) public ensure(deadline) returns (uint256 amountToken, uint256 amountETH) {
        (amountToken, amountETH) =
            removeLiquidity(token, WETH, liquidity, amountTokenMin, amountETHMin, address(this), deadline);
        TransferHelper.safeTransfer(token, to, amountToken);
        IWETH(WETH).withdraw(amountETH);
        (bool success,) = to.call{value: amountETH}("");
        require(success, "SellCexRouter: ETH_TRANSFER_FAILED");
    }

    function removeLiquidityWithPermit(
        address tokenA,
        address tokenB,
        uint256 liquidity,
        uint256 amountAMin,
        uint256 amountBMin,
        address to,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external returns (uint256 amountA, uint256 amountB) {
        address pair = _pairFor(tokenA, tokenB);
        ISellCexPair(pair).permit(msg.sender, address(this), liquidity, deadline, v, r, s);
        (amountA, amountB) = removeLiquidity(tokenA, tokenB, liquidity, amountAMin, amountBMin, to, deadline);
    }
        // ------------------------------------------------------------
    // Swaps
    // ------------------------------------------------------------

    /// @dev Walks the path, calling swap() on each pair in sequence.
    ///      Output of each hop gets sent straight to the next pair
    ///      (or to the final recipient on the last hop) — tokens never
    ///      pass back through the Router itself mid-route.
    function _swap(uint256[] memory amounts, address[] memory path, address _to) internal {
        for (uint256 i; i < path.length - 1; i++) {
            (address input, address output) = (path[i], path[i + 1]);
            (address token0,) = SellCexLibrary.sortTokens(input, output);
            uint256 amountOut = amounts[i + 1];
            (uint256 amount0Out, uint256 amount1Out) =
                input == token0 ? (uint256(0), amountOut) : (amountOut, uint256(0));
            address to = i < path.length - 2 ? _pairFor(path[i + 1], path[i + 2]) : _to;
            ISellCexPair(_pairFor(input, output)).swap(amount0Out, amount1Out, to, new bytes(0));
        }
    }

    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external ensure(deadline) returns (uint256[] memory amounts) {
        amounts = SellCexLibrary.getAmountsOut(factory, amountIn, path);
        require(amounts[amounts.length - 1] >= amountOutMin, "SellCexRouter: INSUFFICIENT_OUTPUT_AMOUNT");
        TransferHelper.safeTransferFrom(path[0], msg.sender, _pairFor(path[0], path[1]), amounts[0]);
        _swap(amounts, path, to);
    }

    function swapTokensForExactTokens(
        uint256 amountOut,
        uint256 amountInMax,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external ensure(deadline) returns (uint256[] memory amounts) {
        amounts = SellCexLibrary.getAmountsIn(factory, amountOut, path);
        require(amounts[0] <= amountInMax, "SellCexRouter: EXCESSIVE_INPUT_AMOUNT");
        TransferHelper.safeTransferFrom(path[0], msg.sender, _pairFor(path[0], path[1]), amounts[0]);
        _swap(amounts, path, to);
    }

    function swapExactETHForTokens(uint256 amountOutMin, address[] calldata path, address to, uint256 deadline)
        external
        payable
        ensure(deadline)
        returns (uint256[] memory amounts)
    {
        require(path[0] == WETH, "SellCexRouter: INVALID_PATH");
        amounts = SellCexLibrary.getAmountsOut(factory, msg.value, path);
        require(amounts[amounts.length - 1] >= amountOutMin, "SellCexRouter: INSUFFICIENT_OUTPUT_AMOUNT");
        IWETH(WETH).deposit{value: amounts[0]}();
        require(IWETH(WETH).transfer(_pairFor(path[0], path[1]), amounts[0]), "SellCexRouter: WETH_TRANSFER_FAILED");
        _swap(amounts, path, to);
    }

    function swapTokensForExactETH(
        uint256 amountOut,
        uint256 amountInMax,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external ensure(deadline) returns (uint256[] memory amounts) {
        require(path[path.length - 1] == WETH, "SellCexRouter: INVALID_PATH");
        amounts = SellCexLibrary.getAmountsIn(factory, amountOut, path);
        require(amounts[0] <= amountInMax, "SellCexRouter: EXCESSIVE_INPUT_AMOUNT");
        TransferHelper.safeTransferFrom(path[0], msg.sender, _pairFor(path[0], path[1]), amounts[0]);
        _swap(amounts, path, address(this));
        IWETH(WETH).withdraw(amounts[amounts.length - 1]);
        (bool success,) = to.call{value: amounts[amounts.length - 1]}("");
        require(success, "SellCexRouter: ETH_TRANSFER_FAILED");
    }

    function swapExactTokensForETH(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external ensure(deadline) returns (uint256[] memory amounts) {
        require(path[path.length - 1] == WETH, "SellCexRouter: INVALID_PATH");
        amounts = SellCexLibrary.getAmountsOut(factory, amountIn, path);
        require(amounts[amounts.length - 1] >= amountOutMin, "SellCexRouter: INSUFFICIENT_OUTPUT_AMOUNT");
        TransferHelper.safeTransferFrom(path[0], msg.sender, _pairFor(path[0], path[1]), amounts[0]);
        _swap(amounts, path, address(this));
        IWETH(WETH).withdraw(amounts[amounts.length - 1]);
        (bool success,) = to.call{value: amounts[amounts.length - 1]}("");
        require(success, "SellCexRouter: ETH_TRANSFER_FAILED");
    }

    function swapETHForExactTokens(uint256 amountOut, address[] calldata path, address to, uint256 deadline)
        external
        payable
        ensure(deadline)
        returns (uint256[] memory amounts)
    {
        require(path[0] == WETH, "SellCexRouter: INVALID_PATH");
        amounts = SellCexLibrary.getAmountsIn(factory, amountOut, path);
        require(amounts[0] <= msg.value, "SellCexRouter: EXCESSIVE_INPUT_AMOUNT");
        IWETH(WETH).deposit{value: amounts[0]}();
        require(IWETH(WETH).transfer(_pairFor(path[0], path[1]), amounts[0]), "SellCexRouter: WETH_TRANSFER_FAILED");
        _swap(amounts, path, to);
        if (msg.value > amounts[0]) {
            (bool success,) = msg.sender.call{value: msg.value - amounts[0]}("");
            require(success, "SellCexRouter: REFUND_FAILED");
        }
    }

    // ------------------------------------------------------------
    // View helpers — what the frontend calls to get a quote before
    // ever sending a transaction (this is the real version of what
    // the Swap page's mock quote logic was standing in for)
    // ------------------------------------------------------------

    function quote(uint256 amountA, uint256 reserveA, uint256 reserveB) external pure returns (uint256 amountB) {
        return SellCexLibrary.quote(amountA, reserveA, reserveB);
    }

    function getAmountsOut(uint256 amountIn, address[] calldata path)
        external
        view
        returns (uint256[] memory amounts)
    {
        return SellCexLibrary.getAmountsOut(factory, amountIn, path);
    }

    function getAmountsIn(uint256 amountOut, address[] calldata path)
        external
        view
        returns (uint256[] memory amounts)
    {
        return SellCexLibrary.getAmountsIn(factory, amountOut, path);
    }
}