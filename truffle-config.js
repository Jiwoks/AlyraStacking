const path = require("path");
const HDWalletProvider = require('@truffle/hdwallet-provider');
require('dotenv').config();


module.exports = {
  // See <http://truffleframework.com/docs/advanced/configuration>
  // to customize your Truffle configuration!
  contracts_build_directory: path.join(__dirname, "client/src/contracts"),
  networks: {
    develop: {
      host: "127.0.0.1",
      port: 8545,
      network_id: "*"
    },
    ropsten:{
      provider : function() { return new HDWalletProvider({
        mnemonic:{phrase:`${process.env.MNEMONIC}`},
        providerOrUrl:`https://ropsten.infura.io/v3/${process.env.INFURA_ID}`
      })},
      network_id:3,
    },
    kovan:{
      provider : function() { return new HDWalletProvider({
        mnemonic:{phrase:`${process.env.MNEMONIC}`},
        providerOrUrl:`https://kovan.infura.io/v3/${process.env.INFURA_ID}`
      })},
      network_id:42,
    },
    rinkeby:{
      provider : function() {return new HDWalletProvider({
        mnemonic:{phrase:`${process.env.MNEMONIC}`},
        providerOrUrl:`https://rinkeby.infura.io/v3/${process.env.INFURA_ID}`
      })},
    network_id:4,
  },
  },
  compilers: {
    solc: {
      version: "0.8.13",    // Fetch exact version from solc-bin (default: truffle's version)
    }
  },
};
