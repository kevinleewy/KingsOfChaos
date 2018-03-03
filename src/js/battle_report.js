App = {
  web3Provider: null,
  contracts: {},

  battleId: null,
  targetId: null,
  pov: 3,

  init: function() {
    return App.initWeb3();
  },

  initWeb3: function() {
    // Is there an injected web3 instance?
    if (typeof web3 !== 'undefined') {
      App.web3Provider = web3.currentProvider;
    } else {
      // If no injected web3 instance is detected, fall back to Ganache
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:9545');
    }
    web3 = new Web3(App.web3Provider);

    return App.initContract();
  },

  initContract: function() {
    $.getJSON('../KingdomFactory.json', function(data) {
      // Get the necessary contract artifact file and instantiate it with truffle-contract
      var KingdomFactoryArtifact = data;
      App.contracts.KingdomFactory = TruffleContract(KingdomFactoryArtifact);

      // Set the provider for our contract
      App.contracts.KingdomFactory.setProvider(App.web3Provider);

      // Use our contract to retrieve display kingdoms
      return App.loadPage();
    });

    return App.bindEvents();
  },

  bindEvents: function() {
    $(document).on('click', '#attackButton', App.attack);
  },

  loadPage: function(kingdoms, account) {

    var kingdomFactoryInstance;

    App.contracts.KingdomFactory.deployed().then(function(instance) {
      kingdomFactoryInstance = instance;
      App.battleId = GetURLParameter('id');
      App.pov = GetURLParameter('pov');
      kingdomFactoryInstance.haveKingdom().then(function(haveKingdom){
        if(!haveKingdom){
          location.assign("create.html");
        }
        loadSections(haveKingdom);
      }).then(function() {
          kingdomFactoryInstance.getMyKingdom().then(function(kingdom){
            var gold = numberWithCommas(kingdom[3].c[0]);
            var kingdomLevel = kingdom[2][0].c[0];
            var experience = numberWithCommas(kingdom[4].c[0]);
            var requiredExperience = numberWithCommas(100 * kingdomLevel * kingdomLevel);

            var sidebar_user_stats = $('#sidebar_user_stats');
            sidebar_user_stats.find('.gold').text(gold);
            sidebar_user_stats.find('.level').text(kingdomLevel);
            sidebar_user_stats.find('.experience').text(experience);
          });

          kingdomFactoryInstance.canAttack().then(function(result){
            var sidebar_user_stats = $('#sidebar_user_stats');
            if(result[0]){
              sidebar_user_stats.find('.attackCooldown').text("Ready");
            } else {
              sidebar_user_stats.find('.attackCooldown').text(secondsToDays(result[1]));
            }
          });

        kingdomFactoryInstance.getBattle(App.battleId).then(function(battle) {
          if(App.pov == 1){
            App.targetId = battle[1];
          }
          if(App.pov == 2){
            App.targetId = battle[0];
          }
          kingdomFactoryInstance.getKingdom(battle[0]).then(function(attacker){
            kingdomFactoryInstance.getKingdom(battle[1]).then(function(defender){
              var battleInfo = parseBattleInfo(battle, attacker[0], defender[0], App.pov);
              $('#myName').text(battleInfo[0]);
              $('#myId').text(battleInfo[1]);
              $('#myDamage').text(battleInfo[2]);
              $('#myCasualties').text(battleInfo[3]);
              $('#otherName').text(battleInfo[4]);
              $('#otherId').text(battleInfo[5]);
              $('#otherDamage').text(battleInfo[6]);
              $('#otherCasualties').text(battleInfo[7]);
              if(battleInfo[8]){
                $('#winnerName').text(battleInfo[0]);
                $('#loserName').text(battleInfo[4]);
                $('#resultPhrase').attr("color", "GREEN");
              } else {
                $('#winnerName').text(battleInfo[4]);
                $('#loserName').text(battleInfo[0]);
                $('#resultPhrase').attr("color", "RED");
              }
            });
          });
        });
      });  
    }).catch(function(err) {
      console.log('Battle Report:' + err.message);
    });
  },

  attack: function(event) {
    event.preventDefault();

    var kingdomFactoryInstance;

    App.contracts.KingdomFactory.deployed().then(function(instance) {
      kingdomFactoryInstance = instance;
    }).then(function() {
      kingdomFactoryInstance.haveKingdom().then(function(haveKingdom){
        if(!haveKingdom){
          location.assign("create.html");
        }

        kingdomFactoryInstance.attack(App.targetId).then(function(){
          kingdomFactoryInstance.BattleCompleted().watch(function(err, response){
            alert("Attacked!");
            var battleId = response.args.battleId.c[0];
            location.assign("battle_report.html?id=" + battleId + "&pov=1");
          });
        });


      });

    }).catch(function(err) {
      console.log('Attack:' + err.message);
    });
  },

};

$(function() {
  //$(window).load(function() {
  $(window).ready(function() {
    App.init();
  });
});


function GetURLParameter(sParam) {
    var sPageURL = window.location.search.substring(1);
    var sURLVariables = sPageURL.split('&');
    for (var i = 0; i < sURLVariables.length; i++) {
        var sParameterName = sURLVariables[i].split('=');
        if (sParameterName[0] == sParam) {
            return sParameterName[1];
        }
    }
}

function loadSections(haveKingdom){
    $("#header").load("../sections/header.html");
    $("#footer").load("../sections/footer.html");
    if(haveKingdom){
      $("#sidebar").load("../sections/sidebar2.html");
    } else {
      $("#sidebar").load("../sections/sidebar.html");
    }
};

function idToRace(id){
  switch (id) {
    case (0):
      return 'Divine';
    case (1):
      return 'Human';
    case (2):
      return 'Dwarves';
    case (3):
      return 'Elves';
    case (4):
      return 'Orcs';
    case (5):
      return 'Undead';      
    default:
      throw 'Invalid Race ID';
  }
};

function weaponLevelToName(level){
  switch (level) {
    case (0):
      return 'None';
    case (1):
      return 'Flaming Arrows';
    case (2):
      return 'Ballistas';
    case (3):
      return 'Battering Ram';
    case (4):
      return 'Ladders';
    case (5):
      return 'Trojan Horse';
    case (6):
      return 'Catapults'; 
    case (7):
      return 'War Elephants'; 
    case (8):
      return 'Siege Towers';
    case (9):
      return 'Trebuchets'; 
    case (10):
      return 'Black Powder';
    case (11):
      return 'Sappers';
    case (12):
      return 'Dynamite';
    case (13):
      return 'Greek Fire';
    case (14):
      return 'Cannons'; 
    default:
      throw 'Invalid Weapon Level';
  }
};

function fortressLevelToName(level){
  switch (level) {
    case (0):
      return 'Camp';
    case (1):
      return 'Stockade';
    case (2):
      return 'Rabid Pitbulls';
    case (3):
      return 'Walled Town';
    case (4):
      return 'Towers';
    case (5):
      return 'Battlements';
    case (6):
      return 'Portcullis'; 
    case (7):
      return 'Boiling Oil'; 
    case (8):
      return 'Trenches';
    case (9):
      return 'Moat'; 
    case (10):
      return 'Draw Bridge';
    case (11):
      return 'Fortress';
    case (12):
      return 'Stronghold';
    case (13):
      return 'Palace';
    case (14):
      return 'Keep';
    case (15):
      return 'Citadel'; 
    case (16):
      return 'Hand of God'; 
    default:
      throw 'Invalid Fortress Level';
  }
};

function numberWithCommas(x) {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

function parseBattleInfo(battle, attacker_name, defender_name, pov) {
  var user1_name;
  var user1_id;
  var user1_damage;
  var user1_casualties;
  var user2_name;
  var user2_id;
  var user2_damage;
  var user2_casualties;
  var success;

  if(pov == 2){
    user1_name = 'Your';
    user1_id = battle[1];
    user1_damage = battle[3];
    user1_casualties = battle[5];
    user2_name = attacker_name + "\'s";
    user2_id = battle[0];
    user2_damage = battle[2];
    user2_casualties = battle[4];
    success = !battle[6];

  } else {
    if(pov == 1){
      user1_name = 'Your';
    } else {
      user1_name = attacker_name + "\'s";
    }
    user1_id = battle[0];
    user1_damage = battle[2];
    user1_casualties = battle[4];
    user2_name = defender_name + "\'s";
    user2_id = battle[1];
    user2_damage = battle[3];
    user2_casualties = battle[5];
    success = battle[6];    
  }

  return [
    user1_name,
    user1_id,
    numberWithCommas(user1_damage),
    numberWithCommas(user1_casualties),
    user2_name,
    user2_id,
    numberWithCommas(user2_damage),
    numberWithCommas(user2_casualties),
    success
  ];
};
