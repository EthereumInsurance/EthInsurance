//SPDX-License-Identifier: MIT
pragma solidity ^0.7.4;

interface IStrategy {
    function want() external view returns (address);

    function withdrawAll() external returns (uint256);

    function withdraw(uint256 _amount) external;

    function withdraw(address _token) external;

    function deposit() external;

    function balanceOf() external view returns (uint256);
}
