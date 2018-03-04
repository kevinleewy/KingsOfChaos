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
    $.getJSON('../RealmOfWars.json', function(data) {
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
    $(document).on('click', '#assignButton', App.changeCommander);
  },

  loadPage: function(kingdoms, account) {
    var kingdomFactoryInstance;

    App.contracts.KingdomFactory.deployed().then(function(instance) {
      kingdomFactoryInstance = instance;
      var id = GetURLParameter('id');
      return id;
    }).then(function(id) {
      kingdomFactoryInstance.haveKingdom().then(function(haveKingdom){
        loadSections(haveKingdom);
        if(haveKingdom){
          kingdomFactoryInstance.getMyKingdom().then(function(kingdom){
            var gold = numberWithCommas(kingdom[3].c[0]);
            var kingdomLevel = kingdom[2][0].c[0];
            var experience = numberWithCommas(kingdom[4].c[0]);
            var requiredExperience = numberWithCommas(100 * kingdomLevel * kingdomLevel);

            var sidebar_user_stats = $('#sidebar_user_stats');
            sidebar_user_stats.find('.gold').text(gold);
            sidebar_user_stats.find('.level').text(kingdomLevel);
            sidebar_user_stats.find('.experience').text(experience);

            kingdomFactoryInstance.isCommander(id).then(function(isCommander){
              kingdomFactoryInstance.isMyKingdomId(id).then(function(isMyId){
                var button = $('#assignButton');
                if(isCommander){
                  button.attr('disabled','disabled');
                  button.text("Already my commander");
                } else if(isMyId) {
                  button.attr('disabled','disabled');
                  button.text("This is my kingdom");                  
                } else {
                  button.removeAttr('disabled');
                  button.text("Make chosen my commander!");
                }
              });
            });
          });

          kingdomFactoryInstance.canAttack().then(function(result){
            var sidebar_user_stats = $('#sidebar_user_stats');
            if(result[0]){
              sidebar_user_stats.find('.attackCooldown').text("Ready");
            } else {
              sidebar_user_stats.find('.attackCooldown').text(secondsToDays(result[1]));
            }
          });

          App.buttonLink = "pages/base.html";
        }
      }).then(function(){

        kingdomFactoryInstance.getKingdom(id).then(function(kingdom) {
          kingdomFactoryInstance.spyOnPersonnel(id).then(function(personnel) {
            
            var race = idToRace(kingdom[1].c[0]);
            var kingdomLevel = kingdom[2][0].c[0];
            var experience = numberWithCommas(kingdom[4].c[0]);
            var requiredExperience = numberWithCommas(100 * kingdomLevel * kingdomLevel);

            var user_stats = $('#user_stats');
            user_stats.find('.name').text(kingdom[0]);
            user_stats.find('.race').text(race);
            if(personnel[0]){
              var totalFightingForce = 0;
              personnel[1].forEach(function(x){
                totalFightingForce += x.c[0];
              })
              user_stats.find('.numOfSoldiers').text(numberWithCommas(totalFightingForce));
            } else {
              user_stats.find('.numOfSoldiers').text("???");              
            }
            user_stats.find('.level').text(kingdomLevel);
            user_stats.find('.weaponLevel').text(kingdom[2][1]);
            user_stats.find('.fortressLevel').text(kingdom[2][2]);
            user_stats.find('.experience').text(experience);
            user_stats.find('.requiredExperience').text(requiredExperience);
            user_stats.find('.commander').attr("href", "/pages/stats.html?id=" + kingdom[5]);
            user_stats.find('.commander').text(kingdom[6]);

          });
        });

        kingdomFactoryInstance.getOfficers(id).then(function(officers) {

          if(officers.length == 0){
            $('#officers tr:last').before('<tr><td colspan="6" align="center">No Officers</td></tr>');
          } else {
            officers.forEach(function(officer){
              kingdomFactoryInstance.getKingdom(officer).then(function(kingdom) {
                kingdomFactoryInstance.spyOnPersonnel(officer).then(function(personnel) {
                  var kingdomLevel = kingdom[2][0].c[0];
                  var totalFightingForce;
                  if(personnel[0]){
                    totalFightingForce = 0;
                    personnel[1].forEach(function(x){
                      totalFightingForce += x.c[0];
                    })
                    totalFightingForce = numberWithCommas(totalFightingForce);
                  } else {
                    totalFightingForce = "???";            
                  }

                  $('#officers tr:last').before(
                    '<tr>\
                      <td ><a href=\"/pages/stats.html?id=' + officer.c[0] + '\" >' + kingdom[0] + '</a></td>\
                      <td  align="right">' + kingdomLevel + '</td>\
                      <td  align="right">' + totalFightingForce + '</td>\
                      <td  align="left">' + idToRace(kingdom[1].c[0]) + '</td>\
                    </tr>'
                  );
                });
              });
            });
          }
        });
      });

    }).catch(function(err) {
      console.log('displayUserStats:' + err.message);
    });
  },
  
  attack: function(event) {
    event.preventDefault();

    var kingdomFactoryInstance;
    var targetId;

    App.contracts.KingdomFactory.deployed().then(function(instance) {
      kingdomFactoryInstance = instance;
      targetId = GetURLParameter('id');
    }).then(function() {
      kingdomFactoryInstance.haveKingdom().then(function(haveKingdom){
        if(!haveKingdom){
          location.assign("create.html");
        }

        kingdomFactoryInstance.attack(targetId).then(function(){
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

  changeCommander: function(event) {
    event.preventDefault();

    var kingdomFactoryInstance;

    App.contracts.KingdomFactory.deployed().then(function(instance) {
      kingdomFactoryInstance = instance;
      var id = GetURLParameter('id');
      return id;
    }).then(function(id) {
      kingdomFactoryInstance.haveKingdom().then(function(haveKingdom){
        if(!haveKingdom){
          location.assign("create.html");
        }

        kingdomFactoryInstance.assignCommander(id).then(function(){
          kingdomFactoryInstance.CommanderAssigned().watch(function(err, response){
            alert("Changed Commander!");
            location.assign("");
          });
        });


      });

    }).catch(function(err) {
      console.log('changeCommander:' + err.message);
    });
  },

};

$(function() {
  //$(window).load(function() {
  $(window).ready(function() {
    App.init();
  });
});


function loadSections(haveKingdom){
    $("#header").load("../sections/header.html");
    $("#footer").load("../sections/footer.html");
    if(haveKingdom){
      $("#sidebar").load("../sections/sidebar2.html");
    } else {
      $("#sidebar").load("../sections/sidebar.html");
    }
    $("#user_stats").load("../sections/user_stats.html");
    $("#officers").load("../sections/officers.html");
};
