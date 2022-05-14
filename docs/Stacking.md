## `Stacking`





### `onlyCreatedToken(contract IERC20 _token)`

Check if the token pool exists






### `constructor(contract IStackedERC20 _rewardToken)` (public)





### `createPool(contract IERC20 _token, address _oracle, uint256 _decimalOracle, uint256 _rewardPerSecond, string symbol)` (external)





### `_updatePool(contract IERC20 _token)` (internal)



Update the data of the pool



### `deposit(contract IERC20 _token, uint256 _amount)` (external)





### `withdraw(contract IERC20 _token, uint256 _amount)` (external)





### `safeRewardTransfer(address _to, uint256 _amount)` (internal)



mint the token needed for send using the mint methods of the ERC20.
send the reward using the safeTransfer methode of SafeERC20.



### `claimable(contract IERC20 _token, address _user) → uint256 rewards` (external)





### `getDataFeed(contract IERC20 _token) → int256, uint256` (external)





### `claim(contract IStackedERC20 _token)` (external)





### `claim(contract IStackedERC20 _token, address _to)` (external)





### `_claim(contract IStackedERC20 _token, address _to)` (internal)






### `PoolCreated(contract IERC20 token, address oracle, string symbol)`





### `Deposit(contract IERC20 token, address account, uint256 amount)`





### `Withdraw(contract IERC20 token, address account, uint256 amount)`





### `Claim(address account, uint256 amount)`






### `Pool`


address oracle


uint256 decimalOracle


uint256 balance


uint256 rewardPerShare


uint256 rewardPerSecond


uint256 lastRewardBlock


### `Account`


uint256 balance


uint256 rewardDebt


uint256 rewardPending



