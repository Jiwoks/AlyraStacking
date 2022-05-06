const path = require("path");
const HDWalletProvider = require('@truffle/hdwallet-provider');
require('dotenv').config();

const provider_set = (RPC) => {
    if (process.env.MNEMONIC) {
        return new HDWalletProvider({
            mnemonic: {phrase: process.env.MNEMONIC},
            providerOrUrl: RPC
        })
    } else {
        return new HDWalletProvider({
            privateKeys: [process.env.PRIVATE_KEY],
            providerOrUrl: RPC
        })
    }
}


module.exports = {
    // See <http://truffleframework.com/docs/advanced/configuration>
    // to customize your Truffle configuration!
    contracts_build_directory: path.join(__dirname, "client/src/contracts"),
    networks: {
        development: {
            provider: provider_set(process.env.RPC),
            network_id: "*"
        },
        ropsten: {
            provider: provider_set(process.env.RPCROPSTEN),
            network_id: 3,
        },
        kovan: {
            provider: provider_set(process.env.RPCKOVAN),
            network_id: 42,
        },
        rinkeby: {
            provider: provider_set(process.env.RPCRINKEBY),
            network_id: 4,
        },
    },
    compilers: {
        solc: {
            version: "0.8.13",    // Fetch exact version from solc-bin (default: truffle's version)
        }
    },
};
