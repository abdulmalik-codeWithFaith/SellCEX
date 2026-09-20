// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {MockERC20} from "../src/test-tokens/MockERC20.sol";

contract MockERC20Test is Test {
    MockERC20 token;
    address alice = address(0xA11CE);
    address bob = address(0xB0B);

    function setUp() public {
        token = new MockERC20("Test USD", "tUSDT", 18);
    }

    function test_MintIncreasesBalanceAndSupply() public {
        token.mint(alice, 1000e18);
        assertEq(token.balanceOf(alice), 1000e18);
        assertEq(token.totalSupply(), 1000e18);
    }

    function test_TransferMovesBalance() public {
        token.mint(alice, 1000e18);
        vm.prank(alice);
        token.transfer(bob, 400e18);
        assertEq(token.balanceOf(alice), 600e18);
        assertEq(token.balanceOf(bob), 400e18);
    }

    function test_TransferFromRespectsAllowance() public {
        token.mint(alice, 1000e18);
        vm.prank(alice);
        token.approve(bob, 300e18);

        vm.prank(bob);
        token.transferFrom(alice, bob, 300e18);

        assertEq(token.balanceOf(bob), 300e18);
        assertEq(token.allowance(alice, bob), 0);
    }

    function test_RevertWhen_TransferExceedsBalance() public {
        token.mint(alice, 100e18);
        vm.prank(alice);
        vm.expectRevert();
        token.transfer(bob, 200e18);
    }
}