// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./CCCToken.sol";

contract Stacking is Ownable {
    using SafeERC20 for IERC20;
    using SafeERC20 for IStackedERC20;

    // Token used for rewards
    IStackedERC20 private rewardToken;

    /**
     * @param oracle          : Address used for pool oracle
     * @param decimalOracle   : decimals of token oracle
     * @param balance         : Total value locked inside the pool
     * @param rewardPerShare  : Rewards to distribute per share
     * @param rewardPerSecond : Rewards to distribute per second
     * @param lastRewardBlock : Last block timestamp where rewards are evaluated
     */
    struct Pool {
        address oracle;
        uint8 decimalOracle;
        uint256 balance;
        uint256 rewardPerShare;
        uint256 rewardPerSecond;
        uint256 lastRewardBlock;
    }

    /**
     * @param balance       : Amount of token provided by this account
     * @param rewardDebt    : Reward debt amount
     * @param rewardPending : Reward pending amount
     */
    struct Account {
        uint256 balance;
        uint256 rewardDebt;
        uint256 rewardPending;
    }

    /**
    * @notice mapping of pools available
    */
    mapping(IERC20 => Pool) public pools;

    /**
    * @notice user mapping of pools data mapping
    *
    * @dev [msg.sender][token] = {balance, rewardDebt, rewardPending}
    */
    mapping(address => mapping(IERC20 => Account)) public accounts;

    /**
    * @notice Event triggered when a new pool is created
    */
    event PoolCreated(IERC20 token, address oracle, string symbol);

    /**
    * @notice Event triggered when a user deposit a token in a pool
    */
    event Deposit(IERC20 token, address account, uint256 amount);

    /**
    * @notice Event triggered when a user withdraw a token from a pool
    */
    event Withdraw(IERC20 token, address account, uint256 amount);

    /**
    * @notice Event triggered when a user claim his rewards
    */
    event Claim(address account, uint256 amount);

    /**
     * @notice Check if the token pool exists
     *
     * @param _token  : token address to check
     */
    modifier onlyCreatedToken(IERC20 _token) {
        require(pools[_token].oracle != address(0), "Token not yet allowed");
        _;
    }

    /**
    * @dev Contructor, requires an address of the reward token
    */
    constructor(IStackedERC20 _rewardToken) {
        rewardToken = _rewardToken;
    }

    /*
     * @notice Creation of a pool to allow users to stake their token
     * @dev The value of the token is peg with de Chainlink oracle
     * @dev Only the owner can create a pool
     *
     * @param _token          : address of the token put in pool
     * @param _oracle         : address of the Chainlink oracle for this token
     * @param _decimalOracle  : decimals of token oracle
     * @param _rewardPerSecond: reward per second for this pool
     * @param symbol          : symbol of the token
     *
     * @emits PoolCreated (_token, _oracle, symbol).
     */
    function createPool(
        IERC20 _token,
        address _oracle,
        uint8 _decimalOracle,
        uint256 _rewardPerSecond,
        string calldata symbol
    ) external onlyOwner {
        require(pools[_token].oracle == address(0), "Token already attached");
        require(_decimalOracle > 0, "Decimal must be greater than 0");

        pools[_token].oracle = _oracle;
        pools[_token].decimalOracle = _decimalOracle;
        pools[_token].rewardPerSecond = _rewardPerSecond;

        emit PoolCreated(_token, _oracle, symbol);
    }

    /**
     * @dev Update the data of the pool
     *
     * @param _token          : address of the token where the pool must be update
     */
    function _updatePool(IERC20 _token) internal {
        Pool storage pool = pools[_token];
        uint256 currentRewardBlock = block.timestamp;

        if (pool.balance == 0) {
            pool.lastRewardBlock = currentRewardBlock;
            return;
        }

        // Calculate pending rewards for the incentive token
        uint256 pendingRewards = (currentRewardBlock - pool.lastRewardBlock) *
            pool.rewardPerSecond;

        pool.rewardPerShare =
            pool.rewardPerShare +
            ((pendingRewards * 1e12) / pool.balance);
        pool.lastRewardBlock = currentRewardBlock;
    }

    /*
     * @notice Deposit token to stake by the user
     * @notice Update the data of the pool
     *
     * @param _token  : token address to stake
     * @param _amount : deposit amount
     *
     * @emits Deposit (_token, msg.sender, _amount);
     */
    function deposit(IERC20 _token, uint256 _amount)
        external
        onlyCreatedToken(_token)
    {
        require(_amount > 0, "Only not null amount");

        Pool storage pool = pools[_token];
        Account storage account = accounts[msg.sender][_token];

        // Calculate current pool reward per share
        _updatePool(_token);

        // Calculate pending reward since now
        if (account.balance > 0) {
            account.rewardPending +=
                (account.balance * pool.rewardPerShare) /
                1e12 -
                account.rewardDebt;
        }

        _token.safeTransferFrom(address(msg.sender), address(this), _amount);

        account.balance = account.balance + _amount;
        account.rewardDebt = (account.balance * pool.rewardPerShare) / 1e12;
        pool.balance = pool.balance + _amount;

        emit Deposit(_token, msg.sender, _amount);
    }

    /*
     * @notice Withdraw the token staked by the user
     * @notice Update the data of the pool
     *
     * @param _token  : token address to unstake
     * @param _amount : deposit amount
     *
     * @emits Deposit (_token, msg.sender, _amount);
     */
    function withdraw(IERC20 _token, uint256 _amount)
        external
        onlyCreatedToken(_token)
    {
        require(_amount > 0, "Amount 0");
        require(
            accounts[msg.sender][_token].balance >= _amount,
            "Insufficient balance"
        );

        Pool storage pool = pools[_token];
        Account storage account = accounts[msg.sender][_token];

        // Calculate current pool reward per share
        _updatePool(_token);

        // Update internal balances
        account.rewardPending +=
            (account.balance * pool.rewardPerShare) /
            1e12 -
            account.rewardDebt;
        account.balance = account.balance - _amount;
        pool.balance = pool.balance - _amount;
        account.rewardDebt = (account.balance * pool.rewardPerShare) / 1e12;

        // withdraw amount
        _token.safeTransfer(address(msg.sender), _amount);

        emit Withdraw(_token, msg.sender, _amount);
    }

    /**
     * @dev mint the token needed for send using the mint methods of the ERC20.
     * @dev send the reward using the safeTransfer methode of SafeERC20.
     *
     * @param _to     : address to send the reward
     * @param _amount : amount of reward to send
     *
     */
    function safeRewardTransfer(address _to, uint256 _amount) internal {
        rewardToken.mint(_amount);
        rewardToken.safeTransfer(_to, _amount);
    }

    /*
     * @notice function to see pending Tokens on frontend.
     *
     * @param _token  : token address of the pool to check the pending reward
     * @param _user   : account address of the user to check the pending reward
     *
     * @return the pending reward
     */
    function claimable(IERC20 _token, address _user)
        external
        view
        returns (uint256 rewards)
    {
        Pool memory pool = pools[_token];
        Account memory account = accounts[_user][_token];

        // Calculate pending rewards for the pool
        uint256 poolPendingRewards;
        uint256 rewardPerShare;
        if (pool.balance > 0) {
            poolPendingRewards =
                (block.timestamp - pool.lastRewardBlock) *
                pool.rewardPerSecond;
            rewardPerShare =
                pool.rewardPerShare +
                ((poolPendingRewards * 1e12) / pool.balance);
        }

        return
            (account.balance * rewardPerShare) /
            1e12 -
            account.rewardDebt +
            account.rewardPending;
    }

    /*
     * @notice retrieve eth price from Chainlink oracle
     *
     * @param _token  : token address of the pool to get the conversion for
     *
     * @return price    : price of the oracle
     * @return decimal  : decimal of the price oracle
     */
    function getDataFeed(IERC20 _token)
        external
        view
        returns (int256 price, uint256 decimals)
    {
        address atOracle = pools[_token].oracle;
        require(atOracle != address(0), "DataFeed not available");

        AggregatorV3Interface priceFeed = AggregatorV3Interface(atOracle);
        (
            /*uint80 roundID*/,
            int256 aggregatorPrice,
            /*uint startedAt*/,
            /*uint timeStamp*/,
            /*uint80 answeredInRound*/
        ) = priceFeed.latestRoundData();
        return (aggregatorPrice, pools[_token].decimalOracle);
    }

    /*
     * @notice claim rewards
     *
     * @param _token  : token address of the pool to get the reward for
     *
     * @emits Claim see _claim function
     */
    function claim(IStackedERC20 _token) external {
        _claim(_token, msg.sender);
    }

    /*
     * @dev claim rewards
     *
     * @param _token  : token address of the pool to get the reward for
     *
     * @emits Claim
     */
    function _claim(IStackedERC20 _token, address _to) internal {
        _updatePool(_token);

        Pool memory pool = pools[_token];

        Account storage account = accounts[msg.sender][_token];
        uint256 pending = (account.balance * pool.rewardPerShare) /
            1e12 -
            account.rewardDebt +
            account.rewardPending;

        require(pending > 0, "Insufficient rewards balance");

        account.rewardPending = 0;
        account.rewardDebt = (account.balance * pool.rewardPerShare) / 1e12;

        safeRewardTransfer(_to, pending);
        emit Claim(_to, pending);
    }
}
