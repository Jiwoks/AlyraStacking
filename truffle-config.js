const path = require("path");
const HDWalletProvider = require('@truffle/hdwallet-provider');
require('dotenv').config();

const provider_set = () => {
  if (`${process.env.RPC}` == 'YES')
    return new HDWalletProvider({
      mnemonic:{phrase:`${process.env.MNEMONIC}`},
      providerOrUrl:`${process.env.RPC}${process.env.INFURA_ID}`
    })
  else 
    return new HDWalletProvider({
      privateKeys:[`${process.env.PRIVATE_KEY}`],
      providerOrUrl:`${process.env.RPC}${process.env.INFURA_ID}`
    })
}


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
      provider : provider_set(),
      network_id:3,
    },
    kovan:{
      provider : provider_set(),
      network_id:42,
    },
    rinkeby:{
      provider : provider_set(),
      network_id:4,
  },
  },
  compilers: {
    solc: {
      version: "0.8.13",    // Fetch exact version from solc-bin (default: truffle's version)
    }
  },
};