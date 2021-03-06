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
    $(document).on('click', '#upgradeFortressButton', App.upgradeFortress);
    $(document).on('click', '#upgradeWeaponButton', App.upgradeWeapon);
  },

  loadPage: function(kingdoms, account) {

    var kingdomFactoryInstance;
    var gold;

    App.contracts.KingdomFactory.deployed().then(function(instance) {
      kingdomFactoryInstance = instance;
      kingdomFactoryInstance.haveKingdom().then(function(haveKingdom){
        if(!haveKingdom){
          location.assign("create.html");
        }
        loadSections(haveKingdom);
      })
    }).then(function() {
      kingdomFactoryInstance.getMyKingdom().then(function(kingdom) {
        var gold = numberWithCommas(kingdom[3].c[0]);
        var kingdomLevel = kingdom[2][0].c[0];
        var experience = numberWithCommas(kingdom[4].c[0]);
        var requiredExperience = numberWithCommas(100 * kingdomLevel * kingdomLevel);

        var sidebar_user_stats = $('#sidebar_user_stats');
        sidebar_user_stats.find('.gold').text(gold);
        sidebar_user_stats.find('.level').text(kingdomLevel);
        sidebar_user_stats.find('.experience').text(experience);

        kingdomFactoryInstance.getWeaponMultiplier().then(function(multiplier) {
          var upgradeWeaponForm = $('#upgradeWeapon');
          var weaponLevel = kingdom[2][1].c[0];
          totalMultiplier = Math.pow(1 + multiplier/100, weaponLevel).toFixed(2);
          upgradeWeaponForm.find('.weapon_name').text(weaponLevelToName(weaponLevel));
          upgradeWeaponForm.find('.weapon_multiplier').text(totalMultiplier);
          if(weaponLevel < 14){
            upgradeWeaponForm.find('.upgradeWeaponButton').attr("value", "81,920,000 Gold For " + weaponLevelToName(weaponLevel + 1) + " (+" + multiplier + "%)");
          } else {
            upgradeWeaponForm.find('.upgradeWeaponButton').attr("value", "Fully upgraded.");
            upgradeWeaponForm.find('.upgradeWeaponButton').attr("disabled", "disabled");
          }
        });

        kingdomFactoryInstance.getFortressMultiplier().then(function(multiplier) {
          var upgradeFortressForm = $('#upgradeFortress');
          var fortressLevel = kingdom[2][2].c[0];
          totalMultiplier = Math.pow(1 + multiplier/100, fortressLevel).toFixed(2);
          upgradeFortressForm.find('.fortress_name').text(fortressLevelToName(fortressLevel));
          upgradeFortressForm.find('.fortress_multiplier').text(totalMultiplier);
          if(fortressLevel < 16){
            upgradeFortressForm.find('.upgradeFortressButton').attr("value", "10,240,000 Gold For " + fortressLevelToName(fortressLevel + 1) + " (+" + multiplier + "%)");
          } else {
            upgradeFortressForm.find('.upgradeFortressButton').attr("value", "Fully upgraded.");
            upgradeFortressForm.find('.upgradeFortressButton').attr("disabled", "disabled");
          }
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

      kingdomFactoryInstance.getMyOfficers().then(function(officers) {


        if(officers.length == 0){

          $('#officers tr:last').before('<tr><td colspan="6" align="center">No Officers</td></tr>');
        } else {
          officers.forEach(function(officer){
            kingdomFactoryInstance.getKingdom(officer).then(function(kingdom) {
              $('#officers tr:last').before(
                '<tr>\
                  <td ><a href=\"/pages/stats.html?id=' + officer.c[0] + '\" >' + kingdom[0] + '</a></td>\
                  <td  align="right">457</td>\
                  <td  align="right">' + kingdom[2] + '</td>\
                  <td  align="left">' + idToRace(kingdom[1].c[0]) + '</td>\
                </tr>'
              );
            });
          });
        }
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
      
      kingdomFactoryInstance.getMyPersonnel().then(function(personnel) {
        var personnelTable = $('#personnel');
        personnelTable.find('.untrainedSoldiers').text(numberWithCommas(personnel[0]));
        personnelTable.find('.trainedAttackSoldiers').text(numberWithCommas(personnel[1]));
        personnelTable.find('.trainedDefenseSoldiers').text(numberWithCommas(personnel[2]));
        personnelTable.find('.spies').text(numberWithCommas(personnel[3]));
        personnelTable.find('.sentries').text(numberWithCommas(personnel[4]));
        var totalFightingForce = 0;
        personnel.forEach(function(x){
          totalFightingForce += x.c[0];
        })
        personnelTable.find('.totalFightingForce').text(numberWithCommas(totalFightingForce));
        personnelTable.find('.personnelCount').text(numberWithCommas(totalFightingForce));
      });

    }).catch(function(err) {
      console.log('displayBase:' + err.message);
    });
  },

  upgradeFortress: function(event) {
    event.preventDefault();

    this.value = "Upgrading...";
    this.disabled = "disabled";

    var kingdomFactoryInstance;

    App.contracts.KingdomFactory.deployed().then(function(instance) {
      kingdomFactoryInstance = instance;
      kingdomFactoryInstance.haveKingdom().then(function(haveKingdom){
        if(!haveKingdom){
          location.assign("create.html");
        }
        kingdomFactoryInstance.upgradeFortress().then(function(){
          kingdomFactoryInstance.UpgradeFortress().watch(function(err, response){
            alert("Upgraded Fortress!");
            location.assign("armory.html");
          });
        });
      })
    }).catch(function(err) {
      console.log('upgradeFortress:' + err.message);
    });
  },

  upgradeWeapon: function(event) {
    event.preventDefault();

    this.value = "Upgrading...";
    this.disabled = "disabled";

    var kingdomFactoryInstance;

    App.contracts.KingdomFactory.deployed().then(function(instance) {
      kingdomFactoryInstance = instance;
      kingdomFactoryInstance.haveKingdom().then(function(haveKingdom){
        if(!haveKingdom){
          location.assign("create.html");
        }
        kingdomFactoryInstance.upgradeWeapon().then(function(){
          kingdomFactoryInstance.UpgradeWeapon().watch(function(err, response){
            alert("Upgraded Weapon!");
            location.assign("armory.html");
          });
        });
      })
    }).catch(function(err) {
      console.log('upgradeWeapon:' + err.message);
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
    $("#inventory").load("../sections/inventory.html");
    $("#military_effectiveness").load("../sections/military_effectiveness.html");
    $("#personnel").load("../sections/personnel.html");
    $("#buy_armory").load("../sections/buy_armory.html");
};
