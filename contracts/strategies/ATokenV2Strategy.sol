//SPDX-License-Identifier: MIT
pragma solidity ^0.7.4;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

import "../interfaces/aaveV2/ILendingPool.sol";
import "../interfaces/aaveV2/ILendingPoolAddressesProvider.sol";

import "../interfaces/IStrategy.sol";

contract ATokenV2Strategy is IStrategy {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    address public strategyManager;
    address public override want;
    address public aWant;
    address internal lpAddressProvider;

    modifier onlyStrategyManager() {
        require(
            msg.sender == strategyManager || msg.sender == address(this),
            "strategyManager"
        );
        _;
    }

    constructor(
        address _want,
        address _aWant,
        address _lendingPoolAddressProvider,
        address _strategyManager
    ) public {
        want = _want;
        aWant = _aWant;
        lpAddressProvider = _lendingPoolAddressProvider;
        strategyManager = _strategyManager;
    }

    function getLp() internal view returns (ILendingPool) {
        return
            ILendingPool(
                ILendingPoolAddressesProvider(lpAddressProvider)
                    .getLendingPool()
            );
    }

    function deposit() external override {
        ILendingPool lp = getLp();
        uint256 amount = IERC20(want).balanceOf(address(this));
        IERC20(want).approve(address(lp), amount);
        lp.deposit(want, amount, address(this), 0);
    }

    function withdrawAll()
        external
        override
        onlyStrategyManager
        returns (uint256)
    {
        ILendingPool lp = getLp();
        // debug
        uint256 balance = IERC20(aWant).balanceOf(address(this));
        if (balance == 0) {
            return 0;
        }
        // end debug
        return lp.withdraw(want, uint256(-1), msg.sender);
    }

    function withdraw(uint256 _amount) external override onlyStrategyManager {
        ILendingPool lp = getLp();
        lp.withdraw(want, _amount, msg.sender);
    }

    function withdraw(address _token) external override onlyStrategyManager {
        IERC20 token = IERC20(_token);
        token.safeTransfer(msg.sender, token.balanceOf(address(this)));
    }

    function balanceOf() external override view returns (uint256) {
        // no `want` balance in this contract
        // Aave has 1 to 1 ratio
        return IERC20(aWant).balanceOf(address(this));
    }
}
