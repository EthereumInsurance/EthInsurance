//SPDX-License-Identifier: MIT
pragma solidity ^0.7.4;

import "hardhat/console.sol";

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

import "./interfaces/IPool.sol";
import "./interfaces/IPayOut.sol";
import "./interfaces/IStake.sol";
import "./interfaces/IStrategyManager.sol";

contract Insurance is IPool, Ownable {
    using SafeMath for uint256;

    IERC20 public override token;
    IStake public stakeToken;
    IStrategyManager public strategyManager;

    bool public redirectStakeToStrategy;

    struct ProtocolProfile {
        // translated to the value of the native erc20 of the pool
        uint256 maxFundsCovered;
        // percentage of funds covered
        uint256 percentagePremiumPerBlock;
    }

    struct StakeWithdraw {
        uint256 blockInitiated;
        uint256 stake;
    }

    mapping(bytes32 => bool) public protocolsCovered;
    bytes32[] public protocols;

    mapping(bytes32 => ProtocolProfile) public profiles;
    mapping(bytes32 => uint256) public profileBalances;
    mapping(bytes32 => uint256) public profilePremiumLastPaid;

    mapping(address => StakeWithdraw) public stakesWithdraw;
    // in case of apy on funds. this will be added to total funds
    uint256 internal totalStakedFunds;
    // time lock for withdraw period in blocks
    uint256 public timeLock;

    constructor(
        address _token,
        address _stakeToken,
        address _strategyManager
    ) public {
        token = IERC20(_token);
        stakeToken = IStake(_stakeToken);
        strategyManager = IStrategyManager(_strategyManager);
    }

    function getTotalStakedFunds() public view returns (uint256) {
        return totalStakedFunds.add(strategyManager.balanceOfNative());
    }

    function _depositStrategyManager(uint256 _amount) internal {
        require(
            token.transfer(address(strategyManager), _amount),
            "INSUFFICIENT_FUNDS"
        );
        totalStakedFunds = totalStakedFunds.sub(_amount);
        strategyManager.deposit(address(token));
    }

    function _withdrawStrategyManager(uint256 _amount) internal {
        strategyManager.withdraw(address(token), _amount);
        totalStakedFunds = totalStakedFunds.add(_amount);
    }

    function withdrawStrategyManager(uint256 _amount) external onlyOwner {
        _withdrawStrategyManager(_amount);
    }

    function depositStrategyManager(uint256 _amount) external onlyOwner {
        _depositStrategyManager(_amount);
    }

    function setStrategyManager(address _strategyManager) external onlyOwner {
        //todo withdraw all funds
        strategyManager = IStrategyManager(_strategyManager);
    }

    function setRedirectStakeToStrategy(bool _redirect) external onlyOwner {
        redirectStakeToStrategy = _redirect;
    }

    function setTimeLock(uint256 _timeLock) external onlyOwner {
        timeLock = _timeLock;
    }

    // a governing contract will call the update profiles
    // protocols can do a insurance request against this contract
    function updateProfiles(
        bytes32 _protocol,
        uint256 _maxFundsCovered,
        uint256 _percentagePremiumPerBlock,
        uint256 _premiumLastPaid,
        bool _forceOpenDebtPay
    ) external onlyOwner {
        require(_protocol != bytes32(0), "INVALID_PROTOCOL");
        require(_maxFundsCovered != 0, "INVALID_FUND");
        require(_percentagePremiumPerBlock != 0, "INVALID_RISK");
        if (_forceOpenDebtPay) {
            require(tryPayOffDebt(_protocol, true), "FAILED_TO_PAY_DEBT");
        }
        profiles[_protocol] = ProtocolProfile(
            _maxFundsCovered,
            _percentagePremiumPerBlock
        );
        if (!protocolsCovered[_protocol]) {
            protocolsCovered[_protocol] = true;
            protocols.push(_protocol);
        }

        if (_premiumLastPaid == 0) {
            // dont update
            require(profilePremiumLastPaid[_protocol] > 0, "INVALID_LAST_PAID");
            return;
        }

        if (_premiumLastPaid == uint256(-1)) {
            profilePremiumLastPaid[_protocol] = block.number;
        } else {
            profilePremiumLastPaid[_protocol] = _premiumLastPaid;
        }
    }

    function removeProtocol(
        bytes32 _protocol,
        uint256 _index,
        bool _forceOpenDebtPay,
        address _balanceReceiver
    ) external onlyOwner {
        // do the index logic outside of solidity
        require(protocols[_index] == _protocol, "INVALID_INDEX");
        if (_forceOpenDebtPay) {
            require(tryPayOffDebt(_protocol, true), "FAILED_TO_PAY_DEBT");
        }
        // transfer remaining balance to user
        require(
            token.transferFrom(
                address(this),
                _balanceReceiver,
                profileBalances[_protocol]
            ),
            "INSUFFICIENT_FUNDS"
        );
        delete profiles[_protocol];
        delete profileBalances[_protocol];
        delete profilePremiumLastPaid[_protocol];
        protocolsCovered[_protocol] = false;
        // set last element to current index
        protocols[_index] = protocols[protocols.length - 1];
        // remove last element
        delete protocols[protocols.length - 1];
        protocols.pop();
    }

    function insurancePayout(
        bytes32 _protocol,
        uint256 _amount,
        address _payout
    ) external onlyOwner {
        require(coveredFunds(_protocol) >= _amount, "INSUFFICIENT_COVERAGE");
        require(token.transfer(_payout, _amount), "INSUFFICIENT_FUNDS");
        IPayOut payout = IPayOut(_payout);
        payout.deposit(address(token));
        totalStakedFunds = totalStakedFunds.sub(_amount);
    }

    function stakeFunds(uint256 _amount) external {
        require(
            token.transferFrom(msg.sender, address(this), _amount),
            "INSUFFICIENT_FUNDS"
        );
        // TODO, test this calculation with multiple scenarios
        uint256 totalStake = stakeToken.totalSupply();
        uint256 stake;
        if (totalStake == 0) {
            // mint initial stake
            stake = _amount;
        } else {
            // TODO, decicde if _tryPayOffDebtAll(true); should be called here
            // As this will give a better representation of the users stake
            // But will also (significantly) increase gas costs

            // mint stake based on funds in pool
            stake = _amount.mul(totalStake).div(getTotalStakedFunds());
        }
        totalStakedFunds = totalStakedFunds.add(_amount);
        stakeToken.mint(msg.sender, stake);
        if (redirectStakeToStrategy) {
            _depositStrategyManager(_amount);
        }
    }

    //@ todo, add view stake
    function getFunds(address _staker) external view returns (uint256) {
        return
            stakeToken.balanceOf(_staker).mul(getTotalStakedFunds()).div(
                stakeToken.totalSupply()
            );
    }

    // to withdraw funds, add them to a vesting schedule
    function withdrawStake(uint256 _amount) external {
        require(
            stakesWithdraw[msg.sender].blockInitiated == 0,
            "WITHDRAW_ACTIVE"
        );
        require(
            stakeToken.transferFrom(msg.sender, address(this), _amount),
            "TRANSFER_FAILED"
        );
        // totalStake sub? no right
        stakesWithdraw[msg.sender] = StakeWithdraw(block.number, _amount);
    }

    function cancelWithdraw() external {
        StakeWithdraw memory withdraw = stakesWithdraw[msg.sender];
        require(withdraw.blockInitiated != 0, "WITHDRAW_NOT_ACTIVE");
        require(
            withdraw.blockInitiated.add(timeLock) > block.number,
            "TIMELOCK_EXPIRED"
        );
        // if this one fails, contract is broken
        stakeToken.transfer(msg.sender, withdraw.stake);
        delete stakesWithdraw[msg.sender];
    }

    // to claim the withdrawed funds, if the vesting period is ended

    // everyone can execute a claim for any staker
    // this fights the game design where people call withdraw to skip the timeLock.
    // And only claim when a hack occurs.
    function claimFunds(address _staker) external {
        StakeWithdraw memory withdraw = stakesWithdraw[_staker];
        require(withdraw.blockInitiated != 0, "WITHDRAW_NOT_ACTIVE");
        require(
            withdraw.blockInitiated.add(timeLock) <= block.number,
            "TIMELOCK_ACTIVE"
        );
        // don't redirect to strategy manager
        // as this will be done a couple lines later
        _tryPayOffDebtAll(false);

        uint256 funds = withdraw.stake.mul(getTotalStakedFunds()).div(
            stakeToken.totalSupply()
        );
        if (funds > totalStakedFunds) {
            _withdrawStrategyManager(funds.sub(totalStakedFunds));
        } else if (redirectStakeToStrategy && funds < totalStakedFunds) {
            _depositStrategyManager(totalStakedFunds.sub(funds));
        }
        // if this one fails, contract is broken
        token.transfer(_staker, funds);
        stakeToken.burn(address(this), withdraw.stake);
        delete stakesWithdraw[_staker];
    }

    function addProfileBalance(bytes32 _protocol, uint256 _amount) external {
        require(
            token.transferFrom(msg.sender, address(this), _amount),
            "INSUFFICIENT_FUNDS"
        );
        profileBalances[_protocol] = profileBalances[_protocol].add(_amount);
    }

    function tryPayOffDebt(bytes32 _protocol, bool _useRedirect)
        internal
        returns (bool)
    {
        uint256 debt = accruedDebt(_protocol);
        if (debt > profileBalances[_protocol]) {
            return false;
        }
        profileBalances[_protocol] = profileBalances[_protocol].sub(debt);
        // move funds to the staker pool
        totalStakedFunds = totalStakedFunds.add(debt);
        profilePremiumLastPaid[_protocol] = block.number;
        // sent paid debt to strategy manager
        if (_useRedirect && redirectStakeToStrategy) {
            _depositStrategyManager(debt);
        }
        return true;
    }

    function payOffDebt(bytes32 _protocol) external {
        require(tryPayOffDebt(_protocol, true), "INSUFFICIENT_PROFILE_BALANCE");
    }

    function _tryPayOffDebtAll(bool _useRedirect) internal {
        for (uint256 i = 0; i < protocols.length; i++) {
            tryPayOffDebt(protocols[i], _useRedirect);
        }
    }

    function tryPayOffDebtAll() external {
        _tryPayOffDebtAll(true);
    }

    function accruedDebt(bytes32 _protocol) public view returns (uint256) {
        return
            block.number.sub(profilePremiumLastPaid[_protocol]).mul(
                premiumPerBlock(_protocol)
            );
    }

    function premiumPerBlock(bytes32 _protocol) public view returns (uint256) {
        ProtocolProfile memory p = profiles[_protocol];
        return
            coveredFunds(_protocol).mul(p.percentagePremiumPerBlock).div(
                10**18
            );
    }

    function coveredFunds(bytes32 _protocol) public view returns (uint256) {
        ProtocolProfile memory p = profiles[_protocol];
        require(p.maxFundsCovered > 0, "PROFILE_NOT_FOUND");
        if (getTotalStakedFunds() > p.maxFundsCovered) {
            return p.maxFundsCovered;
        }
        return getTotalStakedFunds();
    }
}
