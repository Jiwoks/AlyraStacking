const Stacking = artifacts.require("./Stacking.sol");
const CCCToken = artifacts.require("./CCCToken.sol");
const Dai = artifacts.require("./Dai.sol");
const Xtz = artifacts.require("./Xtz.sol");

module.exports = async (deployer) => {
  await deployer.deploy(CCCToken, 1000000000000);
  const myERC20 = await CCCToken.deployed();
  await deployer.deploy(Dai, 1000000000000);
  const dai = await Dai.deployed();
  await deployer.deploy(Xtz, 1000000000000);
  const xtz = await Xtz.deployed();
  await deployer.deploy(Stacking, myERC20.address);
  const myStacking = await Stacking.deployed();
};
