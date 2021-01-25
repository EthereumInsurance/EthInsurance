//SPDX-License-Identifier: MIT
pragma solidity ^0.7.4;

import "./ATokenV2Strategy.sol";
import "../interfaces/IStrategyManager.sol";

import "@openzeppelin/contracts/access/Ownable.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";

contract ATokenV2StrategyToAave is ATokenV2Strategy, Ownable {
    address public aave;

    IUniswapV2Router02 router = IUniswapV2Router02(
        0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D
    );

    constructor(
        address _want,
        address _aWant,
        address _lendingPoolAddressProvider,
        address _strategyManager,
        address _aave
    )
        public
        ATokenV2Strategy(
            _want,
            _aWant,
            _lendingPoolAddressProvider,
            _strategyManager
        )
    {
        aave = _aave;
    }

    function swapToAave(uint256 _amount, uint256 _aaveMinOutput)
        external
        onlyOwner
    {
        // redeem aDai for dai
        withdraw(_amount);

        // swap dai to eth to aave and send to strategymanager
        address[] memory path = new address[](2);
        path[0] = want; // dai
        path[1] = router.WETH();
        path[2] = aave;
        router.swapExactTokensForTokens(
            _amount,
            _aaveMinOutput,
            path,
            strategyManager,
            block.timestamp
        );
        // tell the strategy manager we deposited aave.
        IStrategyManager(strategyManager).deposit(aave);
    }
}
