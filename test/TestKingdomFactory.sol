pragma solidity ^0.4.19;

import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";
import "../contracts/KingdomFactory.sol";

contract TestKingdom {
    KingdomFactory kingdomFactory = KingdomFactory(DeployedAddresses.KingdomFactory());

    // Testing the createNewKingdom() function
    function testUserCanCreateNewKingdom() public {
      kingdomFactory.createNewKingdom("Kevin", 1);
      bytes memory name;
      uint8 race;
      uint numOfSoldiers;
      uint8 weaponLevel;
      uint8 fortressLevel;
      uint gold;
      uint commander;
      bytes memory commanderName;
      (name, race, numOfSoldiers, weaponLevel, fortressLevel, gold, commander, commanderName) = kingdomFactory.getKingdomTest(3);
      string memory expected = "Kevin";

      Assert.equal(string(name), expected, "name of Kingdom ID 3 should be Kevin.");
    }

    // Testing retrieval of all kingdoms under God
    function testGetOfficers() public {
      // Store officer IDs in memory rather than contract's storage
      uint[4] officerIDs = kingdomFactory.getOfficers(0);

      // Store kingdoms in memory rather than contract's storage
      uint expected = 3;

      Assert.equal(officerIDs[3], expected, "3rd officer should have id=3");
    }

}