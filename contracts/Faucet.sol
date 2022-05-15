// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Faucet is ERC20 {
    mapping(address => uint256) private lastMint;

    constructor(uint256 initialSupply_, string memory name_, string memory symbol_) ERC20(name_, symbol_) {
        _mint(msg.sender, initialSupply_);
    }

    function faucet() public {
        require(block.timestamp > lastMint[msg.sender], "Can only mint 1 ether per hour");
        lastMint[msg.sender] = block.timestamp + 1 hours;
        _mint(msg.sender, 100 ether);
    }
}
