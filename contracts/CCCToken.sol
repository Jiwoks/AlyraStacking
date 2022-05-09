// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

interface IStackedERC20 is IERC20 {

    event AdminAllowed(address admin);
    event AdminRevoked(address admin);

    function mint(uint256 amount) external;
    function allowAdmin (address admin) external;
    function revokeAdmin (address admin) external;
}

contract CCCToken is IStackedERC20, ERC20, Ownable {

    mapping (address => bool) admins;

    constructor(uint256 initialSupply) ERC20("Caribou Crew Coin", "CCC") {
        _mint(msg.sender, initialSupply);
    }

    function mint (uint _amount) external {
        require (msg.sender == owner() || admins[msg.sender], 'Not allowed');
        _mint(msg.sender, _amount);
    }

    function allowAdmin (address _admin) external onlyOwner {
        admins[_admin] = true;
        emit AdminAllowed(_admin);
    }

    function revokeAdmin (address _admin) external onlyOwner {
        require(_admin != owner(), 'Not allowed to self revoke');
        delete(admins[_admin]);
        emit AdminRevoked(_admin);
    }
}
