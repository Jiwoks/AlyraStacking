const path = require('path');
const web3 = require('web3');

require('dotenv').config({
  path: path.resolve(__dirname, '../.env')
});

const Stacking = artifacts.require("./Stacking.sol");
const CCCToken = artifacts.require("./CCCToken.sol");
const DAIToken = artifacts.require("./DAIToken.sol");
const USDTToken = artifacts.require("./USDTToken.sol");

module.exports = async function(deployer) {
  await deployer.deploy(CCCToken, 100000000000, {from: process.env.OWNER_ADDRESS});
  if (process.env.ENVIRONMENT !== 'production') {
    await deployer.deploy(DAIToken, web3.utils.toWei('17000'), {from: process.env.OWNER_ADDRESS});
    await deployer.deploy(USDTToken, web3.utils.toWei('1000'), {from: process.env.OWNER_ADDRESS});
    await deployer.deploy(Stacking, web3.utils.toWei('150000'), {from: process.env.OWNER_ADDRESS});
  }

  const StackingInstance = await Stacking.deployed();

  const aggregators = require(path.join(__dirname, '..', 'dataFeed', 'chainlink.json'));
  const contracts = require(path.join(__dirname, '..', 'dataFeed', 'contracts.json'));

  if (aggregators?.[process.env.NETWORK_NAME]?.[process.env.CCC_PEG]) {
    for (const tokenSymbol of Object.getOwnPropertyNames(aggregators[process.env.NETWORK_NAME][process.env.CCC_PEG])) {
      try {
        if (contracts[process.env.NETWORK_NAME][tokenSymbol] === undefined) {
          continue;
        }

        console.log('Adding token ' + tokenSymbol + ' ' + aggregators[process.env.NETWORK_NAME][process.env.CCC_PEG][tokenSymbol] + ' ' + contracts[process.env.NETWORK_NAME][tokenSymbol]);

        await StackingInstance.addPool(contracts[process.env.NETWORK_NAME][tokenSymbol], aggregators[process.env.NETWORK_NAME][process.env.CCC_PEG][tokenSymbol], tokenSymbol);
      } catch (e) {
        console.warn(e);
      }
    }
  }

  if (process.env.ENVIRONMENT !== 'production') {
    const DAITokenInstance = await DAIToken.deployed();
    await StackingInstance.addPool(DAITokenInstance.address, '0x000000000000000000000000000000000000dead', 'DAI');
    const USDTTokenInstance = await USDTToken.deployed();
    await StackingInstance.addPool(USDTTokenInstance.address, '0x000000000000000000000000000000000000dead', 'USDT');
  }
};
