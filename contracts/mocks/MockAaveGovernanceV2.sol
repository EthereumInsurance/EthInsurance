//SPDX-License-Identifier: MIT
pragma solidity ^0.7.4;
pragma abicoder v2;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "../interfaces/aaveV2/IAaveGovernanceV2.sol";

contract MockAaveGovernanceV2 is Ownable {
    IERC20 public aave;

    constructor(IERC20 _aave) public {
        aave = _aave;
    }

    event VoteEmitted(
        uint256 id,
        address indexed voter,
        bool support,
        uint256 votingPower
    );
    mapping(uint256 => IAaveGovernanceV2.ProposalState) public states;

    function submitVote(uint256 proposalId, bool support) external {
        require(
            states[proposalId] != IAaveGovernanceV2.ProposalState.Pending,
            "PENDING_PROPOSAL"
        );
        emit VoteEmitted(
            proposalId,
            msg.sender,
            support,
            aave.balanceOf(msg.sender)
        );
    }

    uint256 public proposalCounter;

    function create(
        IExecutorWithTimelock executor,
        address[] memory targets,
        uint256[] memory values,
        string[] memory signatures,
        bytes[] memory calldatas,
        bool[] memory withDelegatecalls,
        bytes32 ipfsHash
    ) external returns (uint256) {
        proposalCounter++;
        return proposalCounter;
    }

    function setProposalState(
        uint256 proposalId,
        IAaveGovernanceV2.ProposalState state
    ) external onlyOwner {
        states[proposalId] = state;
    }

    function getProposalState(uint256 proposalId)
        external
        view
        returns (IAaveGovernanceV2.ProposalState)
    {
        return states[proposalId];
    }
}
