//SPDX-License-Identifier: MIT
pragma solidity ^0.7.4;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../interfaces/IStrategy.sol";

contract MockStrategy is IStrategy {
    address public override want = address(1);

    function setWant(address _want) external {
        want = _want;
    }

    bool public depositRevert;

    function setDepositRevert(bool _revert) external {
        depositRevert = _revert;
    }

    function deposit() external override {
        require(!depositRevert, "DEPOSIT_REVERT");
    }

    uint256 public withdrawAllReturn = uint256(-1);
    bool public withdrawAllRevert;

    function setWithdrawAllRevert(bool _revert) external {
        withdrawAllRevert = _revert;
    }

    function setWithdrawAllReturn(uint256 _return) external {
        withdrawAllReturn = _return;
    }

    function withdrawAll() external override returns (uint256) {
        require(!withdrawAllRevert, "WITHDRAW_ALL_REVERT");
        if (withdrawAllReturn != uint256(-1)) {
            return withdrawAllReturn;
        }
        IERC20(want).transfer(msg.sender, balanceOf());
        return balanceOf();
    }

    bool public withdrawRevert;

    function setWithdrawRevert(bool _revert) external {
        withdrawRevert = _revert;
    }

    function withdraw(uint256 _amount) public override {
        require(!withdrawRevert, "WITHDRAW_REVERT");
        IERC20(want).transfer(msg.sender, _amount);
    }

    function withdraw(address _token) external override {
        revert("NOT_MOCKED");
    }

    function balanceOf() public override view returns (uint256) {
        return IERC20(want).balanceOf(address(this));
    }
}
