// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface ISellCexFactory {
    function getPair(address tokenA, address tokenB) external view returns (address pair);
    function createPair(address tokenA, address tokenB) external returns (address pair);
}