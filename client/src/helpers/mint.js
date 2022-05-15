import aggregatorContract from '../contracts/Faucet.json';
import web3 from "./web3";
import walletStore from "../stores/wallet";

async function mint(address, test) {
    const web3Provider = await web3;
    const contractInstance = new web3Provider.eth.Contract(
        aggregatorContract.abi,
        address,
    );
    const walletAddress = walletStore.getState().address;
    if (test) {
        return contractInstance.methods.faucet().call({from: walletAddress});
    } else {
        return contractInstance.methods.faucet().send({from: walletAddress});
    }

}

export {
    mint,
};
