// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Stacking is Ownable {

  AggregatorV3Interface internal priceFeed;

  uint256 public rewardsPerSecond;

  struct ERC20Staked {
    uint256 date;
    uint256 amount;
    uint256 pendingRewards; // In case stacker adds more coin later we have to store how much reward he has accumulated before to add more
  }

  struct PoolInfo {
    uint256 lastRewardTimestamp;
    uint256 totalRewardsPending;
    uint256 tvl;
  }

  mapping(IERC20 => address) public allowedERC20s;
  mapping(IERC20 => PoolInfo) public pools;

  mapping(address => mapping(IERC20 => ERC20Staked)) public stackers;

  event PoolCreated(IERC20 token, string symbol);

  event Deposited(IERC20 token, address sender, uint256 amount);

  event Withdrawn(IERC20 token, address sender, uint256 amount);

  event Claimed(IERC20 token, address sender, uint256 amount);

  constructor(uint256 _rewardPerSecond) {
    rewardsPerSecond = _rewardPerSecond;
    priceFeed = AggregatorV3Interface(0x9326BFA02ADD2366b30bacB125260Af641031331);
  }

  /// Owner acl an ERC20 token
  function addPool(IERC20 _tokenAddress, address _aggregator, string calldata symbol) onlyOwner public {
    allowedERC20s[_tokenAddress] = _aggregator;
    emit PoolCreated(_tokenAddress, symbol);
  }

  function deposit(IERC20 _erc20Address, uint256 _amount) public {
    require(allowedERC20s[_erc20Address] != address(0x0), "This token has not been allowed yet");
    require(_amount > 0, "Amount 0");
    ERC20Staked storage stacker = stackers[msg.sender][_erc20Address];

    // We already have a staking for this address
    if (stacker.date != 0) {
      stacker.pendingRewards = (block.timestamp - stacker.date) * rewardsPerSecond;
    }

    stacker.date = block.timestamp;
    stacker.amount += _amount;
    stacker.date = block.timestamp;

    pools[_erc20Address].tvl += _amount;

    require(_erc20Address.transferFrom(msg.sender, address(this), _amount), "Transfer failed");
  }

  function withdraw(IERC20 _erc20Address, uint256 _amount) public {
    require(_amount > 0, "You must provide an amount > 0");

    ERC20Staked storage stacker = stackers[msg.sender][_erc20Address];

    require(stacker.amount >= _amount, "You don't have enough of this token");
    pools[_erc20Address].tvl -= _amount;

    _erc20Address.transfer(msg.sender, _amount);

    // todo: send reward

  }

  function calculate(uint256 _seconds, IERC20 _tokenAddress) private {

  }

  function claim() public {

  }

  function poolInfo(address token) public view returns(uint256 tvl) {

  }
}
