// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract StackingTonted is Ownable {

	/*
	** @notice each staker has a mapping of each token staked with the amount.
	*/
	mapping(address => mapping(IERC20 => uint256)) public stackers;

	/*
	** @notice each pool has the total ammount of token staked.
	*/
	mapping(IERC20 => uint256) public pools;

	event Deposited(IERC20 token, address owner, uint256 amount);
	event Withdrawn(IERC20 token, address owner, uint256 amount);


	function deposit(IERC20 _erc20Address, uint256 _amount) external {
		_erc20Address.transferFrom(msg.sender, address(this), _amount);
		stackers[msg.sender][_erc20Address] += _amount;
		pools[_erc20Address] += _amount;
		emit Deposited(_erc20Address, msg.sender, _amount);
	}

	function withdraw(IERC20 _erc20Address, uint256 _amount) external {
		require(stackers[msg.sender][_erc20Address] >= _amount, "insufficient balance");
		_erc20Address.transfer(msg.sender, _amount);
		stackers[msg.sender][_erc20Address] -= _amount;
		pools[_erc20Address] -= _amount;
		emit Withdrawn(_erc20Address, msg.sender, _amount);
	}
}