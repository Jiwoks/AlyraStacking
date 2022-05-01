// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract StackingTonted is Ownable {

	/*
	** @notice each staker has a mapping of each token staked with the amount.
	*/
	mapping(address => mapping(IERC20 => uint256)) stackers;

	/*
	** @notice each pool has the total ammount of token staked.
	*/
	mapping(IERC20 => uint256) pools;


	function deposit(IERC20 _erc20Address, uint256 _amount) external {
		_erc20Address.approve(address(this), _amount);
		_erc20Address.transfer(address(this), _amount);
		stackers[msg.sender][_erc20Address] += _amount;
	}

	function withdraw(IERC20 _erc20Address, uint256 _amount) external {
		stackers[msg.sender][_erc20Address] -= _amount;
		_erc20Address.transfer(msg.sender, _amount);
	}

}