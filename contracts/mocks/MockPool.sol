//SPDX-License-Identifier: MIT
pragma solidity ^0.7.4;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "../interfaces/IStrategyManager.sol";
import "../interfaces/IPool.sol";

contract MockPool is IPool {
    IERC20 public t;
    IStrategyManager public sm;

    function setToken(IERC20 _token) external {
        t = _token;
    }

    function setSm(IStrategyManager _sm) external {
        sm = _sm;
    }

    function token() external override view returns (IERC20) {
        return t;
    }

    function withdraw(address _token, uint256 _amount) external {
        sm.withdraw(_token, _amount);
    }
}
