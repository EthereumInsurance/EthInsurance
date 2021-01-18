//SPDX-License-Identifier: MIT
pragma solidity ^0.7.4;

import "./interfaces/IStrategyManager.sol";

contract StrategyManager is IStrategyManager {
    function balanceOf(address _token)
        external
        override
        view
        returns (uint256)
    {}
}
