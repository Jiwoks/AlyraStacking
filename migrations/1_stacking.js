const path = require('path');
const web3 = require('web3');

require('dotenv').config({
  path: path.resolve(__dirname, '../.env')
});

const Stacking = artifacts.require("./Stacking.sol");
const CCCToken = artifacts.require("./CCCToken.sol");
const Dai = artifacts.require("./Dai.sol");
const Xtz = artifacts.require("./Xtz.sol");
const Usdt = artifacts.require("./Usdt.sol");

module.exports = async (deployer) => {
  await deployer.deploy(CCCToken, web3.utils.toWei('1000000'));
  const myERC20 = await CCCToken.deployed();
  await deployer.deploy(Dai, web3.utils.toWei('1000000'));
  const dai = await Dai.deployed();
  await deployer.deploy(Xtz, web3.utils.toWei('1000000'));
  const xtz = await Xtz.deployed();
  await deployer.deploy(Usdt, web3.utils.toWei('1000000'));
  const usdt = await Usdt.deployed();
  await deployer.deploy(Stacking, myERC20.address);
  const myStacking = await Stacking.deployed();

  // Allow stacking contract to mint CCC Token
  await myERC20.allowAdmin(myStacking.address);

  const aggregators = require(path.join(__dirname, '..', 'dataFeed', 'chainlink.json'));
  const contracts = require(path.join(__dirname, '..', 'dataFeed', 'contracts.json'));

  if (aggregators?.[process.env.NETWORK_NAME]?.[process.env.CCC_PEG]) {
    for (const tokenSymbol of Object.getOwnPropertyNames(aggregators[process.env.NETWORK_NAME][process.env.CCC_PEG])) {
      try {
        if (contracts[process.env.NETWORK_NAME][tokenSymbol] === undefined) {
          continue;
        }

        console.log('Adding token ' + tokenSymbol + ' ' + aggregators[process.env.NETWORK_NAME][process.env.CCC_PEG][tokenSymbol] + ' ' + contracts[process.env.NETWORK_NAME][tokenSymbol]);

        await myStacking.createPool(contracts[process.env.NETWORK_NAME][tokenSymbol], aggregators[process.env.NETWORK_NAME][process.env.CCC_PEG][tokenSymbol], tokenSymbol);
      } catch (e) {
        console.warn(e);
      }
    }
  }

  if (process.env.ENVIRONMENT !== 'production') {
    await myStacking.createPool(xtz.address, '0x000000000000000000000000000000000000dead', web3.utils.toWei('5'), 'XTZ');
    await myStacking.createPool(dai.address, '0x000000000000000000000000000000000000dead', web3.utils.toWei('5'), 'DAI');
  }

  // kovan
  // uncomment this line to deploy on kovan for add pools with oracle
  //   await myStacking.createPool(xtz.address, '0xBc3f28Ccc21E9b5856E81E6372aFf57307E2E883', 12, web3.utils.toWei('5'), 'XTZ');
  //   await myStacking.createPool(dai.address, '0x22B58f1EbEDfCA50feF632bD73368b2FdA96D541', 12, web3.utils.toWei('5'), 'DAI');
};
