// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

interface IStackedERC20 is IERC20 {

    /**
     * @notice Event triggered when an admin is added into the allowed list
     */
    event AdminAllowed(address admin);
    /**
     * @notice Event triggered when an admin is revoked from the allowed list
     */
    event AdminRevoked(address admin);

    function mint(uint256 amount) external;
    function allowAdmin (address admin) external;
    function revokeAdmin (address admin) external;
}

contract CCTToken is IStackedERC20, ERC20, Ownable {

    mapping (address => bool) admins;

    /**
     * @dev Contructor, requires an initial supply value
     */
    constructor(uint256 initialSupply) ERC20("Caribou Crew Coin", "CCT") {
        _mint(msg.sender, initialSupply);
    }

    /**
     * @notice Mint this custom token
     * @dev Only the owner or allowed admins can mint token
     *
     * @param _amount         : amount of token to mint
     */
    function mint (uint _amount) external {
        require (msg.sender == owner() || admins[msg.sender], 'Not allowed');
        _mint(msg.sender, _amount);
    }

    /**
     * @notice Mark the admin address as allowed
     * @dev Only the owner can allow admins
     * @dev Only the owner or allowed admins can access some methods
     *
     * @param _admin         : admin address to mark as allowed
     *
     * @dev emits AdminAllowed (_admin).
     */
    function allowAdmin (address _admin) external onlyOwner {
        admins[_admin] = true;
        emit AdminAllowed(_admin);
    }

    /**
     * @notice Mark the admin address as revoked
     * @dev Only the owner can revoke admins
     *
     * @dev emits revokeAdmin (_admin).
     */
    function revokeAdmin (address _admin) external onlyOwner {
        require(_admin != owner(), 'Not allowed to self revoke');
        delete(admins[_admin]);
        emit AdminRevoked(_admin);
    }
}
