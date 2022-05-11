const path = require("path");
const HDWalletProvider = require('@truffle/hdwallet-provider');
require('dotenv').config();

module.exports = {
    // See <http://truffleframework.com/docs/advanced/configuration>
    // to customize your Truffle configuration!
    contracts_build_directory: path.join(__dirname, "client/src/contracts"),
    networks: {
        development: {
            provider: () => new HDWalletProvider({
                mnemonic: {phrase: process.env.MNEMONIC},
                providerOrUrl: "http://localhost:8545"
            }),
            network_id: "*",       // Any network (default: none)
        },
        ropsten: {
            provider : function() {return new HDWalletProvider({mnemonic:{phrase:`${process.env.MNEMONIC}`},providerOrUrl:`https://ropsten.infura.io/v3/${process.env.INFURA_ID}`})},
            network_id:3,
            from: '0x262c0A5B09Af5168710F2a4BCf33c35aA3E52c88'
        },
        kovan: {
            provider: function () {
                return new HDWalletProvider({
                    mnemonic: {phrase: `${process.env.MNEMONIC}`},
                    providerOrUrl: `https://kovan.infura.io/v3/${process.env.INFURA_ID}`
                })
            },
            network_id: 42,
            from: '0x262c0A5B09Af5168710F2a4BCf33c35aA3E52c88'
        }
    },
    compilers: {
        solc: {
            version: "0.8.13",    // Fetch exact version from solc-bin (default: truffle's version)
        }
    },

    plugins: ["solidity-coverage"]
};
