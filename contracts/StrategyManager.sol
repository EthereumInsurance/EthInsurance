//SPDX-License-Identifier: MIT
pragma solidity ^0.7.4;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

import "./interfaces/chainlink/AggregratorV3Interface.sol";

import "./interfaces/IPool.sol";
import "./interfaces/IStrategyManager.sol";
import "./interfaces/IStrategy.sol";

contract StrategyManager is IStrategyManager, Ownable {
    // This contract does not hold any funds.

    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    address public pool;
    address[] public tokens;
    mapping(address => address) public strategies;
    // todo, use ENS
    mapping(address => AggregatorV3Interface) public priceOracle;

    modifier onlyPool() {
        require(msg.sender == pool, "ONLY_POOL");
        _;
    }

    function balanceOfNative() external override view returns (uint256) {
        address native = address(IPool(pool).token());
        uint256 balance = balanceOf(native);
        for (uint256 i = 0; i < tokens.length; i++) {
            address token = tokens[i];
            if (token == native) {
                continue;
            }

            // TODO validate price is up to date
            (, int256 price, , , ) = priceOracle[token].latestRoundData();
            // TODO validate if !18 decimals will work as well
            balance = balance.add(
                uint256(price).mul(balanceOf(token).div(100000000))
            );
        }
        return balance;
    }

    function balanceOf(address _token) public override view returns (uint256) {
        // this method should make sure a 'safe' value is returned from the strategies
        // should not affect the insurance pool dramatically if a strategy goes rogue

        // one way to pull it of, is to not do the balances live.
        // as live balances will also ensure a loop over the strategies.

        //todo balance of to native token
        address strategy = strategies[_token];
        if (strategy == address(0)) {
            return 0;
        }

        return IStrategy(strategy).balanceOf();
    }

    function deposit(address _token) public override {
        address strategy = strategies[_token];
        require(strategy != address(0), "NO_STRATEGY");

        IERC20 token = IERC20(_token);
        token.safeTransfer(strategy, token.balanceOf(address(this)));
        IStrategy(strategy).deposit();
    }

    function withdraw(address _token, uint256 _amount)
        external
        override
        onlyPool
    {
        address strategy = strategies[_token];
        require(strategy != address(0), "NO_STRATEGY");

        IStrategy(strategy).withdraw(_amount);
        IERC20(_token).safeTransfer(msg.sender, _amount);
    }

    function setPool(address _pool) public onlyOwner {
        pool = _pool;
    }

    function removeStrategy(address _token, uint256 _index) external onlyOwner {
        address strategy = strategies[_token];
        require(strategy != address(0), "NO_STRATEGY");
        require(IStrategy(strategy).withdrawAll() == 0, "NOT_EMPYY");
        require(tokens[_index] == _token, "INVALID_INDEX");

        tokens[_index] = tokens[tokens.length - 1];
        // remove last element
        delete tokens[tokens.length - 1];
        tokens.pop();

        delete strategies[_token];
        // aave to usd, etc...
        delete priceOracle[_token];
    }

    function updateStrategy(
        address _token,
        address _strategy,
        address _priceOracle
    ) external onlyOwner {
        require(IStrategy(_strategy).want() == _token, "INCOMPATIBLE_STRATEGY");
        address currentStrategy = strategies[_token];
        if (currentStrategy != address(0)) {
            // in case withdrawall returns multiple (other) tokens.
            // deposit needs to be called manually with these token addresses
            // TODO, consider returning array of address on withdrawAll
            IStrategy(currentStrategy).withdrawAll();
        } else {
            // new strategy
            tokens.push(_token);
        }
        strategies[_token] = _strategy;
        priceOracle[_token] = AggregatorV3Interface(_priceOracle);
        deposit(_token);
    }

    function saveTokenFromStrategy(address _token, address _toSave)
        external
        onlyOwner
    {
        address strategy = strategies[_token];
        require(strategy != address(0), "NO_TOKEN_STRATEGY");
        // otherwise no state change, withdraw and deposit
        require(IStrategy(strategy).want() != _toSave, "EQUAL_WANT");

        IStrategy(strategy).withdraw(_toSave);
        deposit(_token);
    }
}
