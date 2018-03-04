var MilitaryFactory = artifacts.require("MilitaryFactory");
//var MilitaryLibrary = artifacts.require("MilitaryLibrary");
var KingdomFactory = artifacts.require("KingdomFactory");
var RealmOfWars = artifacts.require("RealmOfWars");

module.exports = function(deployer) {
	deployer.deploy(MilitaryFactory).then(function() {
	  	return deployer.deploy(KingdomFactory).then(function() {
	  		return deployer.deploy(RealmOfWars, KingdomFactory.address, MilitaryFactory.address);
	  	});
	});
	//deployer.deploy(MilitaryLibrary);
	//deployer.link(MilitaryLibrary, [KingdomFactory]);
	//deployer.deploy(KingdomFactory);
};