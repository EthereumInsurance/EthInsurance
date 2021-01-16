//SPDX-License-Identifier: Unlicense
pragma solidity ^0.7.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./IStake.sol";

contract Stake is ERC20("Staked Insurance", "InStake"), IStake, Ownable {
    function mint(address _account, uint256 _amount) external override onlyOwner {
        _mint(_account, _amount);
    }

    function burn(address _account, uint256 _amount) external override onlyOwner {
        _burn(_account, _amount);
    }
}
