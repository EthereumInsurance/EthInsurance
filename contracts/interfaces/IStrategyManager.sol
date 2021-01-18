//SPDX-License-Identifier: MIT
pragma solidity ^0.7.4;

interface IStrategyManager {
    function balanceOf(address _token) external view returns (uint256);

    function deposit(address _token) external;

    function withdraw(address _token, uint256 _amount) external;
}
