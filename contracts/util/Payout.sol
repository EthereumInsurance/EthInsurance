// SPDX-License-Identifier: MIT
pragma solidity ^0.7.4;

import "../interfaces/IPayOut.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract PayOut is IPayOut {
    function deposit(address _token) external override {
        IERC20 token = IERC20(_token);
        uint256 got = token.balanceOf(address(this));
    }
}
