// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title TransferHelper
/// @notice Safe wrappers around ERC20 transfer/transferFrom that tolerate
///         tokens which don't strictly follow the standard (return false
///         instead of reverting, or return nothing at all).
library TransferHelper {
    function safeTransfer(address token, address to, uint256 value) internal {
        (bool success, bytes memory data) =
            token.call(abi.encodeWithSignature("transfer(address,uint256)", to, value));
        require(success && (data.length == 0 || abi.decode(data, (bool))), "TransferHelper: TRANSFER_FAILED");
    }

    function safeTransferFrom(address token, address from, address to, uint256 value) internal {
        (bool success, bytes memory data) =
            token.call(abi.encodeWithSignature("transferFrom(address,address,uint256)", from, to, value));
        require(success && (data.length == 0 || abi.decode(data, (bool))), "TransferHelper: TRANSFERFROM_FAILED");
    }
}