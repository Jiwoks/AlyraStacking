const StackingTonted = artifacts.require("./StackingTonted.sol");
// const Stacking = artifacts.require("./Stacking.sol");
const CCCToken = artifacts.require("./CCCToken.sol");

module.exports = function(deployer) {
  deployer.deploy(CCCToken, 100000000000);
  // deployer.deploy(Stacking, 5);
  deployer.deploy(StackingTonted);
};
