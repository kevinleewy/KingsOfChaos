pragma solidity ^0.4.17;

//import 'zeppelin-solidity/contracts/ownership/Ownable.sol';

contract MilitaryFactory {

  event TrainedSentries(uint kingdomId, uint count);

	struct Military {
      uint256 numOfSoldiers;
      uint256 numOfAttackSpecialists;
      uint256 numOfAttackMercs;
      uint256 numOfDefenseSpecialists;
      uint256 numOfDefenseMercs;
      uint256 numOfSpies;
      uint256 numOfSentries;      
    }

    Military[] private militaries;

    function _createMilitary(uint[5] _militaryCount) public returns (uint) {
	    uint id = militaries.push(Military(_militaryCount[0], _militaryCount[1], 0, _militaryCount[2], 0, _militaryCount[3], _militaryCount[4])) - 1;
	    return id;
    }

    function getMilitary(uint _id) public view returns (uint256[7]) {
    	require(_id < militaries.length);
	    var military = militaries[_id];
	    return [military.numOfSoldiers, military.numOfAttackSpecialists, military.numOfAttackMercs, military.numOfDefenseSpecialists,
        	military.numOfDefenseMercs, military.numOfSpies, military.numOfSentries];
    }

    function spyOnMilitary(uint _spyId, uint _targetId) public view returns (bool, uint256[7]) {
      if(spyRating(_spyId) > sentryRating(_targetId)){
        return (true, getMilitary(_targetId));
      }
      return (false, [uint(0), uint(0), uint(0), uint(0), uint(0), uint(0), uint(0)]);
    }

    function strikeAction(uint256 _id) public view returns (uint256) {
        var military = militaries[_id];
        return (military.numOfSoldiers + 2 * (military.numOfAttackSpecialists + military.numOfAttackMercs));
    }

    function defensiveAction(uint256 _id) public view returns (uint256) {
        var military = militaries[_id];
        return (military.numOfSoldiers + 2 * (military.numOfDefenseSpecialists) + military.numOfDefenseMercs);
    }

    function spyRating(uint256 _id) public view returns (uint256) {
	    var military = militaries[_id];
	    return military.numOfSpies;
    }

    function sentryRating(uint256 _id) public view returns (uint256) {
		var military = militaries[_id];
		return military.numOfSentries;
  	}

  	function recruit(uint256 _id, uint256 _numOfOfficers) public {
    	militaries[_id].numOfSoldiers += 100 * (1 + _numOfOfficers);
    }

    function trainAttackSpecialists(uint256 _id, uint256 _count) public {
		var military = militaries[_id];
		require (military.numOfSoldiers >= _count);
		military.numOfSoldiers -= _count;
		military.numOfAttackSpecialists += _count;
    }

    function trainDefenseSpecialists(uint256 _id, uint256 _count) public {
		var military = militaries[_id];
		require (military.numOfSoldiers >= _count);
		military.numOfSoldiers -= _count;
		military.numOfDefenseSpecialists += _count;
    }

    function trainSpies(uint256 _id, uint256 _count) public {
      var military = militaries[_id];
      require (military.numOfSoldiers >= _count);
      military.numOfSoldiers -= _count;
      military.numOfSpies += _count;
    }

    function trainSentries(uint256 _id, uint256 _count) public {
      var military = militaries[_id];
      require (military.numOfSoldiers >= _count);
      military.numOfSoldiers -= _count;
      military.numOfSentries += _count;
    }

    function reassignAttackSpecialists(uint256 _id, uint256 _count) public {
      var military = militaries[_id];
      require (military.numOfAttackSpecialists >= _count);
      military.numOfSoldiers += _count;
      military.numOfAttackSpecialists -= _count;
    }

    function reassignDefenseSpecialists(uint256 _id, uint256 _count) public {
      var military = militaries[_id];
      require (military.numOfDefenseSpecialists >= _count);
      military.numOfSoldiers += _count;
      military.numOfDefenseSpecialists -= _count;
    }

    function buyMercs(uint256 _id, uint256 _attackMercsCount, uint256 _defenseMercsCount) public {
      var military = militaries[_id];
      military.numOfAttackMercs += _attackMercsCount;
      military.numOfDefenseMercs += _defenseMercsCount;
    }
}