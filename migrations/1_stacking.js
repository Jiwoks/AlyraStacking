const path = require('path');
const web3 = require('web3');

require('dotenv').config({
  path: path.resolve(__dirname, '../.env')
});

const Stacking = artifacts.require("./Stacking.sol");
const CCCToken = artifacts.require("./CCCToken.sol");
const Dai = artifacts.require("./Dai.sol");
const Link = artifacts.require("./Link.sol");
const Usdt = artifacts.require("./Usdt.sol");
const MockOracleDAI = artifacts.require("./MockOracle.sol");
const MockOracleLINK = artifacts.require("./MockOracle.sol");

module.exports = async (deployer, network, account) => {

  await deployer.deploy(CCCToken, web3.utils.toWei('1000000'));
  const myERC20 = await CCCToken.deployed();
  await deployer.deploy(Dai, web3.utils.toWei('1000000'));
  const dai = await Dai.deployed();
  await deployer.deploy(Link, web3.utils.toWei('1000000'));
  const link = await Link.deployed();
  await deployer.deploy(Usdt, web3.utils.toWei('1000000'));
  const usdt = await Usdt.deployed();
  await deployer.deploy(Stacking, myERC20.address);
  const myStacking = await Stacking.deployed();

  // Allow stacking contract to mint CCC Token
  await myERC20.allowAdmin(myStacking.address);

  if (network === 'development') {
    await deployer.deploy(MockOracleDAI, '18', '1', 'Mock Oracle DAI');
    const myMockOracleDAI = await MockOracleDAI.deployed();
    await deployer.deploy(MockOracleDAI, '18', '1', 'Mock Oracle DAI');
    const myMockOracleLINK = await MockOracleLINK.deployed();
    await myMockOracleDAI.setData('100376540');
    await myStacking.createPool(dai.address, myMockOracleDAI.address,'8', web3.utils.toWei('5'), 'DAI');
    await myMockOracleLINK.setData('707782127');
    await myStacking.createPool(link.address, myMockOracleLINK.address, '8', web3.utils.toWei('5'), 'LINK');
  } else if (network === 'kovan' || network === 'kovan') {
    await myStacking.createPool(dai.address, '0x777A68032a88E5A84678A77Af2CD65A7b3c0775a', '8', web3.utils.toWei('5'), 'DAI');
    await myStacking.createPool(link.address, '0x396c5E36DD0a0F5a5D33dae44368D4193f69a1F0', '8', web3.utils.toWei('5'), 'LINK');
  }

};
