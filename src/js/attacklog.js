App = {
  web3Provider: null,
  contracts: {},

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
    //$(document).on('click', '#createButton', App.handleJoin);
  },

  loadPage: function(kingdoms, account) {
    var kingdomFactoryInstance;

    App.contracts.KingdomFactory.deployed().then(function(instance) {
      kingdomFactoryInstance = instance;
      var count = kingdomFactoryInstance.getKingdomCount();
      return count;
    }).then(function(numOfKingdoms) {

      var start;
      var end;
      kingdomFactoryInstance.haveKingdom().then(function(haveKingdom){
        if(!haveKingdom){
          location.assign("create.html");
        }
        loadSections(haveKingdom);

      }).then(function(){

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

        kingdomFactoryInstance.getMyRecent10IncomingAttacks().then(function(recentAttacks) {

          count = recentAttacks[1].c[0];
          recentAttacks = recentAttacks[0];
          if(count == 0){
            $('#recentAttacksOnYouTable tr:last').before('<tr><td colspan="9" align="center">No Recent Attacks on You</td></tr>');
          } else {
            for(var i = 0; i < count; i++){

              (function(index) {
                var attack = recentAttacks[index];
                var time = secondsToDays(attack[0].c[0]);
                var battleId = attack[1].c[0];
                kingdomFactoryInstance.getBattle(battleId).then(function(battle){
                  var enemyKingdomId = battle[0].c[0];
                  kingdomFactoryInstance.getKingdom(enemyKingdomId).then(function(enemyKingdom){
                    var name = enemyKingdom[0];
                    $('#recentAttacksOnYouTable tr:last').before('\
                        <tr>\
                            <td align="right">' + time + '</td>\
                            <td align="left"> ago</td>\
                            <td align="left"><a href="stats.html?id=' + enemyKingdomId + '">' + name + '</a></td>\
                            <td align="left">attack</td>\
                            <td align="right"><a href="battle_report.html?id=' + battleId + '">14,728 Gold stolen</a></td>\
                            <td align="right">' + numberWithCommas(battle[4].c[0]) + '</td>\
                            <td align="right">' + numberWithCommas(battle[5].c[0]) + '</td>\
                            <td align="right">' + numberWithCommas(battle[2].c[0]) + '</td>\
                            <td align="right">' + numberWithCommas(battle[3].c[0]) + '</td>\
                        </tr>\
                    ');
                  });
                });
              })(i);
            } 
          }
          $('#recentAttacksOnYouTable').find('.totalAttacksOnYou').text(count);
        });

        kingdomFactoryInstance.getMyRecent10OutgoingAttacks().then(function(recentAttacks) {

          count = recentAttacks[1].c[0];
          recentAttacks = recentAttacks[0];
          if(count == 0){
            $('#recentAttacksByYouTable tr:last').before('<tr><td colspan="9" align="center">No Recent Attacks by You</td></tr>');
          } else {
            for(var i = 0; i < count; i++){

              (function(index) {
                var attack = recentAttacks[index];
                var time = secondsToDays(attack[0].c[0]);
                var battleId = attack[1].c[0];
                kingdomFactoryInstance.getBattle(battleId).then(function(battle){
                  var enemyKingdomId = battle[1].c[0];
                  kingdomFactoryInstance.getKingdom(enemyKingdomId).then(function(enemyKingdom){
                    var name = enemyKingdom[0];
                    $('#recentAttacksByYouTable tr:last').before('\
                        <tr>\
                            <td align="right">' + time + '</td>\
                            <td align="left"> ago</td>\
                            <td align="left"><a href="stats.html?id=' + enemyKingdomId + '">' + name + '</a></td>\
                            <td align="right"><a href="battle_report.html?id=' + battleId + '">14,728 Gold stolen</a></td>\
                            <td align="right">' + numberWithCommas(battle[5].c[0]) + '</td>\
                            <td align="right">' + numberWithCommas(battle[4].c[0]) + '</td>\
                            <td align="right">' + numberWithCommas(battle[3].c[0]) + '</td>\
                            <td align="right">' + numberWithCommas(battle[2].c[0]) + '</td>\
                        </tr>\
                    ');
                  });
                });
              })(i);
            } 
          }
          $('#recentAttacksByYouTable').find('.totalAttacksByYou').text(count);
        });
      });

    }).catch(function(err) {
      console.log('displayKingdoms:' + err.message);
    });
  },

};

$(function() {
  $(window).load(function() {
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
};

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
      return 'Humans';
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

function numberWithCommas(x) {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

function secondsToDays(seconds) {

  var days = Math.floor(seconds / (3600*24));
  seconds -= days*3600*24;
  var hrs  = Math.floor(seconds / 3600);
  seconds -= hrs*3600;
  var mnts = Math.floor(seconds / 60);
  seconds -= mnts*60;
  if(days > 0){
    if(hrs > 0){
      return days+" days, "+hrs+" hours";
    }
    return days+" days";
  } else if (hrs > 0){
    if(mnts > 0){
      return hrs+" hours, "+mnts+" minutes";
    }
    return hrs+" hours";
  } else if (mnts > 0){
    if(seconds > 0){
      return mnts+" minutes, "+seconds+" seconds";
    }
    return mnts + " minutes";
  }
  return seconds + " seconds";
};