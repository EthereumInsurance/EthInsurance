//SPDX-License-Identifier: MIT
pragma solidity ^0.7.4;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

import "./interfaces/IStrategyManager.sol";

contract StrategyManager is IStrategyManager, Ownable {
    using SafeMath for uint256;

    mapping(address => address) strategies;

    function balanceOf(address _token)
        external
        override
        view
        returns (uint256)
    {
        IERC20(_token).balanceOf(address(this));
    }

    function deposit(address _token) external override {}

    function withdraw(address _token, uint256 _amount)
        external
        override
        onlyOwner
    {
        require(
            IERC20(_token).transfer(msg.sender, _amount),
            "INSUFFICIENT_FUNDS"
        );
    }
}
