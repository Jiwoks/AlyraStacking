import erc20Contract from '../contracts/ERC20.json';
import web3 from "./web3";
import walletStore from "../stores/wallet";


const subscriptions = {};
async function subscribeToTransfer(address, callback) {
    const web3Provider = await web3;
    const contractInstance = new web3Provider.eth.Contract(
        erc20Contract.abi,
        address,
    );

    subscriptions[address] = callback;

    return contractInstance.events.Transfer({
        filter: { to: walletStore.getState().address },
    }).on('data', event => {
        subscriptions[address](event);
    });
}

function unsubscribeToTransfer(address) {
    delete subscriptions[address];
}

export {
    subscribeToTransfer,
    unsubscribeToTransfer
};
