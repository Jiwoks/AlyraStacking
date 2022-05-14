// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MockOracle is AggregatorV3Interface, Ownable {
    uint256 private p_version;
    int256 private p_data;
    uint8 private p_decimals;
    string private p_description;

    constructor(uint8 _decimals, uint256 _version, string memory _description) {
        p_decimals = _decimals;
        p_version = _version;
        p_description = _description;
    }

    function decimals() external view returns (uint8) {
        return p_decimals;
    }

    function description() external view returns (string memory) {
        return p_description;
    }

    function version() external view returns (uint256) {
        return p_version;
    }

    function setData(int256 _data) external onlyOwner {
        p_data = _data;
    }

    // getRoundData and latestRoundData should both raise "No data present"
    // if they do not have data to report, instead of returning unset values
    // which could be misinterpreted as actual reported values.
    function getRoundData(uint80 /*_roundId*/)
    public
    view
    returns (
        uint80 roundId,
        int256 answer,
        uint256 startedAt,
        uint256 updatedAt,
        uint80 answeredInRound
    ) {
        return (uint80(0), p_data, block.timestamp, block.timestamp, uint80(0));
    }

    function latestRoundData()
    external
    view
    returns (
        uint80 roundId,
        int256 answer,
        uint256 startedAt,
        uint256 updatedAt,
        uint80 answeredInRound
    ) {
        return getRoundData(0);
    }
}
