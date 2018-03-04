pragma solidity ^0.4.17;

contract KingdomFactory {

    Kingdom[] private kingdoms;

    mapping (uint256 => uint256) private numOfOfficers;

    uint8 private weaponMultiplier   = 30;
    uint8 private fortressMultiplier = 25;
    uint8 private covertMultiplier   = 60;

    uint8 private kingdomMaxLevel  = 100;
    uint8 private weaponMaxLevel   = 14;
    uint8 private fortressMaxLevel = 16;
    uint8 private covertMaxLevel   = 15;

    //Exp required to level up:
    //  Required Exp = 100 * level^2
    uint16 private levelUpBaseExp  = 100;

    //Price of Upgrading:
    //  price = basePrice * 2^currentLevel
    uint16 private weaponBasePrice   = 40000;
    uint16 private fortressBasePrice = 40000;
    uint16 private covertBasePrice   = 12000;

    uint8[] private experienceBonus = [  0, 30, 15,  0,  0,  0];
    uint8[] private attackBonus     = [100,  0,  0,  0, 35,  0];
    uint8[] private defenseBonus    = [100,  0, 40,  0, 20,  0];
    uint8[] private spyBonus        = [100, 35,  0, 45,  0,  0];
    uint8[] private sentryBonus     = [100,  0,  0,  0,  0, 35];
    uint8[] private fewerCasualties = [ 50,  0,  0, 70,  0, 85];
    

    struct Kingdom {
      uint8 race; //0 - divine; 1 - human; 2 - dwarves;
      uint8 level; //[1,100]
      uint8 weaponLevel; // [0,14]
      uint8 fortressLevel; // [0,16]
      uint8 covertLevel; // [0,15]
      uint256 gold;
      uint256 experience;
      uint256 commander;
    }

    function _createKingdom(uint8 _race, uint8[4] _level, uint _commander) public returns (uint){
      uint id = kingdoms.push(Kingdom(_race, _level[0], _level[1], _level[2], _level[3], 0, 0, _commander)) - 1;
      numOfOfficers[_commander] += 1;
      return id;
    }


    function getKingdom(uint _id) public view returns (uint8, uint8[4], uint, uint, uint) {
      var kingdom = kingdoms[_id];
      return (kingdom.race, [kingdom.level, kingdom.weaponLevel, kingdom.fortressLevel, kingdom.covertLevel], kingdom.gold,
          kingdom.experience, kingdom.commander);
    }

    function gainExperience(uint _id, uint _exp) public {
      require(_id > 0);
      var kingdom = kingdoms[_id];
      _exp = (_exp * (100 + experienceBonus[kingdom.race])) / 100;
      kingdom.experience += _exp; 
      uint8 level = kingdom.level;
      uint amountToLevelUp = levelUpBaseExp * level * level;
      while(kingdom.experience >= amountToLevelUp) {
        kingdom.level += 1;
        kingdom.experience -= amountToLevelUp;
        level = kingdom.level;
        amountToLevelUp = levelUpBaseExp * level * level;
      }
    } 

    function getCommanderId(uint _id) public view returns (uint256) {
      return kingdoms[_id].commander;
    }

    function getWeaponMultiplier() public view returns (uint8) {
      return weaponMultiplier;
    }

    function getFortressMultiplier() public view returns (uint8) {
      return fortressMultiplier;
    }

    function getKingdomCount() public view returns (uint) {
      return kingdoms.length;
    }

    function getOfficerCount(uint _id) public view returns (uint) {
      return numOfOfficers[_id];
    }

    //********* User-Specific Actions **********
    //  #assignCommander - Assign new commander
    //  #upgradeWeapon   - Upgrade weapon by 1 level
    //  #upgradeFortress - Upgrade fortress by 1 level
    //

    function assignCommander(uint _targetId, uint _commanderId) public {
      require(_targetId > 0);
      var kingdom = kingdoms[_targetId];
      require(kingdom.commander != _commanderId);
      numOfOfficers[kingdom.commander] -= 1;
      numOfOfficers[_commanderId] += 1;
      kingdom.commander = _commanderId;
    }

    function ditchCommander(uint _targetId) public {
      assignCommander(_targetId, 0);
    }

    function isCommander(uint _targetId, uint _commanderId) public view returns (bool) {
      return (kingdoms[_targetId].commander == _commanderId);
    }

    function changeRace(uint _targetId, uint8 _race) public {
      require(_targetId > 0);
      var kingdom = kingdoms[_targetId];
      require(kingdom.race != _race && _race >= 1 && _race <= 5);
      kingdom.race = _race;
    }

    function upgradeWeapon(uint _id) public {
      require(_id > 0);
      uint8 level = kingdoms[_id].weaponLevel;
      require(level < weaponMaxLevel);
      level += 1;
      kingdoms[_id].weaponLevel = level;
    }

    function upgradeFortress(uint _id) public {
      require(_id > 0);
      uint8 level = kingdoms[_id].fortressLevel;
      require(level < fortressMaxLevel);
      level += 1;
      kingdoms[_id].fortressLevel = level;
    }

    function upgradeCovert(uint _id) public {
      require(_id > 0);
      uint8 level = kingdoms[_id].covertLevel;
      require(level < covertMaxLevel);
      level += 1;
      kingdoms[_id].covertLevel = level;
    }

    function strikeAction(uint256 _id) public view returns (uint256) {
        var kingdom = kingdoms[_id];
        return (100 + attackBonus[kingdom.race]) / 100
          * (uint256(100 + weaponMultiplier) ** uint256(kingdom.weaponLevel)) / (100 ** uint256(kingdom.weaponLevel));
    }

    function defensiveAction(uint256 _id) public view returns (uint256) {
        var kingdom = kingdoms[_id];
        return (100 + defenseBonus[kingdom.race]) / 100
          * (uint256(100 + fortressMultiplier) ** uint256(kingdom.fortressLevel)) / (100 ** uint256(kingdom.fortressLevel));
    }

    function spyRating(uint256 _id) public view returns (uint256) {
      var kingdom = kingdoms[_id];
      return (100 + spyBonus[kingdom.race]) / 100
        * (uint256(100 + covertMultiplier) ** uint256(kingdom.covertLevel)) / (100 ** uint256(kingdom.covertLevel));
    }

    function sentryRating(uint256 _id) public view returns (uint256) {
      var kingdom = kingdoms[_id];
      return (100 + sentryBonus[kingdom.race]) / 100
        * (uint256(100 + covertMultiplier) ** uint256(kingdom.covertLevel)) / (100 ** uint256(kingdom.covertLevel));
    }
    
}