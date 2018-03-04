pragma solidity ^0.4.17;

interface KingdomFactoryInterface {   

    function _createKingdom(uint8 _race, uint8[4] _level, uint _commander) public returns (uint);

    function getKingdom(uint _id) public view returns (uint8, uint8[4], uint, uint, uint);

    function gainExperience(uint _id, uint _exp) public ;

    function getCommanderId(uint _id) public view returns (uint256) ;

    function getWeaponMultiplier() public view returns (uint8) ;

    function getFortressMultiplier() public view returns (uint8) ;

    function getKingdomCount() public view returns (uint) ;

    function getOfficerCount(uint _id) public view returns (uint);

    //********* User-Specific Actions **********
    //  #assignCommander - Assign new commander
    //  #upgradeWeapon   - Upgrade weapon by 1 level
    //  #upgradeFortress - Upgrade fortress by 1 level
    //

    function assignCommander(uint _targetId, uint _commanderId) public ;

    function ditchCommander(uint _targetId) public ;

    function isCommander(uint _targetId, uint _commanderId) public view returns (bool) ;

    function changeRace(uint _targetId, uint8 _race) public ;

    function upgradeWeapon(uint _id) public ;

    function upgradeFortress(uint _id) public ;

    function upgradeCovert(uint _id) public ;

    function strikeAction(uint256 _id) public view returns (uint256) ;

    function defensiveAction(uint256 _id) public view returns (uint256) ;

    function spyRating(uint256 _id) public view returns (uint256) ;

    function sentryRating(uint256 _id) public view returns (uint256) ;
    
}