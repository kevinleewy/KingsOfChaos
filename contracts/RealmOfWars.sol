pragma solidity ^0.4.17;

import "./MilitaryFactoryInterface.sol";
import "./KingdomFactoryInterface.sol";

contract RealmOfWars {

    event NewKingdom(uint kingdomId, string name, uint race);
    event ChangedRace(uint kingdomId, uint race);
    event UpgradeWeapon(uint kingdomId);
    event UpgradeFortress(uint kingdomId);
    event UpgradeCovert(uint kingdomId);
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

    address private militaryFactoryAddress;
    address private kingdomFactoryAddress;

    uint256 private recruitCooldown = 5 minutes; // 6 hours;
    uint256 private attackCooldown = 5 minutes; // 1 hour;

    mapping (address => uint256) private kingdomOf;
    mapping (uint256 => address) private kingdomToOwner;
    
    mapping (uint256 => string)  private name;
    mapping (uint256 => uint256) private recruitTime;
    mapping (uint256 => uint256) private attackTime;

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

    Battle[] private battles;

    function RealmOfWars(address _kingdomFactoryAddress, address _militaryFactoryAddress) public {
        kingdomFactoryAddress = _kingdomFactoryAddress;
        militaryFactoryAddress = _militaryFactoryAddress;
        _createKingdom("God", 0, [50, 14, 16, 15], [uint(1000000), uint(200000), uint(200000), uint(10000), uint(10000)], 0);
        _createKingdom("God\'s Right Hand", 0, [30, 12, 14, 10], [uint(100000), uint(20000), uint(20000), uint(1000), uint(1000)], 0);
        _createKingdom("God\'s Left Hand", 0, [30, 12, 14, 10], [uint(100000), uint(20000), uint(20000), uint(1000), uint(1000)], 0);
    }

    function _createKingdom(string _name, uint8 _race, uint8[4] _level, uint[5] _militaryCount, uint _commander)
        private returns (uint){
    
        KingdomFactoryInterface kf = KingdomFactoryInterface(kingdomFactoryAddress);
        MilitaryFactoryInterface mf = MilitaryFactoryInterface(militaryFactoryAddress);
        uint id = kf._createKingdom(_race,  _level,  _commander);
        mf._createMilitary(_militaryCount);
        name[id] = _name;
        kingdomToOwner[id] = msg.sender;
        kingdomOf[msg.sender] = id;
        NewKingdom(id, _name, _race);
        return id;
    }

    function createNewKingdom(string _name, uint _race, uint _commanderId) public returns (uint){
        require(kingdomOf[msg.sender] == 0);
        require(_race >= 1 && _race <= 5);
        return _createKingdom(_name, uint8(_race), [1, 0, 0, 0], [uint(0), uint(0), uint(0), uint(0), uint(0)], _commanderId);
    }

    function getKingdom(uint _id) public view returns (string, uint8, uint8[4], uint, uint, uint, string) {
        KingdomFactoryInterface kf = KingdomFactoryInterface(kingdomFactoryAddress);
        var (race, level, gold, experience, commanderId) = kf.getKingdom(_id);
        return (name[_id], race, level, gold, experience, commanderId, name[commanderId]);
    }

    function getPersonnel(uint _id) private view returns (uint256[7]) {
      MilitaryFactoryInterface mf = MilitaryFactoryInterface(militaryFactoryAddress);
      return mf.getMilitary(_id);
    }


    function spyOnPersonnel(uint _targetId) public view returns (bool, uint256[7]) {
      uint256 senderId = kingdomOf[msg.sender];
      require(senderId > 0);
      MilitaryFactoryInterface mf = MilitaryFactoryInterface(militaryFactoryAddress);
      if(senderId == _targetId){
        //TODO: Can include success spy if target is commander
        return (true, mf.getMilitary(_targetId));
      }
      return mf.spyOnMilitary(senderId, _targetId);
    }

    function gainExperience(uint _id, uint _exp) private {
        KingdomFactoryInterface kf = KingdomFactoryInterface(kingdomFactoryAddress);
        kf.gainExperience(_id, _exp);
    }

    function getWeaponMultiplier() public view returns (uint8) {
        KingdomFactoryInterface kf = KingdomFactoryInterface(kingdomFactoryAddress);
        return kf.getWeaponMultiplier();
    }

    function getFortressMultiplier() public view returns (uint8) {
        KingdomFactoryInterface kf = KingdomFactoryInterface(kingdomFactoryAddress);
        return kf.getFortressMultiplier();
    }

    /// @notice Returns a list of all kingdom IDs that are officers of target commander.
    /// @param _commanderId The ID of the commander we are interested in.
    /// @dev This method MUST NEVER be called by smart contract code. First, it's fairly
    ///  expensive (it walks the entire kingdoms array looking for kingdoms belonging to commander),
    ///  but it also returns a dynamic array, which is only supported for web3 calls, and
    ///  not contract-to-contract calls.
    function getOfficers(uint _commanderId) public view returns (uint[]){
      KingdomFactoryInterface kf = KingdomFactoryInterface(kingdomFactoryAddress);
      uint256 officerCount = kf.getOfficerCount(_commanderId);

      if(officerCount == 0){
        // Return an empty array
        return new uint256[](0);
      } else {
        uint256 id; //for iterating over kingdoms
        uint256 numOfKingdoms = kf.getKingdomCount();
        uint256 officerIndex = 0;
        uint256[] memory officers = new uint256[](officerCount);

        // We count on the fact that all kingdoms have IDs starting at 1 and increasing
        // sequentially up to kingdoms.length.
        for(id = 0; id < numOfKingdoms; id++){
          uint thisCommanderId = kf.getCommanderId(id);
          if(thisCommanderId == _commanderId){
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

    function getMyKingdom() public view returns (string, uint8, uint8[4], uint, uint, uint, string) {
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
        KingdomFactoryInterface kf = KingdomFactoryInterface(kingdomFactoryAddress);
        return kf.getKingdomCount();
    }

    //********* User-Specific Actions **********
    //  #assignCommander - Assign new commander
    //  #upgradeWeapon   - Upgrade weapon by 1 level
    //  #upgradeFortress - Upgrade fortress by 1 level
    //

    function assignCommander(uint _commanderId) public {
      uint256 id = kingdomOf[msg.sender];
      KingdomFactoryInterface kf = KingdomFactoryInterface(kingdomFactoryAddress);
      kf.assignCommander(id, _commanderId);
      CommanderAssigned(id, _commanderId);
    }

    function ditchCommander() public {
        uint256 id = kingdomOf[msg.sender];
        KingdomFactoryInterface kf = KingdomFactoryInterface(kingdomFactoryAddress);
        kf.ditchCommander(id);
        CommanderAssigned(id, 0);
    }

    function isCommander(uint _commanderId) public view returns (bool) {
        KingdomFactoryInterface kf = KingdomFactoryInterface(kingdomFactoryAddress);
        return kf.isCommander(kingdomOf[msg.sender], _commanderId);
    }

    function changeRace(uint8 _race) public {
      uint256 id = kingdomOf[msg.sender];
      KingdomFactoryInterface kf = KingdomFactoryInterface(kingdomFactoryAddress);
      kf.changeRace(id, _race);
      ChangedRace(id, _race);
    }

    function upgradeWeapon() public {
      uint256 id = kingdomOf[msg.sender];
      KingdomFactoryInterface kf = KingdomFactoryInterface(kingdomFactoryAddress);
      kf.upgradeWeapon(id);
      UpgradeWeapon(id);
    }

    function upgradeFortress() public {
      uint256 id = kingdomOf[msg.sender];
      KingdomFactoryInterface kf = KingdomFactoryInterface(kingdomFactoryAddress);
      kf.upgradeFortress(id);
      UpgradeFortress(id);
    }

    function upgradeCovert() public {
      uint256 id = kingdomOf[msg.sender];
      KingdomFactoryInterface kf = KingdomFactoryInterface(kingdomFactoryAddress);
      kf.upgradeCovert(id);
      UpgradeCovert(id);
    }

    function strikeAction(uint256 _id) private view returns (uint256) {
        KingdomFactoryInterface kf = KingdomFactoryInterface(kingdomFactoryAddress);
        MilitaryFactoryInterface mf = MilitaryFactoryInterface(militaryFactoryAddress);
        return mf.strikeAction(_id) * kf.strikeAction(_id);
    }

    function defensiveAction(uint256 _id) private view returns (uint256) {
        KingdomFactoryInterface kf = KingdomFactoryInterface(kingdomFactoryAddress);
        MilitaryFactoryInterface mf = MilitaryFactoryInterface(militaryFactoryAddress);
        return mf.defensiveAction(_id) * kf.defensiveAction(_id);
    }

    function spyRating(uint256 _id) private view returns (uint256) {
        KingdomFactoryInterface kf = KingdomFactoryInterface(kingdomFactoryAddress);
        MilitaryFactoryInterface mf = MilitaryFactoryInterface(militaryFactoryAddress);
        return mf.spyRating(_id) * kf.spyRating(_id);
    }

    function sentryRating(uint256 _id) private view returns (uint256) {
        KingdomFactoryInterface kf = KingdomFactoryInterface(kingdomFactoryAddress);
        MilitaryFactoryInterface mf = MilitaryFactoryInterface(militaryFactoryAddress);
        return mf.sentryRating(_id) * kf.sentryRating(_id);
    }

    function myStrikeAction() public view returns (uint256) {
      var id = kingdomOf[msg.sender];
      require(id > 0);
      return strikeAction(id);
    }

    function myDefensiveAction() public view returns (uint256) {
      var id = kingdomOf[msg.sender];
      require(id > 0);
      return defensiveAction(id);
    }

    function mySpyRating() public view returns (uint256) {
      var id = kingdomOf[msg.sender];
      require(id > 0);
      return spyRating(id);
    }

    function mySentryRating() public view returns (uint256) {
      var id = kingdomOf[msg.sender];
      require(id > 0);
      return sentryRating(id);
    }

    //returns true,0 if can recruit, otherwise returns false and number of seconds remaining
    function canAttack() public view returns (bool, uint256){
      var id = kingdomOf[msg.sender];
      require(id > 0);
      uint256 timePassed = now - attackTime[id];
      if(timePassed > attackCooldown){
        return (true, 0);
      }
      return (false, attackCooldown - timePassed);
    }

    function attack(uint256 _targetId) public {
      uint256 attackerId = kingdomOf[msg.sender];
      require(attackerId > 0 && attackerId != _targetId);
      require (now - attackTime[attackerId] > attackCooldown);

      uint256 attacker_damage = strikeAction(attackerId);
      uint256 defender_damage = defensiveAction(_targetId);
      uint256 attacker_casualties = 0;
      uint256 defender_casualties = 0;
      bool success = attacker_damage > defender_damage;
      uint256 battleID = battles.push(Battle(now, attackerId, _targetId, attacker_damage, defender_damage, attacker_casualties, defender_casualties, success)) - 1;
      if(success){
          KingdomFactoryInterface kf = KingdomFactoryInterface(kingdomFactoryAddress);
          kf.gainExperience(attackerId, 100);
      }
      attackTime[attackerId] = now;
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
      KingdomFactoryInterface kf = KingdomFactoryInterface(kingdomFactoryAddress);
      MilitaryFactoryInterface mf = MilitaryFactoryInterface(militaryFactoryAddress);
      uint numOfOfficers = kf.getOfficerCount(id);
      mf.recruit(id, numOfOfficers);
      recruitTime[id] = now;
      Recruit(id);
    }

    function trainAttackSpecialists(uint256 _count) public {
      var id = kingdomOf[msg.sender];
      require(id > 0);
      MilitaryFactoryInterface mf = MilitaryFactoryInterface(militaryFactoryAddress);
      mf.trainAttackSpecialists(id, _count);
      TrainedAttackSpecialists(id, _count);
    }

    function trainDefenseSpecialists(uint256 _count) public {
      var id = kingdomOf[msg.sender];
      require(id > 0);
      MilitaryFactoryInterface mf = MilitaryFactoryInterface(militaryFactoryAddress);
      mf.trainDefenseSpecialists(id, _count);
      TrainedDefenseSpecialists(id, _count);
    }

    function trainSpies(uint256 _count) public {
      var id = kingdomOf[msg.sender];
      require(id > 0);
      MilitaryFactoryInterface mf = MilitaryFactoryInterface(militaryFactoryAddress);
      mf.trainSpies(id, _count);
      TrainedSpies(id, _count);
    }

    function trainSentries(uint256 _count) public {
      var id = kingdomOf[msg.sender];
      require(id > 0);
      MilitaryFactoryInterface mf = MilitaryFactoryInterface(militaryFactoryAddress);
      mf.trainSentries(id, _count);
      TrainedSentries(id, _count);
    }

    function reassignAttackSpecialists(uint256 _count) public {
      var id = kingdomOf[msg.sender];
      require(id > 0);
      MilitaryFactoryInterface mf = MilitaryFactoryInterface(militaryFactoryAddress);
      mf.reassignAttackSpecialists(id, _count);
      ReassignedAttackSpecialists(id, _count);
    }

    function reassignDefenseSpecialists(uint256 _count) public {
      var id = kingdomOf[msg.sender];
      require(id > 0);
      MilitaryFactoryInterface mf = MilitaryFactoryInterface(militaryFactoryAddress);
      mf.reassignDefenseSpecialists(id, _count);
      ReassignedDefenseSpecialists(id, _count);
    }

    function buyMercs(uint256 _attackMercsCount, uint256 _defenseMercsCount) public {
      var id = kingdomOf[msg.sender];
      require(id > 0);
      MilitaryFactoryInterface mf = MilitaryFactoryInterface(militaryFactoryAddress);
      mf.buyMercs(id, _attackMercsCount, _defenseMercsCount);
      PurchasedMercs(id, _attackMercsCount, _defenseMercsCount);
    }
}