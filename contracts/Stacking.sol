// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract Stacking is Ownable {

  using SafeMath for uint256;
  using SafeERC20 for IERC20;

  IERC20 rewardToken;        // Token used for rewards
  
  struct Pool {
    address oracle;          // Address used for pool oracle
    uint256 balance;         // total value locked inside the pool
    uint256 rewardDailyRate; // Daily rewards rate by reward's token
  }

  struct Account {
    uint256 balance;         // Amount of token provided by this account
    uint256 rewardDebt;      // Reward debt
    uint256 lastRewardBlock; // Last block used to distribute rewards
  }
  
  mapping (IERC20 => Pool ) public poolData;
  mapping (address => mapping (IERC20 => Account)) accountData;

  event PoolCreated (IERC20 token, address oracle);
  event TokenDeposited (IERC20 token, address account, uint256 amount);
  event TokenWithdrawed (IERC20 token, address account, uint256 amount);

  modifier onlyCreatedToken (IERC20 _token) {
    require(poolData[_token].oracle != address(0), 'Token not yet allowed');
    _;
  }

  constructor (IERC20 _rewardToken) {
    rewardToken = _rewardToken;
  }

  function createPool (IERC20 _token, address _oracle, uint256 _rewardDailyRate) onlyOwner external {
    require (poolData[_token].oracle == address(0), 'Token already attached');

    poolData[_token].oracle = _oracle;
    poolData[_token].rewardDailyRate = _rewardDailyRate;

    emit PoolCreated (_token, _oracle);
  }

  function deposit (IERC20 _token, uint256 _amount) onlyCreatedToken (_token) external {
    require(_amount > 0, 'Only not null amount');

    Pool storage pool = poolData[_token];
    Account storage account = accountData[msg.sender][_token];

    // eval rewards for previously deposited tokens
    _evalRewards(account, pool);

    _token.safeTransferFrom(address(msg.sender), address(this), _amount);

    account.balance = account.balance.add(_amount);
    account.lastRewardBlock = block.timestamp;
    pool.balance = pool.balance.add(_amount);

    emit TokenDeposited (_token, msg.sender, _amount);
  }

  function withdraw (IERC20 _token, uint256 _amount) onlyCreatedToken (_token) external {
    require(accountData[msg.sender][_token].balance > 0 && _amount <= accountData[msg.sender][_token].balance, 'Insufficient balance');

    Pool storage pool = poolData[_token];
    Account storage account = accountData[msg.sender][_token];

    // eval rewards for previously deposited tokens
    _evalRewards(account, pool);

    // withdraw amount and update internal balances
    if ( _amount > 0 ) {
      _token.safeTransfer(address(msg.sender), _amount);
      account.balance = account.balance.sub(_amount);
      pool.balance = pool.balance.sub(_amount);
    }

    emit TokenWithdrawed (_token, msg.sender, _amount);
  }

  function claim (IERC20 _token) external {
    Pool storage pool = poolData[_token];
    Account storage account = accountData[msg.sender][_token];

    // eval rewards for previously deposited tokens
    _evalRewards(account, pool);
  }

  function balanceOf (IERC20 _token) onlyCreatedToken(_token) external view returns (uint256) {
    return accountData[msg.sender][_token].balance;
  }

  function tvlOf (IERC20 _token) external view returns (uint256) {
    return poolData[_token].balance;
  }

  function safeRewardTransfer(address _to, uint256 _amount) internal {
    rewardToken.safeTransfer(_to, _amount);
  }

  function _evalRewards(Account memory account, Pool memory pool) internal {
    uint256 currentRewardBlock = block.timestamp;
    uint256 nbDays = currentRewardBlock.sub(account.lastRewardBlock).div(86400);
    uint256 pending = pool.rewardDailyRate.mul(nbDays);

    if ( pending > 0 ) {
      safeRewardTransfer(address(msg.sender), pending);
      // store reward block and total rewards
      account.lastRewardBlock = currentRewardBlock;
      account.rewardDebt = account.rewardDebt.add(pending);
    }
  }
}
