import web3 from "./web3";

const getAccount = async () => {
    const accounts = await (await web3).eth.getAccounts();
    return accounts[0];
}

const addToMetamask = async (e, tokenAddress, tokenSymbol) => {
    e.stopPropagation();
    try {
        const result = window.ethereum.request({
            method: 'wallet_watchAsset',
            params: {
                type: 'ERC20',
                options: {
                    address: tokenAddress,
                    symbol: tokenSymbol,
                    decimals: 18
                },
            },
        });
    } catch (error) {
        console.log(error);
    }
}

export {
    getAccount,
    addToMetamask
}
