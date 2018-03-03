pragma solidity ^0.4.17;

contract KingdomFactory {

    event NewKingdom(uint kingdomId, string name, uint race);
    event ChangedRace(uint kingdomId, uint race);
    event UpgradeWeapon(uint kingdomId, uint weaponLevel);
    event UpgradeFortress(uint kingdomId, uint fortressLevel);
    event UpgradeCovert(uint kingdomId, uint covertLevel);
    event BattleCompleted(uint battleId);
    event Recruit(uint kingdomId);
    event CommanderAssigned(uint kingdomId, uint commanderId);
    event TrainedAttackSpecialists(uint kingdomId, uint count);
    event TrainedDefenseSpecialists(uint kingdomId, uint count);
    event ReassignedAttackSpecialists(uint kingdomId, uint count);
    event ReassignedDefenseSpecialists(uint kingdomId, uint count);
    event TrainedSpies(uint kingdomId, uint count);
    event TrainedSentries(uint kingdomId, uint count);
    event PurchasedMercs(uint id, uint attackMercsCount, uint defenseMercsCount);

    Kingdom[] private kingdoms;
    Military[] private militaries;
    Battle[] private battles;

    mapping (address => uint256) private kingdomOf;
    mapping (uint256 => address) private kingdomToOwner;
    mapping (uint256 => uint256) private numOfOfficers;
    mapping (uint256 => uint256) private recruitTime;

    uint8 private weaponMultiplier   = 30;
    uint8 private fortressMultiplier = 25;
    uint8 private covertMultiplier   = 60;

    uint8 private weaponMaxLevel   = 14;
    uint8 private fortressMaxLevel = 16;
    uint8 private covertMaxLevel   = 15;

    //Price of Upgrading:
    //  price = basePrice * 2^currentLevel
    uint16 private weaponBasePrice   = 40000;
    uint16 private fortressBasePrice = 40000;
    uint16 private covertBasePrice   = 12000;

    uint256 private recruitCooldown = 5 minutes; // 6 hours;

    uint8[] private incomeBonus     = [  0, 30, 15,  0,  0,  0];
    uint8[] private attackBonus     = [100,  0,  0,  0, 35,  0];
    uint8[] private defenseBonus    = [100,  0, 40,  0, 20,  0];
    uint8[] private spyBonus        = [100, 35,  0, 45,  0,  0];
    uint8[] private sentryBonus     = [100,  0,  0,  0,  0, 35];
    uint8[] private fewerCasualties = [ 50,  0,  0, 70,  0, 85];
    

    struct Kingdom {
      string name;
      uint8 race; //0 - divine; 1 - human; 2 - dwarves; 
      uint8 weaponLevel;
      uint8 fortressLevel;
      uint8 covertLevel;
      uint256 gold;
      uint256 commander;
    }

    struct Military {
      uint256 numOfSoldiers;
      uint256 numOfAttackSpecialists;
      uint256 numOfAttackMercs;
      uint256 numOfDefenseSpecialists;
      uint256 numOfDefenseMercs;
      uint256 numOfSpies;
      uint256 numOfSentries;      
    }

    struct Battle {
      uint256 time;
      uint256 attacker;
      uint256 defender;
      uint256 attacker_damage;
      uint256 defender_damage;
      uint256 attacker_casualties;
      uint256 defender_casualties;
      bool success;
    }

    modifier onlyUser(uint _id){
      require(msg.sender == kingdomToOwner[_id]);
      _;
    }

    function KingdomFactory() public {
      _createKingdom("God", 0, [14, 16, 15], [uint(1000000), uint(200000), uint(200000), uint(10000), uint(10000)], 0);
      _createKingdom("God\'s Right Hand", 0, [12, 14, 10], [uint(100000), uint(20000), uint(20000), uint(1000), uint(1000)], 0);
      _createKingdom("God\'s Left Hand", 0, [12, 14, 10], [uint(100000), uint(20000), uint(20000), uint(1000), uint(1000)], 0);
    }

    function _createKingdom(string _name, uint8 _race, uint8[3] _technologyLevel, uint[5] _militaryCount, uint _commander)
      private returns (uint){
      uint id = kingdoms.push(Kingdom(_name, _race, _technologyLevel[0], _technologyLevel[1], _technologyLevel[2], 0, _commander)) - 1;
      militaries.push(Military(_militaryCount[0], _militaryCount[1], 0, _militaryCount[2], 0, _militaryCount[3], _militaryCount[4]));
      kingdomToOwner[id] = msg.sender;
      kingdomOf[msg.sender] = id;
      numOfOfficers[_commander] += 1;
      NewKingdom(id, _name, _race);
      return id;
    }

    function createNewKingdom(string _name, uint _race, uint _commanderId) public returns (uint){
      require(kingdomOf[msg.sender] == 0);
      require(_race >= 1 && _race <= 5);
      return _createKingdom(_name, uint8(_race), [0, 0, 0], [uint(0), uint(0), uint(0), uint(0), uint(0)], _commanderId);
    }

    function getKingdom(uint _id) public view returns (string, uint8, uint8[3], uint, uint, string) {
      var kingdom = kingdoms[_id];
      var commanderName = kingdoms[kingdom.commander].name;
      return (kingdom.name, kingdom.race, [kingdom.weaponLevel, kingdom.fortressLevel, kingdom.covertLevel], kingdom.gold,
          kingdom.commander, commanderName);
    }

    function getPersonnel(uint _id) private view returns (uint256[7]) {
      var military = militaries[_id];
      return [military.numOfSoldiers, military.numOfAttackSpecialists, military.numOfAttackMercs, military.numOfDefenseSpecialists,
        military.numOfDefenseMercs, military.numOfSpies, military.numOfSentries];
    }

    function spyOnPersonnel(uint _targetId) public view returns (bool, uint256[7]) {
      uint256 senderId = kingdomOf[msg.sender];
      require(senderId > 0);
      if(senderId == _targetId || senderId == kingdoms[_targetId].commander || spyRating(senderId) > sentryRating(_targetId)){
        return (true, getPersonnel(_targetId));
      }
      return (false, [uint(0), uint(0), uint(0), uint(0), uint(0), uint(0), uint(0)]);
    }

    function getWeaponMultiplier() public view returns (uint8) {
      return weaponMultiplier;
    }

    function getFortressMultiplier() public view returns (uint8) {
      return fortressMultiplier;
    }


    /// @notice Returns a list of all kingdom IDs that are officers of target commander.
    /// @param _commanderId The ID of the commander we are interested in.
    /// @dev This method MUST NEVER be called by smart contract code. First, it's fairly
    ///  expensive (it walks the entire kingdoms array looking for kingdoms belonging to commander),
    ///  but it also returns a dynamic array, which is only supported for web3 calls, and
    ///  not contract-to-contract calls.
    function getOfficers(uint _commanderId) public view returns (uint[]){
      uint256 id;
      uint256 officerCount = numOfOfficers[_commanderId];
      if(officerCount == 0){
        // Return an empty array
        return new uint256[](0);
      } else {
        uint256 officerIndex = 0;
        uint256[] memory officers = new uint256[](officerCount);

        // We count on the fact that all kingdoms have IDs starting at 1 and increasing
        // sequentially up to kingdoms.length.
        for(id = 0; id < kingdoms.length; id++){
          if(kingdoms[id].commander == _commanderId){
            officers[officerIndex] = id;
            officerIndex++;
          }
        }
        return officers;
      }
    }

    function getMyOfficers() external view returns (uint[]){
      uint256 id = kingdomOf[msg.sender];
      require(id > 0);
      return getOfficers(id);
    }

    function haveKingdom() public view returns (bool) {
      return (kingdomOf[msg.sender] > 0);
    }

    function getMyKingdomId() public view returns (uint){
      return (kingdomOf[msg.sender]);
    }

    function isMyKingdomId(uint256 _id) public view returns (bool){
      return (kingdomOf[msg.sender] == _id);
    }

    function getMyKingdom() public view returns (string, uint8, uint8[3], uint, uint, string) {
      uint256 id = kingdomOf[msg.sender];
      require(id > 0);
      return getKingdom(id);
    }

    function getMyPersonnel() public view returns (uint256[7]) {
      uint256 id = kingdomOf[msg.sender];
      require(id > 0);
      return getPersonnel(id);
    }

    function getKingdomCount() public view returns (uint) {
      return kingdoms.length;
    }

    /********** User-Specific Actions **********
      #assignCommander - Assign new commander
      #upgradeWeapon   - Upgrade weapon by 1 level
      #upgradeFortress - Upgrade fortress by 1 level
    */

    function assignCommander(uint _commanderId) public {
      uint256 id = kingdomOf[msg.sender];
      require(kingdoms[id].commander != _commanderId);
      numOfOfficers[kingdoms[id].commander] -= 1;
      numOfOfficers[_commanderId] += 1;
      kingdoms[id].commander = _commanderId;
      CommanderAssigned(id, _commanderId);
    }

    function ditchCommander() public {
      assignCommander(0);
    }

    function isCommander(uint _id) public view returns (bool) {
      return (kingdoms[kingdomOf[msg.sender]].commander == _id);
    }

    function changeRace(uint8 _race) public {
      uint256 id = kingdomOf[msg.sender];
      require(id > 0);
      var kingdom = kingdoms[id];
      require(kingdom.race != _race && _race >= 1 && _race <= 5);
      kingdom.race = _race;
      ChangedRace(id, _race);
    }

    function upgradeWeapon() public {
      uint256 id = kingdomOf[msg.sender];
      require(id > 0);
      uint8 level = kingdoms[id].weaponLevel;
      require(level < weaponMaxLevel);
      level += 1;
      kingdoms[id].weaponLevel = level;
      UpgradeWeapon(id, level);
    }

    function upgradeFortress() public {
      require(kingdomOf[msg.sender] != 0);
      uint256 id = kingdomOf[msg.sender];
      require(id > 0);
      uint8 level = kingdoms[id].fortressLevel;
      require(level < fortressMaxLevel);
      level += 1;
      kingdoms[id].fortressLevel = level;
      UpgradeFortress(id, level);
    }

    function upgradeCovert() public {
      require(kingdomOf[msg.sender] != 0);
      uint256 id = kingdomOf[msg.sender];
      require(id > 0);
      uint8 level = kingdoms[id].covertLevel;
      require(level < covertMaxLevel);
      level += 1;
      kingdoms[id].covertLevel = level;
      UpgradeCovert(id, level);
    }

    function strikeAction(uint256 _id) public view returns (uint256) {
        var kingdom = kingdoms[_id];
        var military = militaries[_id];
        return (military.numOfSoldiers + 2 * (military.numOfAttackSpecialists + military.numOfAttackMercs))
          * (100 + attackBonus[kingdom.race]) / 100
          * (uint256(100 + weaponMultiplier) ** uint256(kingdom.weaponLevel)) / (100 ** uint256(kingdom.weaponLevel));
    }

    function myStrikeAction() public view returns (uint256) {
      var id = kingdomOf[msg.sender];
      require(id > 0);
      return strikeAction(id);
    }

    function defensiveAction(uint256 _id) public view returns (uint256) {
        var kingdom = kingdoms[_id];
        var military = militaries[_id];
        return (military.numOfSoldiers + 2 * (military.numOfDefenseSpecialists) + military.numOfDefenseMercs)
          * (100 + defenseBonus[kingdom.race]) / 100
          * (uint256(100 + fortressMultiplier) ** uint256(kingdom.fortressLevel)) / (100 ** uint256(kingdom.fortressLevel));
    }

    function myDefensiveAction() public view returns (uint256) {
      var id = kingdomOf[msg.sender];
      require(id > 0);
      return defensiveAction(id);
    }

    function spyRating(uint256 _id) public view returns (uint256) {
      var kingdom = kingdoms[_id];
      var military = militaries[_id];
      return military.numOfSpies * (100 + spyBonus[kingdom.race]) / 100
        * (uint256(100 + covertMultiplier) ** uint256(kingdom.covertLevel)) / (100 ** uint256(kingdom.covertLevel));
    }

    function mySpyRating() public view returns (uint256) {
      var id = kingdomOf[msg.sender];
      require(id > 0);
      return spyRating(id);
    }

    function sentryRating(uint256 _id) public view returns (uint256) {
      var kingdom = kingdoms[_id];
      var military = militaries[_id];
      return military.numOfSentries * (100 + sentryBonus[kingdom.race]) / 100
        * (uint256(100 + covertMultiplier) ** uint256(kingdom.covertLevel)) / (100 ** uint256(kingdom.covertLevel));
    }

    function mySentryRating() public view returns (uint256) {
      var id = kingdomOf[msg.sender];
      require(id > 0);
      return sentryRating(id);
    }

    function attack(uint256 _targetID) public {
      uint256 attacker = kingdomOf[msg.sender];
      require(attacker != _targetID);
      uint256 attacker_damage = myStrikeAction();
      uint256 defender_damage = defensiveAction(_targetID);
      uint256 attacker_casualties = 0;
      uint256 defender_casualties = 0;
      bool success = attacker_damage > defender_damage;
      uint256 battleID = battles.push(Battle(now, attacker, _targetID, attacker_damage, defender_damage, attacker_casualties, defender_casualties, success)) - 1;
      BattleCompleted(battleID);
    }

    function getBattle(uint _id) public view returns (uint256, uint256, uint256, uint256, uint256, uint256, bool) {
      var battle = battles[_id];
      return (battle.attacker, battle.defender, battle.attacker_damage, battle.defender_damage,
          battle.attacker_casualties, battle.defender_casualties, battle.success);
    }

    function getRecentAttacks(uint _id) public view returns(uint[2][5], uint){
      uint[2][5] memory result;
      uint count = 0;
      uint battleId;

      for(battleId = battles.length; battleId > 0 && count < 5; battleId--){
        var battle = battles[battleId - 1];
        if(battle.defender == _id){
          //result[count] = battleId - 1;
          result[count][0] = now - battle.time;
          result[count][1] = battle.attacker;
          count++;
        }
      }
      return (result, count);
    }

    function getMyRecentAttacks() public view returns(uint[2][5], uint){
      var id = kingdomOf[msg.sender];
      require(id > 0);
      return getRecentAttacks(id);
    }

    function getRecent10IncomingAttacks(uint _id) public view returns(uint[2][10], uint){
      uint[2][10] memory result;
      uint count = 0;
      uint battleId;

      for(battleId = battles.length; battleId > 0 && count < 10; battleId--){
        var battle = battles[battleId - 1];
        if(battle.defender == _id){
          result[count][0] = now - battle.time;
          result[count][1] = battleId - 1;
          count++;
        }
      }
      return (result, count);
    }

    function getRecent10OutgoingAttacks(uint _id) public view returns(uint[2][10], uint){
      uint[2][10] memory result;
      uint count = 0;
      uint battleId;

      for(battleId = battles.length; battleId > 0 && count < 10; battleId--){
        var battle = battles[battleId - 1];
        if(battle.attacker == _id){
          result[count][0] = now - battle.time;
          result[count][1] = battleId - 1;
          count++;
        }
      }
      return (result, count);
    }

    function getMyRecent10IncomingAttacks() public view returns(uint[2][10], uint){
      var id = kingdomOf[msg.sender];
      require(id > 0);
      return getRecent10IncomingAttacks(id);
    }

    function getMyRecent10OutgoingAttacks() public view returns(uint[2][10], uint){
      var id = kingdomOf[msg.sender];
      require(id > 0);
      return getRecent10OutgoingAttacks(id);
    }

    //returns true,0 if can recruit, otherwise returns false and number of seconds remaining
    function canRecruit() public view returns (bool, uint256){
      uint256 timePassed = now - recruitTime[kingdomOf[msg.sender]];
      if(timePassed > recruitCooldown){
        return (true, 0);
      }
      return (false, recruitCooldown - timePassed);
    }

    function recruit() public {
      var id = kingdomOf[msg.sender];
      require(id > 0);
      require (now - recruitTime[id] > recruitCooldown);
      militaries[id].numOfSoldiers += 100 * (1 + numOfOfficers[id]);
      recruitTime[id] = now;
      Recruit(id);
    }

    function trainAttackSpecialists(uint256 _count) public {
      var id = kingdomOf[msg.sender];
      require(id > 0);
      var military = militaries[id];
      require (military.numOfSoldiers >= _count);
      military.numOfSoldiers -= _count;
      military.numOfAttackSpecialists += _count;
      TrainedAttackSpecialists(id, _count);
    }

    function trainDefenseSpecialists(uint256 _count) public {
      var id = kingdomOf[msg.sender];
      require(id > 0);
      var military = militaries[id];
      require (military.numOfSoldiers >= _count);
      military.numOfSoldiers -= _count;
      military.numOfDefenseSpecialists += _count;
      TrainedDefenseSpecialists(id, _count);
    }

    function trainSpies(uint256 _count) public {
      var id = kingdomOf[msg.sender];
      require(id > 0);
      var military = militaries[id];
      require (military.numOfSoldiers >= _count);
      military.numOfSoldiers -= _count;
      military.numOfSpies += _count;
      TrainedSpies(id, _count);
    }

    function trainSentries(uint256 _count) public {
      var id = kingdomOf[msg.sender];
      require(id > 0);
      var military = militaries[id];
      require (military.numOfSoldiers >= _count);
      military.numOfSoldiers -= _count;
      military.numOfSentries += _count;
      TrainedSentries(id, _count);
    }

    function reassignAttackSpecialists(uint256 _count) public {
      var id = kingdomOf[msg.sender];
      require(id > 0);
      var military = militaries[id];
      require (military.numOfAttackSpecialists >= _count);
      military.numOfSoldiers += _count;
      military.numOfAttackSpecialists -= _count;
      ReassignedAttackSpecialists(id, _count);
    }

    function reassignDefenseSpecialists(uint256 _count) public {
      var id = kingdomOf[msg.sender];
      require(id > 0);
      var military = militaries[id];
      require (military.numOfDefenseSpecialists >= _count);
      military.numOfSoldiers += _count;
      military.numOfDefenseSpecialists -= _count;
      ReassignedDefenseSpecialists(id, _count);
    }

    function buyMercs(uint256 _attackMercsCount, uint256 _defenseMercsCount) public {
      var id = kingdomOf[msg.sender];
      require(id > 0);
      var military = militaries[id];
      military.numOfAttackMercs += _attackMercsCount;
      military.numOfDefenseMercs += _defenseMercsCount;
      PurchasedMercs(id, _attackMercsCount, _defenseMercsCount);
    }
}