//SPDX-License-Identifier: MIT
pragma solidity ^0.7.4;

import "@openzeppelin/contracts/access/Ownable.sol";

import "../interfaces/chainlink/AggregatorV3Interface.sol";

contract MockOracle is AggregatorV3Interface, Ownable {
    function decimals() external override view returns (uint8) {
        return 8;
    }

    function description() external override view returns (string memory) {
        return "MOCK_ORACLE";
    }

    function version() external override view returns (uint256) {
        return 1;
    }

    // getRoundData and latestRoundData should both raise "No data present"
    // if they do not have data to report, instead of returning unset values
    // which could be misinterpreted as actual reported values.
    function getRoundData(uint80 _roundId)
        external
        override
        view
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        )
    {
        return (1, 1, 1, 1, 1);
    }

    int256 public price;

    function setPrice(int256 _price) external onlyOwner {
        price = _price;
    }

    function latestRoundData()
        external
        override
        view
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        )
    {
        return (1, price, 1, 1, 1);
    }
}
