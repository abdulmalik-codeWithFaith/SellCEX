// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice Wrapped native-currency interface (WBNB on BSC, WETH elsewhere).
///         The Router needs this so it can accept plain BNB from users and
///         wrap it into an ERC20 before it ever touches a pool — pools only
///         ever hold ERC20s, never native currency directly.
interface IWETH {
    function deposit() external payable;
    function withdraw(uint256 amount) external;
    function transfer(address to, uint256 value) external returns (bool);
    function balanceOf(address owner) external view returns (uint256);
}