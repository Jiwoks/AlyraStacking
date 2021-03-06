const path = require('path');
const web3 = require('web3');

require('dotenv').config({
  path: path.resolve(__dirname, '../.env')
});

const CCTToken = artifacts.require("./CCTToken.sol");
const Dai = artifacts.require("./Dai.sol");
const Link = artifacts.require("./Link.sol");
const Usdt = artifacts.require("./Usdt.sol");

module.exports = async (deployer, network, accounts) => {
  const myERC20 = await CCTToken.deployed();
  const dai = await Dai.deployed();
  const link = await Link.deployed();
  const usdt = await Usdt.deployed();

  await dai.transfer(accounts[0], web3.utils.toWei('1000'));
  await myERC20.transfer(accounts[0], web3.utils.toWei('1000'));
  await link.transfer(accounts[0], web3.utils.toWei('1000'));
  await usdt.transfer(accounts[0], web3.utils.toWei('1000'));
};
