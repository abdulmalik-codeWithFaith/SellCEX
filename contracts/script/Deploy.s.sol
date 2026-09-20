// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {SellCexFactory} from "../src/core/SellCexFactory.sol";
import {SellCexRouter} from "../src/periphery/SellCexRouter.sol";
import {MockERC20} from "../src/test-tokens/MockERC20.sol";
import {MockWETH} from "../src/test-tokens/MockWETH.sol";

/// @notice Deploys the full SellCex protocol plus a set of test tokens,
///         then creates and seeds a few pools so the frontend has real
///         pools to read from immediately after deployment.
contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        vm.startBroadcast(deployerPrivateKey);

        // 1. Core protocol
        MockWETH weth = new MockWETH();
        SellCexFactory factory = new SellCexFactory(deployer);
        SellCexRouter router = new SellCexRouter(address(factory), address(weth));

        // 2. Test tokens
        MockERC20 usdt = new MockERC20("Test USD", "tUSDT", 18);
        MockERC20 sell = new MockERC20("SellCex Token", "SELL", 18);

        // 3. Mint some to the deployer to seed liquidity with
        usdt.mint(deployer, 1_000_000e18);
        sell.mint(deployer, 10_000_000e18);

        // 4. Create and seed a USDT/SELL pool
        usdt.approve(address(router), type(uint256).max);
        sell.approve(address(router), type(uint256).max);
        router.addLiquidity(
            address(usdt), address(sell), 100_000e18, 1_000_000e18, 0, 0, deployer, block.timestamp + 1 hours
        );

        vm.stopBroadcast();

        console.log("WETH:    ", address(weth));
        console.log("Factory: ", address(factory));
        console.log("Router:  ", address(router));
        console.log("USDT:    ", address(usdt));
        console.log("SELL:    ", address(sell));
    }
}