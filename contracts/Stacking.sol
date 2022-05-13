// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./CCCToken.sol";

contract Stacking is Ownable {

  using SafeERC20 for IERC20;
  using SafeERC20 for IStackedERC20;

//  AggregatorV3Interface internal priceFeed;

  IStackedERC20 rewardToken;        // Token used for rewards

  /**
   * @param oracle          : Address used for pool oracle
   * @param balance         : Total value locked inside the pool
   * @param rewardPerShare  : Rewards to distribute per share
   * @param rewardPerSecond : Rewards to distribute per second
   * @param lastRewardBlock : Last block timestamp where rewards are evaluated
   */
  struct Pool {
    address oracle;
    uint256 balance;
    uint256 rewardPerShare;
    uint256 rewardPerSecond;
    uint256 lastRewardBlock;
  }

  /**
   * @param balance   : Amount of token provided by this account
   * @param rewardDebt: Reward debt amount
   */
  struct Account {
    uint256 balance;         // Amount of token provided by this account
    uint256 rewardDebt;      // Reward debt amount
    uint256 rewardPending;   // Reward pending amount
  }

  mapping (IERC20 => Pool ) public pools;

  // @dev [msg.sender][token] = {balance, rewardDebt}
  mapping (address => mapping (IERC20 => Account)) public accounts;

  event PoolCreated (IERC20 token, address oracle, string symbol);
  event Deposit (IERC20 token, address account, uint256 amount);
  event Withdraw (IERC20 token, address account, uint256 amount);
  event Claim (address account, uint256 amount);

  /**
   * @notice Check if the token pool exists
   *
   * @param _token  : token address to check
   */
  modifier onlyCreatedToken (IERC20 _token) {
    require(pools[_token].oracle != address(0), 'Token not yet allowed');
    _;
  }

  constructor (IStackedERC20 _rewardToken) {
    rewardToken = _rewardToken;
  }

  /*
   * @notice Creation of a pool to allow users to stake their token
   * @notice The value of the token is peg with de Chainlink oracle
   * @notice Only the owner can create a pool
   *
   * @param _token          : address of the token put in pool
   * @param _oracle         : address of the Chainlink oracle for this token
   * @param _rewardPerSecond: reward per second for this pool
   * @param symbol          : symbol of the token
   *
   * @emits PoolCreated (_token, _oracle, symbol).
   */
  // TODO remove symbol and use _token.symbol()
  // TODO BONUS function for create a pool with anything token and peg then to default oracle
  function createPool (IERC20 _token, address _oracle, uint256 _rewardPerSecond, string calldata symbol) onlyOwner external {
    require (pools[_token].oracle == address(0), 'Token already attached');
    pools[_token].oracle = _oracle;
    pools[_token].rewardPerSecond = _rewardPerSecond;
    pools[_token].lastRewardBlock = block.timestamp;

    emit PoolCreated (_token, _oracle, symbol);
  }

  /**
   * @notice Update the data of the pool
   *
   * @param _token          : address of the token where the pool must be update
   */
  function _updatePool (IERC20 _token) internal {
    Pool storage pool = pools[_token];
    uint256 currentRewardBlock = block.timestamp;

    if ( pool.balance == 0 ) {
      pool.lastRewardBlock = currentRewardBlock;
      return;
    }

    // Calculate pending rewards for the incentive token
    uint256 pendingRewards = (currentRewardBlock - pool.lastRewardBlock) * pool.rewardPerSecond;
    pool.rewardPerShare = pool.rewardPerShare + (pendingRewards  *  1e12 / pool.balance);
    pool.lastRewardBlock = currentRewardBlock;
  }

  /*
   * @notice Deposit token to stake by the user
   * @notice Update the data of the pool
   * @notice Send current rewards if exists to the sender
   *
   * @param _token  : token address to stake
   * @param _amount : deposit amount
   *
   * @emits Deposit (_token, msg.sender, _amount);
   */
  function deposit (IERC20 _token, uint256 _amount) onlyCreatedToken (_token) external {
    require(_amount > 0, 'Only not null amount');

    Pool storage pool = pools[_token];
    Account storage account = accounts[msg.sender][_token];

    _updatePool(_token);

    if ( account.balance > 0 ) {
      account.rewardPending += (account.balance * pool.rewardPerShare) /  1e12  - account.rewardDebt;
    }

    _token.safeTransferFrom(address(msg.sender), address(this), _amount);

    account.balance = account.balance + _amount;
    account.rewardDebt = account.balance * pool.rewardPerShare /  1e12;
    pool.balance = pool.balance + _amount;

    emit Deposit (_token, msg.sender, _amount);
  }

  /*
   * @notice Withdraw the token staken by the user
   * @notice Update the data of the pool
   * @notice Send current rewards pending
   *
   * @param _token  : token address to unstake
   * @param _amount : deposit amount
   *
   * @emits Deposit (_token, msg.sender, _amount);
   */
  function withdraw (IERC20 _token, uint256 _amount) onlyCreatedToken (_token) external {
    require(accounts[msg.sender][_token].balance > 0 && _amount <= accounts[msg.sender][_token].balance, 'Insufficient balance');
    require(_amount > 0, "Amount 0");

    Pool storage pool = pools[_token];
    Account storage account = accounts[msg.sender][_token];

    _updatePool(_token);

    account.rewardPending += account.balance * pool.rewardPerShare / 1e12 - account.rewardDebt;
    account.balance = account.balance  - _amount;
    pool.balance = pool.balance - _amount;
    account.rewardDebt = account.balance * pool.rewardPerShare / 1e12;

    // withdraw amount and update internal balances
    _token.safeTransfer(address(msg.sender), _amount);

    emit Withdraw (_token, msg.sender, _amount);
  }

  /**
   * @notice
   *
   * @param _token  : address of the token to know the balance
   *
   * @return the total amount of the tokens staked in the pool by the sender
   */
  // TODO named the returns variable
  function balanceOf (IERC20 _token) onlyCreatedToken(_token) external view returns (uint256) {
    return accounts[msg.sender][_token].balance;
  }


  /**
   * @notice
   *
   * @param _token  : address of the token to know the balance
   *
   * @return the total amount of the tokens staked in the pool
   */
  // TODO named the returns variable
  function tvlOf (IERC20 _token) external view returns (uint256) {
    return pools[_token].balance;
  }

  /**
   * @notice mint the token needed for send using the mint methods of the ERC20.
   * @notice send the reward using the safeTransfer methode of SafeERC20.
   *
   * @param _to     : address to send the reward
   * @param _amount : amount of reward to send
   *
   */
  // TODO emit the claim event here instead withdraw and deposit function
  function safeRewardTransfer(address _to, uint256 _amount) internal {
    rewardToken.mint(_amount);
    rewardToken.safeTransfer(_to, _amount);
  }

  /*
   * @dev function to see pending Tokens on frontend.
   *
   * @param _token  : token address of the pool to check the pending reward
   * @param _user   : account address of the user to check the pending reward
   *
   * @return the pending reward
   */
  function claimable(IERC20 _token, address _user) external returns (uint256 rewards) {
    Pool memory pool = pools[_token];
    Account memory account = accounts[_user][_token];

    _updatePool(_token);

    if (pool.balance == 0) {
      return 0;
    }

    uint256 pendingRewards = (block.timestamp - pool.lastRewardBlock) * pool.rewardPerSecond;
    return account.balance * (pool.rewardPerShare + (pendingRewards * 1e12 / pool.balance)) /  1e12 - account.rewardDebt + account.rewardPending;
  }

  function getDataFeed(IERC20 _token) external view returns (int) {
    require (pools[_token].oracle != address(0), 'DataFeed not available');
    AggregatorV3Interface priceFeed = AggregatorV3Interface(0x22B58f1EbEDfCA50feF632bD73368b2FdA96D541);
    ( /*uint80 roundID*/, int price, /*uint startedAt*/, /*uint timeStamp*/, /*uint80
    answeredInRound*/ ) = priceFeed.latestRoundData();
    return price;
  }

  function claim (IStackedERC20 _token) external {
    _claim(_token, msg.sender);
  }

  function claim(IStackedERC20 _token, address _to) external {
    _claim(_token, _to);
  }

  function _claim(IStackedERC20 _token, address _to) internal {
    Pool memory pool = pools[_token];
    Account storage account = accounts[msg.sender][_token];

    uint256 pendingRewards = (block.timestamp - pool.lastRewardBlock) * pool.rewardPerSecond;
    uint256 pending = account.balance * (pool.rewardPerShare + (pendingRewards * 1e12 / pool.balance)) /  1e12 - account.rewardDebt + account.rewardPending;

//    require(pending > 0, 'Insufficient rewards balance');

    account.rewardPending = 0;
    account.rewardDebt = account.balance * pool.rewardPerShare / 1e12;

    safeRewardTransfer(_to, pending);
    emit Claim(_to, pending);
  }
}
