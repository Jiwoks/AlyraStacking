// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Stacking is Ownable {

  IERC20 rewardToken;
  struct Pair {
    address aggregator;
    uint balance;
  }
  mapping (IERC20 => Pair) listOfPairs;
  mapping (address => mapping (IERC20 => uint)) accountBalance;

  event TokenAttached (IERC20 token, address aggregator);
  event TokenDeposited (IERC20 token, address account, uint amount);
  event TokenWithdrawed (IERC20 token, address account, uint amount);

  modifier onlyAttachedToken (IERC20 _token) {
    require(listOfPairs[_token].aggregator != address(0), 'Token not yet allowed');
    _;
  }

  constructor (IERC20 _rewardToken) {
    rewardToken = _rewardToken;
  }

  function attachToken (IERC20 _token, address _aggregator) onlyOwner external {
    require (listOfPairs[_token].aggregator == address(0), 'Token already attached');
    listOfPairs[_token].aggregator = _aggregator;
    emit TokenAttached (_token, _aggregator);
  }

  function deposit (IERC20 _token, uint _amount) onlyAttachedToken (_token) external {
    accountBalance[msg.sender][_token] += _amount;
    listOfPairs[_token].balance += _amount;
    require ( _token.transferFrom(msg.sender, address(this), _amount), "Transfer failed");
    emit TokenDeposited (_token, msg.sender, _amount);
  }

  function withdraw (IERC20 _token, uint _amount) onlyAttachedToken (_token) external {
    require(accountBalance[msg.sender][_token] > 0 && _amount <= accountBalance[msg.sender][_token], 'Insufficient balance');
    accountBalance[msg.sender][_token] -= _amount;
    listOfPairs[_token].balance -= _amount;
    require ( _token.transfer(msg.sender, _amount), "Transfer failed");
    emit TokenWithdrawed (_token, msg.sender, _amount);
  }

  function balanceOf (IERC20 _token) onlyAttachedToken(_token) external view returns (uint) {
    return accountBalance[msg.sender][_token];
  }

  function tvlOf (IERC20 _token) external view returns (uint) {
    return listOfPairs[_token].balance;
  }

}
