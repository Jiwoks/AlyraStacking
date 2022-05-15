// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

import "./Faucet.sol";

contract Link is Faucet {
    constructor(uint256 initialSupply) Faucet(initialSupply, "Link", "LINK.c") {}
}
