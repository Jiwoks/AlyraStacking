// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract Stacking is Ownable {

  using SafeERC20 for IERC20;

  IERC20 rewardToken;        // Token used for rewards

  struct Pool {
    address oracle;          // Address used for pool oracle
    uint256 balance;         // Total value locked inside the pool
    uint256 rewardPerShare;  // Rewards to distribute per share
    uint256 rewardPerSecond; // Rewards to distribute per second
    uint256 lastRewardBlock; // Last block timestamp where rewards are evaluated
  }

  struct Account {
    uint256 balance;         // Amount of token provided by this account
    uint256 rewardDebt;      // Reward debt amount
  }

  mapping (IERC20 => Pool ) public pools;
  mapping (address => mapping (IERC20 => Account)) public accounts;

  event PoolCreated (IERC20 token, address oracle, string symbol);
  event Deposit (IERC20 token, address account, uint256 amount);
  event Withdraw (IERC20 token, address account, uint256 amount);

  modifier onlyCreatedToken (IERC20 _token) {
    require(pools[_token].oracle != address(0), 'Token not yet allowed');
    _;
  }

  constructor (IERC20 _rewardToken) {
    rewardToken = _rewardToken;
  }

  function createPool (IERC20 _token, address _oracle, uint256 _rewardPerSecond, string calldata symbol) onlyOwner external {
    require (pools[_token].oracle == address(0), 'Token already attached');
    pools[_token].oracle = _oracle;
    pools[_token].rewardPerSecond = _rewardPerSecond;

    emit PoolCreated (_token, _oracle, symbol);
  }

  function _updatePool (IERC20 _token) internal {
    Pool storage pool = pools[_token];
    uint256 currentRewardBlock = block.timestamp;

    if ( pool.balance == 0 ) {
      pool.lastRewardBlock = currentRewardBlock;
      return;
    }

    uint pendingRewards = (currentRewardBlock - pool.lastRewardBlock) * pool.rewardPerSecond;
    pool.rewardPerShare = pool.rewardPerShare + (pendingRewards / pool.balance);
    pool.lastRewardBlock = currentRewardBlock;
  }

  function deposit (IERC20 _token, uint256 _amount) onlyCreatedToken (_token) external {
    require(_amount > 0, 'Only not null amount');

    Pool storage pool = pools[_token];
    Account storage account = accounts[msg.sender][_token];

    _updatePool(_token);

    if ( account.balance > 0 ) {
      uint256 pending = account.balance * pool.rewardPerShare  - account.rewardDebt;
      safeRewardTransfer(msg.sender, pending);
    }

    _token.safeTransferFrom(address(msg.sender), address(this), _amount);

    account.balance = account.balance + _amount;
    account.rewardDebt = account.balance * pool.rewardPerShare;
    pool.balance = pool.balance + _amount;

    emit Deposit (_token, msg.sender, _amount);
  }

  function withdraw (IERC20 _token, uint256 _amount) onlyCreatedToken (_token) external {
    require(accounts[msg.sender][_token].balance > 0 && _amount <= accounts[msg.sender][_token].balance, 'Insufficient balance');

    Pool storage pool = pools[_token];
    Account storage account = accounts[msg.sender][_token];

    _updatePool(_token);

    uint256 pending = account.balance * pool.rewardPerShare - account.rewardDebt;
    if (pending > 0) {
      safeRewardTransfer(msg.sender, pending);
    }

    // withdraw amount and update internal balances
    if ( _amount > 0 ) {
      _token.safeTransfer(address(msg.sender), _amount);
      account.balance = account.balance - _amount;
      pool.balance = pool.balance - _amount;
    }

    account.rewardDebt = account.rewardDebt * pool.rewardPerShare;

    emit Withdraw (_token, msg.sender, _amount);
  }

  function balanceOf (IERC20 _token) onlyCreatedToken(_token) external view returns (uint256) {
    return accounts[msg.sender][_token].balance;
  }

  function tvlOf (IERC20 _token) external view returns (uint256) {
    return pools[_token].balance;
  }

  function safeRewardTransfer(address _to, uint256 _amount) internal {
    rewardToken.safeTransfer(_to, _amount);
  }

}
