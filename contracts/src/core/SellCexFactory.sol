// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {SellCexPair} from "./SellCexPair.sol";

interface ISellCexPairInit {
    function initialize(address _token0, address _token1) external;
}

/// @title SellCexFactory
/// @notice Deploys a SellCexPair for any two tokens, exactly once per pair,
///         at a deterministic CREATE2 address. That determinism is what
///         lets the Router (and the frontend) compute a pair's address
///         from just the two token addresses, with no extra chain call.
contract SellCexFactory {
    address public feeTo;
    address public feeToSetter;

    mapping(address => mapping(address => address)) public getPair;
    address[] public allPairs;

    event PairCreated(address indexed token0, address indexed token1, address pair, uint256 pairIndex);
    event FeeToSetterUpdated(address indexed previousFeeToSetter, address indexed newFeeToSetter);
    constructor(address _feeToSetter) {
        require(_feeToSetter != address(0), "SellCex: ZERO_ADDRESS");
        feeToSetter = _feeToSetter;
    }

    function allPairsLength() external view returns (uint256) {
        return allPairs.length;
    }

    /// @notice Deploy a new pair for `tokenA`/`tokenB`. Reverts if one
    ///         already exists — a pair can only ever be created once.
    function createPair(address tokenA, address tokenB) external returns (address pair) {
        require(tokenA != tokenB, "SellCex: IDENTICAL_ADDRESSES");

        // Tokens are always ordered the same way (lower address first) so
        // that WBNB/USDT and USDT/WBNB resolve to the exact same pair,
        // regardless of which order the caller passed them in.
        (address token0, address token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        require(token0 != address(0), "SellCex: ZERO_ADDRESS");
        require(getPair[token0][token1] == address(0), "SellCex: PAIR_EXISTS");

        bytes memory bytecode = type(SellCexPair).creationCode;
        bytes32 salt = keccak256(abi.encodePacked(token0, token1));
        assembly {
            pair := create2(0, add(bytecode, 32), mload(bytecode), salt)
        }
        require(pair != address(0), "SellCex: CREATE2_FAILED");

        ISellCexPairInit(pair).initialize(token0, token1);

        getPair[token0][token1] = pair;
        getPair[token1][token0] = pair; // populate the reverse mapping too
        allPairs.push(pair);

        emit PairCreated(token0, token1, pair, allPairs.length);
    }

    function setFeeTo(address _feeTo) external {
        require(msg.sender == feeToSetter, "SellCex: FORBIDDEN");
        feeTo = _feeTo;
    }

    function setFeeToSetter(address _feeToSetter) external {
    require(msg.sender == feeToSetter, "SellCex: FORBIDDEN");
    require(_feeToSetter != address(0), "SellCex: ZERO_ADDRESS");
    emit FeeToSetterUpdated(feeToSetter, _feeToSetter);
    feeToSetter = _feeToSetter;
}
}