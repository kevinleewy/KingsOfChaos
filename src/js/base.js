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
    $(document).on('click', '#recruitButton', App.recruitSoldiers);
    $(document).on('click', '#ditch_commander', App.handleDitchCommander);
    $(document).on('click', '#changeRaceButton', App.changeRace);
  },

  loadPage: function(kingdoms, account) {

    var kingdomFactoryInstance;

    App.contracts.KingdomFactory.deployed().then(function(instance) {
      kingdomFactoryInstance = instance;
      kingdomFactoryInstance.haveKingdom().then(function(haveKingdom){
        if(!haveKingdom){
          location.assign("create.html");
        }
        loadSections(haveKingdom);
      }).then(function() {

        kingdomFactoryInstance.getMyKingdomId().then(function(id){
            var recruitLink = $('#recruit').find('.recruit_link');
            var url = 'localhost:3000/pages/create.html?id=' + id;
            recruitLink.text(url);
            recruitLink.attr("href", url);
        });

        kingdomFactoryInstance.canRecruit().then(function(result){
          if(!result[0]){
            var recruitButton = $('#recruit').find('.recruitButton');
            recruitButton.attr("value", "Please come back in " + secondsToDays(result[1]));
            recruitButton.attr("disabled", "disabled");
          }
        });

        kingdomFactoryInstance.canAttack().then(function(result){
          var sidebar_user_stats = $('#sidebar_user_stats');
          if(result[0]){
            sidebar_user_stats.find('.attackCooldown').text("Ready");
          } else {
            sidebar_user_stats.find('.attackCooldown').text(secondsToDays(result[1]));
          }
        });

        kingdomFactoryInstance.getMyKingdom().then(function(kingdom) {
          var gold = numberWithCommas(kingdom[3].c[0]);
          var kingdomLevel = kingdom[2][0].c[0];
          var experience = numberWithCommas(kingdom[4].c[0]);
          var requiredExperience = numberWithCommas(100 * kingdomLevel * kingdomLevel);

          var sidebar_user_stats = $('#sidebar_user_stats');
          sidebar_user_stats.find('.gold').text(gold);
          sidebar_user_stats.find('.level').text(kingdomLevel);
          sidebar_user_stats.find('.experience').text(experience);
          
          var race = idToRace(kingdom[1].c[0]);
          var user_info = $('#user_info');
          user_info.find('.name').text(kingdom[0]);
          user_info.find('.race').text(race);
          user_info.find('.commander').attr("href", "/pages/stats.html?id=" + kingdom[5]);
          user_info.find('.commander').text(kingdom[6]);
          user_info.find('.level').text(kingdomLevel);
          user_info.find('.experience').text(experience);
          user_info.find('.requiredExperience').text(requiredExperience);

          var military_overview_table = $('#military_overview_table');
          military_overview_table.find('.weapon_name').text(weaponLevelToName(kingdom[2][1].c[0]));
          military_overview_table.find('.fortress_name').text(fortressLevelToName(kingdom[2][2].c[0]));
          military_overview_table.find('.gold').text(gold);
          military_overview_table.find('.covert_level').text(kingdom[2][3].c[0]);
        });

        kingdomFactoryInstance.getMyRecentAttacks().then(function(recentAttacks) {
          var recentAttacksOnYouTable = $('#recentAttacksTable');
          count = recentAttacks[1].c[0];
          recentAttacks = recentAttacks[0];
          if(count == 0){
            $('#recentAttacksTable tr:last').before('<tr><td colspan="6" align="center">No Recent Attacks on You</td></tr>');
          } else {
            for(var i = 0; i < count; i++){

              (function(index) {
                var attack = recentAttacks[index];
                var time = secondsToDays(attack[0].c[0]);
                var id = attack[1].c[0];
                var buttonId = 'attackButton' + id;
                kingdomFactoryInstance.getKingdom(id).then(function(enemyKingdom){
                  var name = enemyKingdom[0];
                  $('#recentAttacksTable tr:last').before('\
                    <tr>\
                        <td>' + time + ' ago</td>\
                        <td><a href=\"stats.html?id=' + id + '\">' + name + '</a></td>\
                        <td>32,668 Gold stolen</td>\
                        <td>\
                            <form action=\"App:attack()\">\
                                <input type=\"hidden\" name="defender_id" value="' + id + '">\
                                <input type=\"hidden\" name="attack_type" value="attack">\
                                <input style=\"width: 100%" name=\"attackbut\" id=\"' + buttonId + '\" onClick=\"this.value=\'Attacking..\'; this.attackbut.disabled=true; this.submit();\" type=\"submit\" value=\"Attack Now!\">\
                            </form>\
                        </td>\
                    </tr>\
                  ');
                  $(document).on('click', '#'+buttonId, App.attack);
                });
              })(i);
            } 
          }
        });

        kingdomFactoryInstance.getMyPersonnel().then(function(personnel) {
          var personnelTable = $('#personnel');
          personnelTable.find('.untrainedSoldiers').text(numberWithCommas(personnel[0]));
          personnelTable.find('.trainedAttackSoldiers').text(numberWithCommas(personnel[1]));
          personnelTable.find('.attackMercs').text(numberWithCommas(personnel[2]));
          personnelTable.find('.trainedDefenseSoldiers').text(numberWithCommas(personnel[3]));
          personnelTable.find('.defenseMercs').text(numberWithCommas(personnel[4]));
          personnelTable.find('.spies').text(numberWithCommas(personnel[5]));
          personnelTable.find('.sentries').text(numberWithCommas(personnel[6]));
          var totalFightingForce = 0;
          personnel.forEach(function(x){
            totalFightingForce += x.c[0];
          })
          personnelTable.find('.totalFightingForce').text(numberWithCommas(totalFightingForce));
          personnelTable.find('.personnelCount').text(numberWithCommas(totalFightingForce));
        });

        kingdomFactoryInstance.myStrikeAction().then(function(strikeAction){
          kingdomFactoryInstance.myDefensiveAction().then(function(defensiveAction){
            kingdomFactoryInstance.mySpyRating().then(function(spyRating){
              kingdomFactoryInstance.mySentryRating().then(function(sentryRating){
                var military_effectiveness_table = $('#military_effectiveness_table');
                military_effectiveness_table.find('.strikeAction').text(numberWithCommas(strikeAction));
                military_effectiveness_table.find('.defensiveAction').text(numberWithCommas(defensiveAction));
                military_effectiveness_table.find('.spyRating').text(numberWithCommas(spyRating));
                military_effectiveness_table.find('.sentryRating').text(numberWithCommas(sentryRating));
              });
            });
          });
        });

        kingdomFactoryInstance.getMyOfficers().then(function(officers) {

          if(officers.length == 0){
            $('#officers tr:last').before('<tr><td colspan="6" align="center">No Officers</td></tr>');
          } else {
            officers.forEach(function(officer){
              kingdomFactoryInstance.getKingdom(officer).then(function(kingdom) {
                kingdomFactoryInstance.spyOnPersonnel(officer).then(function(personnel) {
                  var totalFightingForce = 0;
                  personnel[1].forEach(function(x){
                    totalFightingForce += x.c[0];
                  })
                  $('#officers tr:last').before(
                    '<tr>\
                      <td ><a href=\"/pages/stats.html?id=' + officer.c[0] + '\" >' + kingdom[0] + '</a></td>\
                      <td  align="right">457</td>\
                      <td  align="right">' + totalFightingForce + '</td>\
                      <td  align="left">' + idToRace(kingdom[1].c[0]) + '</td>\
                      <td  align="right">0</td>\
                      <td  align="right"><a href="/pages/create.html?id=' + officer + '"> Link </a></td>\
                    </tr>'
                  );
                });
              });
            });
          }
        });
      });
    }).catch(function(err) {
      console.log('displayBase:' + err.message);
    });
  },

  recruitSoldiers: function(event){
    event.preventDefault();

    this.value = "Recruiting...";
    this.disabled = "disabled";
    var kingdomFactoryInstance;

    App.contracts.KingdomFactory.deployed().then(function(instance) {
      kingdomFactoryInstance = instance;
      kingdomFactoryInstance.recruit().then(function(haveKingdom){
        kingdomFactoryInstance.Recruit().watch(function(err, response){
          alert("Recruited!");
          location.assign("base.html");
        });
      })
    }).catch(function(err) {
      console.log('Recruiting:' + err.message);
    });

  },

  handleDitchCommander: function(event) {
    event.preventDefault();

    var kingdomFactoryInstance;

    App.contracts.KingdomFactory.deployed().then(function(instance) {
      kingdomFactoryInstance = instance;
      kingdomFactoryInstance.haveKingdom().then(function(haveKingdom){
        if(!haveKingdom){
          location.assign("create.html");
        }
        alert("If unable to perform, try increasing gas limit");
        kingdomFactoryInstance.ditchCommander().then(function(){
          alert("Ditched Commander");
        });
      })
    }).catch(function(err) {
      console.log('Ditch Commander:' + err.message);
    });
  },

  attack: function(event) {
    event.preventDefault();

    var kingdomFactoryInstance;
    var targetId = event.target.id;
    targetId = targetId.charAt(targetId.length - 1);

    App.contracts.KingdomFactory.deployed().then(function(instance) {
      kingdomFactoryInstance = instance;
    }).then(function() {
      kingdomFactoryInstance.haveKingdom().then(function(haveKingdom){
        if(!haveKingdom){
          location.assign("create.html");
        }

        kingdomFactoryInstance.attack(targetId).then(function(){
          alert("Attacked!");
          kingdomFactoryInstance.BattleCompleted().watch(function(err, response){
            var battleId = response.args.battleId.c[0];
            location.assign("battle_report.html?id=" + battleId + "&pov=1");
          });
        });


      });

    }).catch(function(err) {
      console.log('Attack:' + err.message);
    });
  },

  changeRace: function(event) {
    event.preventDefault();

    var race = $('#race').val();
    if(race < 1 || race > 5){
      console.log('Invalid race ID: ' + race);
    } else {

      var kingdomFactoryInstance;

      App.contracts.KingdomFactory.deployed().then(function(instance) {
        kingdomFactoryInstance = instance;
      }).then(function() {

        kingdomFactoryInstance.getMyKingdom().then(function(kingdom) {
          if(kingdom[1].c[0] == race){
            alert("Cannot select current race");
          } else {
            //console.log("changing from "+ idToRace(kingdom[1].c[0]) +" to "+ idToRace(race));
            kingdomFactoryInstance.changeRace(race).then(function(){

              kingdomFactoryInstance.ChangedRace().watch(function(err, response){
                alert("Changed Race!");
                location.assign("base.html");
              });
            });
          }
        });
      }).catch(function(err) {
        console.log('Attack:' + err.message);
      });
    }
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
    $("#myInfo").load("../sections/myInfo.html");
    $("#myOfficers").load("../sections/myOfficers.html");
    $("#recentAttacks").load("../sections/recentAttacks.html");
    $("#military_overview").load("../sections/military_overview.html");
    $("#military_effectiveness").load("../sections/military_effectiveness.html");
};