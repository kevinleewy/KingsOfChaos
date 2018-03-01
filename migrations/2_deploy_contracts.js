var KingdomFactory = artifacts.require("KingdomFactory");

module.exports = function(deployer) {
  deployer.deploy(KingdomFactory);
};