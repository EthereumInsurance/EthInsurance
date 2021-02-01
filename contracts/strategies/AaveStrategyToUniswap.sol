//SPDX-License-Identifier: MIT
pragma solidity ^0.7.4;
pragma abicoder v2;

import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

import "../interfaces/aaveV2/IAaveGovernanceV2.sol";

import "../interfaces/IStrategyManager.sol";
import "../interfaces/IStrategy.sol";

contract AaveStrategyToUniswap is IStrategy, Ownable {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    IUniswapV2Router02 router = IUniswapV2Router02(
        0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D
    );

    address public strategyManager;
    address public override want; // aave token
    address public swap; // dai
    // https://docs.aave.com/developers/protocol-governance/governance#deployed-contracts
    IAaveGovernanceV2 public aaveGovernanceV2;

    uint256[] public runningProposals;

    // todo, include stake aave, https://docs.aave.com/developers/protocol-governance/staking-aave#stake
    // create new strategy for staked aave
    // delegate voting to this addresss https://docs.aave.com/developers/protocol-governance/governance#delegatebytype
    // `submitVote` will include the staked aave voting power
    // reference: https://docs.aave.com/developers/protocol-governance/governance#overview

    modifier onlyStrategyManager() {
        require(
            msg.sender == strategyManager || msg.sender == address(this),
            "strategyManager"
        );
        _;
    }

    constructor(
        address _want,
        address _swap,
        address _aaveGovernanceV2,
        address _strategyManager
    ) public {
        want = _want;
        swap = _swap;
        aaveGovernanceV2 = IAaveGovernanceV2(_aaveGovernanceV2);
        strategyManager = _strategyManager;
    }

    function deposit() external override {
        // do nothing
    }

    function withdrawAll()
        public
        override
        onlyStrategyManager
        returns (uint256)
    {
        updateProposals();
        require(runningProposals.length == 0, "ACTIVE_VOTE");

        uint256 balance = IERC20(want).balanceOf(address(this));
        IERC20(want).transfer(msg.sender, balance);
        return balance;
    }

    function withdraw(uint256 _amount) public override onlyStrategyManager {
        updateProposals();
        require(runningProposals.length == 0, "ACTIVE_VOTE");

        IERC20(want).transfer(msg.sender, _amount);
    }

    function withdraw(address _token) external override onlyStrategyManager {
        if (_token == want) {
            withdrawAll();
            return;
        }
        IERC20 token = IERC20(_token);
        token.safeTransfer(msg.sender, token.balanceOf(address(this)));
    }

    function balanceOf() external override view returns (uint256) {
        return IERC20(want).balanceOf(address(this));
    }

    // ignore running votes
    function forceWithdraw(uint256 _amount) external onlyOwner {
        IERC20(want).transfer(strategyManager, _amount);
    }

    function updateProposals() internal {
        // there should be a better way to replace this array
        uint256[] memory newRunningProposals = new uint256[](
            runningProposals.length
        );
        for (uint256 i = 0; i < runningProposals.length; i++) {
            // tokens should be held until vote is not one of the states below.
            IAaveGovernanceV2.ProposalState state = aaveGovernanceV2
                .getProposalState(runningProposals[i]);
            if (
                state == IAaveGovernanceV2.ProposalState.Pending ||
                state == IAaveGovernanceV2.ProposalState.Active ||
                state == IAaveGovernanceV2.ProposalState.Succeeded ||
                state == IAaveGovernanceV2.ProposalState.Queued
            ) {
                newRunningProposals[i] = runningProposals[i];
            }
        }

        delete runningProposals;
        for (uint256 i = 0; i < newRunningProposals.length; i++) {
            uint256 proposal = newRunningProposals[i];
            if (proposal != 0) {
                runningProposals.push(proposal);
            }
        }
    }

    function submitVote(uint256 _proposalId, bool _support) external onlyOwner {
        // vote can be submitted once, right? Reverts otherwise
        aaveGovernanceV2.submitVote(_proposalId, _support);
        runningProposals.push(_proposalId);
    }

    function createProposal(
        address _executor,
        address[] memory _targets,
        uint256[] memory _values,
        string[] memory _signatures,
        bytes[] memory _calldatas,
        bool[] memory _withDelegatecalls,
        bytes32 _ipfsHash
    ) external onlyOwner returns (uint256) {
        return
            aaveGovernanceV2.create(
                IExecutorWithTimelock(_executor),
                _targets,
                _values,
                _signatures,
                _calldatas,
                _withDelegatecalls,
                _ipfsHash
            );
    }

    function swapToTokenViaETH(uint256 _amount, uint256 _toMinAmount)
        external
        onlyOwner
    {
        updateProposals();
        require(runningProposals.length == 0, "ACTIVE_VOTE");
        IERC20(want).approve(address(router), _amount);
        // swap aave to eth to {token} and send to strategymanager
        address[] memory path = new address[](3);
        path[0] = want; // aave
        path[1] = router.WETH();
        path[2] = swap; // dai
        router.swapExactTokensForTokens(
            _amount,
            _toMinAmount,
            path,
            strategyManager,
            block.timestamp
        );
        // tell the strategy manager we deposited this new token.
        IStrategyManager(strategyManager).deposit(swap);
    }
}
