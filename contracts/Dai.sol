// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

import "./Faucet.sol";

contract Dai is Faucet {
    constructor(uint256 initialSupply) Faucet(initialSupply, "Dai", "DAI.c") {}
}
