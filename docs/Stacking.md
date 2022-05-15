## `Stacking`





### `onlyCreatedToken(contract IERC20 _token)`

Check if the token pool exists






### `constructor(contract IStackedERC20 _rewardToken)` (public)



Contructor, requires an address of the reward token

### `createPool(contract IERC20 _token, address _oracle, uint8 _decimalOracle, uint256 _rewardPerSecond, string symbol)` (external)





### `deposit(contract IERC20 _token, uint256 _amount)` (external)





### `withdraw(contract IERC20 _token, uint256 _amount)` (external)





### `claim(contract IStackedERC20 _token)` (external)





### `claimable(contract IERC20 _token, address _user) → uint256 rewards` (external)





### `getDataFeed(contract IERC20 _token) → int256 price, uint256 decimals` (external)





### `safeRewardTransfer(address _to, uint256 _amount)` (internal)



mint the token needed for send using the mint methods of the ERC20.
send the reward using the safeTransfer methode of SafeERC20.



### `_updatePool(contract IERC20 _token)` (internal)



Update the data of the pool



### `_claim(contract IStackedERC20 _token, address _to)` (internal)






### `PoolCreated(contract IERC20 token, address oracle, string symbol)`

Event triggered when a new pool is created



### `Deposit(contract IERC20 token, address account, uint256 amount)`

Event triggered when a user deposit a token in a pool



### `Withdraw(contract IERC20 token, address account, uint256 amount)`

Event triggered when a user withdraw a token from a pool



### `Claim(address account, uint256 amount)`

Event triggered when a user claim his rewards




### `Pool`


address oracle


uint8 decimalOracle


uint256 balance


uint256 rewardPerShare


uint256 rewardPerSecond


uint256 lastRewardBlock


### `Account`


uint256 balance


uint256 rewardDebt


uint256 rewardPending



