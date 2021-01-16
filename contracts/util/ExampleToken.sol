//SPDX-License-Identifier: MIT

pragma solidity ^0.7.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract ExampleToken is ERC20 {
    constructor(address to, uint256 amount) ERC20("Wrapped ETH", "ETH") {
        _mint(to, amount);
    }
}
