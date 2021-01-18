// SPDX-License-Identifier: MIT
pragma solidity ^0.7.4;

import "../interfaces/IPayOut.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract PayOut is IPayOut {
    function insurancePaid(address _token, uint256 _amount) external override {
        IERC20 token = IERC20(_token);
        require(
            token.transferFrom(msg.sender, address(this), _amount),
            "FAILED_TRANSFER"
        );
    }
}
