import web3 from "./web3";

const getAccount = async () => {
    const accounts = await (await web3).eth.getAccounts();
    return accounts[0];
}

export {
    getAccount
}
