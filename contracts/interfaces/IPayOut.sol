// SPDX-License-Identifier: MIT
pragma solidity ^0.7.4;

interface IPayOut {
    function insurancePaid(address _token, uint256 _amount) external;
}
