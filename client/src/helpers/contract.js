import stackingContract from '../contracts/Stacking.json';
import ierc20Contract from '../contracts/IERC20.json';
import CCCTokenContract from '../contracts/CCCToken.json';
import contractStore from '../stores/contract';
import web3 from "./web3";
import web3js from 'web3';

let contractInstance;

/**
 * Load the contract with our web3 provider
 *
 * @return {Promise<void>}
 */
async function loadContract() {
    const web3Provider = await web3;
    const networkId = await web3Provider.eth.net.getId();
    const deployedNetwork = stackingContract.networks[networkId];

    if (!deployedNetwork || !deployedNetwork.address) {
        contractStore.setState({noContractSet: true});
        return;
    }

    contractInstance = new web3Provider.eth.Contract(
        stackingContract.abi,
        deployedNetwork && deployedNetwork.address,
    );

    // As we have the contract we can load all pools
    const pools = await getPools();
    contractStore.setState({ pools });
}

/**
 * Retrieve all pools from events
 *
 * @return {Promise<*[]>}
 */
async function getPools() {

    const pools = await contractInstance.getPastEvents('PoolCreated', {
        fromBlock: 0,
        toBlock: 'latest',
    });

    const poolsArray = [];

    for (const poolsEvent of pools) {
        poolsArray.push({
            token: poolsEvent.returnValues.token,
            symbol: poolsEvent.returnValues.symbol,
        });
    }

    return poolsArray;
}

async function getWalletBalance(walletAddress, tokenAddress) {
    const web3Provider = await web3;
    const contractIERC20Instance = new web3Provider.eth.Contract(
        ierc20Contract.abi,
        tokenAddress,
    );

    return contractIERC20Instance.methods.balanceOf(walletAddress).call();
}

async function getDepositedBalance(walletAddress, tokenAddress) {
    const result = await contractInstance.methods.accounts(walletAddress, tokenAddress).call();
    return result.balance;
}

async function getTVL(tokenAddress) {
    const pool = await contractInstance.methods.pools(tokenAddress).call();
    return pool.balance;
}

async function claimableRewards(walletAddress, tokenAddress) {
    return await contractInstance.methods.claimable(tokenAddress, walletAddress).call();
}

async function deposit(walletAddress, tokenAddress, amount) {
    const web3Provider = await web3;
    const contractIERC20Instance = new web3Provider.eth.Contract(
        ierc20Contract.abi,
        tokenAddress,
    );

    const weiAmount = web3js.utils.toWei(amount);

    await contractIERC20Instance.methods.approve(contractInstance._address, weiAmount).send({from: walletAddress});
    await contractInstance.methods.deposit(tokenAddress, weiAmount).send({from: walletAddress});
}

async function withdraw(walletAddress, tokenAddress, amount) {
    const weiAmount = web3js.utils.toWei(amount);

    await contractInstance.methods.withdraw(tokenAddress, weiAmount).send({from: walletAddress});
}

let CCCTokenContractInstance;

/**
 * Retrieve Token information from token SC
 * @return {Promise<null|{symbol: *, address, decimals: *, name: *}>}
 */
async function getRewardTokenInfo() {
    const web3Provider = await web3;
    const networkId = await web3Provider.eth.net.getId();
    const deployedNetwork = CCCTokenContract.networks[networkId];

    if (!deployedNetwork || !deployedNetwork.address) {
        return null;
    }

    CCCTokenContractInstance = new web3Provider.eth.Contract(
        CCCTokenContract.abi,
        deployedNetwork && deployedNetwork.address,
    );

    return {
        symbol: await CCCTokenContractInstance.methods.symbol().call(),
        decimals: await CCCTokenContractInstance.methods.decimals().call(),
        name: await CCCTokenContractInstance.methods.name().call(),
        address: deployedNetwork.address
    }
}

export {
    loadContract,
    getPools,
    getWalletBalance,
    getDepositedBalance,
    claimableRewards,
    deposit,
    withdraw,
    getTVL,
    getRewardTokenInfo
};
