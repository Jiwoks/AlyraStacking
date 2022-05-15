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
            host: '127.0.0.1',
            port: 8545,
            network_id: "*",
            from: process.env.OWNER_ADDRESS,
            gas: 8500000,
            skipDryRun: true
        },
        ropsten: {
            provider: () => provider_set(process.env.RPCROPSTEN),
            network_id: 3,
            from: process.env.OWNER_ADDRESS
        },
        kovan: {
            provider: () => provider_set(process.env.RPCKOVAN),
            network_id: 42,
            from: process.env.OWNER_ADDRESS
        },
        rinkeby: {
            provider: () => provider_set(process.env.RPCRINKEBY),
            network_id: 4,
            from: process.env.OWNER_ADDRESS
        },
    },
    compilers: {
        solc: {
            version: "0.8.13",
        }
    },
    plugins: ["solidity-coverage"],
};
