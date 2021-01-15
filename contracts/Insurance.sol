//SPDX-License-Identifier: Unlicense
pragma solidity ^0.7.4;

import "hardhat/console.sol";

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

interface IPayOut {
  function pay(uint256 _amount) external;
}

contract Insurance is Ownable {
  using SafeMath for uint256;

  IERC20 public token;

  struct ProtocolProfile {
    // translated to the value of the native erc20 of the pool
    uint256 requestFundsCovered;
    uint256 riskFactor;
  }

  mapping (bytes32 => ProtocolProfile) public profiles;
  mapping (bytes32 => uint256) public profileBalances;
  mapping (bytes32 => uint256) public profilePremiumLastPaid;

  mapping(address => uint256) public stakes;
  uint256 public totalStake;
  // in case of apy on funds. this will be added to total funds
  uint256 public totalStakeFunds;
  // time lock for withdraw period in blocks
  uint256 public timeLock;

  constructor(address _token) {
    token = IERC20(_token);
  }

  function setTimeLock(uint256 _timeLock) external onlyOwner {
    timeLock = _timeLock;
  }

  // a governing contract will call the update profiles
  // protocols can do a insurance request against this contract
  function updateProfiles(bytes32 _protocol, uint256 _requestFundsCovered, uint256 _riskFactor, uint256 _premiumLastPaid) external onlyOwner {
    require(_protocol != bytes32(0), "INVALID_PROTOCOL");
    require(_requestFundsCovered != 0, "INVALID_FUND");
    require(_riskFactor != 0, "INVALID_RISK");
    profiles[_protocol] = ProtocolProfile(_requestFundsCovered, _riskFactor);

    if (_premiumLastPaid == 0) {
      // dont update
      require(profilePremiumLastPaid[_protocol] > 0, "INVALID_LAST_PAID");
      return;
    }
    if (_premiumLastPaid == uint256(-1)) {
      profilePremiumLastPaid[_protocol] = block.timestamp;
    } else {
      profilePremiumLastPaid[_protocol] = _premiumLastPaid;
    }
  }

  function insurancePayout(bytes32 _protocol, uint256 _amount, address _payout) external onlyOwner {
    require(coveredFunds(_protocol) >= _amount, "INSUFFICIENT_COVERAGE");

    IPayOut payout = IPayOut(_payout);
    payout.pay(_amount);
    totalStakeFunds = totalStakeFunds.sub(_amount);
  }

  function stakeFunds(uint256 _amount) external {
    require(token.transferFrom(msg.sender, address(this), _amount), "INSUFFICIENT_FUNDS");
    totalStake = totalStake.add(_amount);
    totalStakeFunds = totalStakeFunds.add(_amount);
    stakes[msg.sender] = stakes[msg.sender].add(_amount);
  }

  function getFunds(address _staker) external view returns(uint256) {
    uint256 stake = stakes[_staker];
    return stake.mul(totalStakeFunds).div(totalStake);
  }

  // to withdraw funds, add them to a vesting schedule
  //function withdrawFunds(uint256 _amount) external

  // to claim the withdrawed funds, if the vesting period is ended
  //function claimFunds(uint256 _entry) external

  function addProfileBalance(bytes32 _protocol, uint256 _amount) external {
    require(token.transferFrom(msg.sender, address(this), _amount), "INSUFFICIENT_FUNDS");
    profileBalances[_protocol] =  profileBalances[_protocol].add(_amount);
  }

  function payOffDebt(bytes32 _protocol) external {
    uint256 debt = accruedDebt(_protocol);
    // will throw an error if the balance is insufficient
    profileBalances[_protocol] = profileBalances[_protocol].sub(debt);
    // move funds to the staker pool
    totalStakeFunds = totalStakeFunds.add(debt);
    profilePremiumLastPaid[_protocol] = block.timestamp;
  }

  function accruedDebt(bytes32 _protocol) public view returns(uint256) {
    return block.timestamp.sub(
      profilePremiumLastPaid[_protocol]
    ).mul(premiumPerBlock(_protocol));
  }

  function premiumPerBlock(bytes32 _protocol) public view returns(uint256) {
    ProtocolProfile memory p = profiles[_protocol];
    return coveredFunds(_protocol).mul(p.riskFactor).div(10**18);
  }

  function coveredFunds(bytes32 _protocol) public view returns(uint256) {
    ProtocolProfile memory p = profiles[_protocol];
    require(p.requestFundsCovered > 0, "PROFILE_NOT_FOUND");
    if (totalStakeFunds > p.requestFundsCovered) {
      return p.requestFundsCovered;
    }
    return totalStakeFunds;
  }
}
