//SPDX-License-Identifier: MIT

pragma solidity ^0.7.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract AaveToken is ERC20 {
    constructor(address to, uint256 amount) ERC20("AAVE Token", "AAVE") {
        _mint(to, amount);
    }
}
