const path = require('path');
const web3 = require('web3');

require('dotenv').config({
  path: path.resolve(__dirname, '../.env')
});

const CCCToken = artifacts.require("./CCCToken.sol");
const Dai = artifacts.require("./Dai.sol");
const Xtz = artifacts.require("./Xtz.sol");

module.exports = async (deployer) => {
  const myERC20 = await CCCToken.deployed();
  const dai = await Dai.deployed();
  const xtz = await Xtz.deployed();

  await dai.transfer(process.env.OWNER_ADDRESS, web3.utils.toWei('1000'));
  await myERC20.transfer(process.env.OWNER_ADDRESS, web3.utils.toWei('1000'));
  await xtz.transfer(process.env.OWNER_ADDRESS, web3.utils.toWei('1000'));
};
