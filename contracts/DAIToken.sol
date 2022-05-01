// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract DAIToken is ERC20 {
    constructor(uint256 initialSupply) ERC20("DAI", "DAI") {
        _mint(msg.sender, initialSupply);
    }
}
