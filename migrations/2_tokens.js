const path = require('path');
const web3 = require('web3');

require('dotenv').config({
  path: path.resolve(__dirname, '../.env')
});

const CCCToken = artifacts.require("./CCCToken.sol");
const Dai = artifacts.require("./Dai.sol");
const Xtz = artifacts.require("./Xtz.sol");
const Usdt = artifacts.require("./Usdt.sol");

module.exports = async (deployer, network, accounts) => {
  const myERC20 = await CCCToken.deployed();
  const dai = await Dai.deployed();
  const xtz = await Xtz.deployed();
  const usdt = await Usdt.deployed();

  await dai.transfer(accounts[0], web3.utils.toWei('1000'));
  await myERC20.transfer(accounts[0], web3.utils.toWei('1000'));
  await xtz.transfer(accounts[0], web3.utils.toWei('1000'));
  await usdt.transfer(accounts[0], web3.utils.toWei('1000'));
};
