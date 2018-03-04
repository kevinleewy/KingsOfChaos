pragma solidity ^0.4.17;

interface MilitaryFactoryInterface {

    function _createMilitary(uint[5] _militaryCount) public returns (uint);

    function getMilitary(uint _id) public view returns (uint256[7]);

    function spyOnMilitary(uint _spyId, uint _targetId) public view returns (bool, uint256[7]);

    function strikeAction(uint256 _id) public view returns (uint256);

    function defensiveAction(uint256 _id) public view returns (uint256);

    function spyRating(uint256 _id) public view returns (uint256);

    function sentryRating(uint256 _id) public view returns (uint256);

    function recruit(uint256 _id, uint256 _numOfOfficers) public ;

    function trainAttackSpecialists(uint256 _id, uint256 _count) public;

    function trainDefenseSpecialists(uint256 _id, uint256 _count) public ;

    function trainSpies(uint256 _id, uint256 _count) public ;

    function trainSentries(uint256 _id, uint256 _count) public ;

    function reassignAttackSpecialists(uint256 _id, uint256 _count) public ;

    function reassignDefenseSpecialists(uint256 _id, uint256 _count) public ;

    function buyMercs(uint256 _id, uint256 _attackMercsCount, uint256 _defenseMercsCount) public ;
}