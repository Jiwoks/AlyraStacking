import aggregatorContract from '../contracts/AggregatorV3Interface.json';
import web3 from "./web3";

async function getOracleDecimals(address) {
    const web3Provider = await web3;
    const contractInstance = new web3Provider.eth.Contract(
        aggregatorContract.abi,
        address,
    );
    return await contractInstance.methods.decimals().call();
}

export {
    getOracleDecimals,
};
