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
    $(document).on('click', '#trainAttackButton', App.trainAttack);
    $(document).on('click', '#trainDefenseButton', App.trainDefense);
    $(document).on('click', '#trainSpiesButton', App.trainSpies);
    $(document).on('click', '#trainSentriesButton', App.trainSentries);
    $(document).on('click', '#reassignAttackButton', App.reassignAttack);
    $(document).on('click', '#reassignDefenseButton', App.reassignDefense);
    $(document).on('click', '#upgradeCovertButton', App.upgradeCovert);
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

        kingdomFactoryInstance.getMyKingdom().then(function(kingdom) {
          var gold = numberWithCommas(kingdom[3].c[0]);
          var sidebar_user_stats = $('#sidebar_user_stats');
          sidebar_user_stats.find('.gold').text(gold);
          
          var upgradeCovertTable = $('#upgradeCovertTable');
          var covertLevel = kingdom[2][2]
          upgradeCovertTable.find('.covertLevel').text(covertLevel);
          if(covertLevel < 15){
            upgradeCovertTable.find('.upgradeCovertButton').attr("value", "62,900 Gold (+60%)");
          } else {
            upgradeCovertTable.find('.upgradeCovertButton').attr("value", "Fully upgraded.");
            upgradeCovertTable.find('.upgradeCovertButton').attr("disabled", "disabled");
          }
        });
        
      });
    }).catch(function(err) {
      console.log('displayBase:' + err.message);
    });
  },

  trainAttack: function(event){
    event.preventDefault();

    var count = parseInt($('#attackQuantity').val());
    if(count > 0){
      this.value = "Training...";
      this.disabled = "disabled";

      var kingdomFactoryInstance;

      App.contracts.KingdomFactory.deployed().then(function(instance) {
        kingdomFactoryInstance = instance;
        kingdomFactoryInstance.trainAttackSpecialists(count).then(function(haveKingdom){
          kingdomFactoryInstance.TrainedAttackSpecialists().watch(function(err, response){
            alert("Trained Attack Specialists!");
            location.assign("train.html");
          });
        })
      }).catch(function(err) {
        console.log('Training Attack Specialists:' + err.message);
      });
    } else {
      alert("Quantity must be greater than 0");
    }   
  },

  trainDefense: function(event){
    event.preventDefault();

    var count = parseInt($('#defenseQuantity').val());
    if(count > 0){
      this.value = "Training...";
      this.disabled = "disabled";

      var kingdomFactoryInstance;

      App.contracts.KingdomFactory.deployed().then(function(instance) {
        kingdomFactoryInstance = instance;
        kingdomFactoryInstance.trainDefenseSpecialists(count).then(function(haveKingdom){
          kingdomFactoryInstance.TrainedDefenseSpecialists().watch(function(err, response){
            alert("Trained Defense Specialists!");
            location.assign("train.html");
          });
        })
      }).catch(function(err) {
        console.log('Training Defense Specialists:' + err.message);
      });
    } else {
      alert("Quantity must be greater than 0");
    }   
  },

  trainSpies: function(event){
    event.preventDefault();

    var count = parseInt($('#spiesQuantity').val());
    if(count > 0){
      this.value = "Training...";
      this.disabled = "disabled";

      var kingdomFactoryInstance;

      App.contracts.KingdomFactory.deployed().then(function(instance) {
        kingdomFactoryInstance = instance;
        kingdomFactoryInstance.trainSpies(count).then(function(haveKingdom){
          kingdomFactoryInstance.TrainedSpies().watch(function(err, response){
            alert("Trained Spies!");
            location.assign("train.html");
          });
        })
      }).catch(function(err) {
        console.log('Training Spies:' + err.message);
      });
    } else {
      alert("Quantity must be greater than 0");
    }   
  },

  trainSentries: function(event){
    event.preventDefault();

    var count = parseInt($('#sentriesQuantity').val());
    if(count > 0){
      this.value = "Training...";
      this.disabled = "disabled";
      var kingdomFactoryInstance;

      App.contracts.KingdomFactory.deployed().then(function(instance) {
        kingdomFactoryInstance = instance;
        kingdomFactoryInstance.trainSentries(count).then(function(haveKingdom){
          kingdomFactoryInstance.TrainedSentries().watch(function(err, response){
            alert("Trained Sentries!");
            location.assign("train.html");
          });
        })
      }).catch(function(err) {
        console.log('Training Spies:' + err.message);
      });
    } else {
      alert("Quantity must be greater than 0");
    }   
  },

  reassignAttack: function(event){
    event.preventDefault();

    var count = parseInt($('#unAttackQuantity').val());
    if(count > 0){
      this.value = "Reassigning...";
      this.disabled = "disabled";
      var kingdomFactoryInstance;

      App.contracts.KingdomFactory.deployed().then(function(instance) {
        kingdomFactoryInstance = instance;
        kingdomFactoryInstance.reassignAttackSpecialists(count).then(function(haveKingdom){
          kingdomFactoryInstance.ReassignedAttackSpecialists().watch(function(err, response){
            alert("Reassigned Attack Specialists!");
            location.assign("train.html");
          });
        })
      }).catch(function(err) {
        console.log('Reassigning Attack Specialists:' + err.message);
      });
    } else {
      alert("Quantity must be greater than 0");
    }   
  },

  reassignDefense: function(event){
    event.preventDefault();

    var count = parseInt($('#unDefenseQuantity').val());
    if(count > 0){
      this.value = "Reassigning...";
      this.disabled = "disabled";
      var kingdomFactoryInstance;

      App.contracts.KingdomFactory.deployed().then(function(instance) {
        kingdomFactoryInstance = instance;
        kingdomFactoryInstance.reassignDefenseSpecialists(count).then(function(haveKingdom){
          kingdomFactoryInstance.ReassignedDefenseSpecialists().watch(function(err, response){
            alert("Reassigned Defense Specialists!");
            location.assign("train.html");
          });
        })
      }).catch(function(err) {
        console.log('Reassigning Defense Specialists:' + err.message);
      });
    } else {
      alert("Quantity must be greater than 0");
    }   
  },

  upgradeCovert: function(event) {
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
        kingdomFactoryInstance.upgradeCovert().then(function(){
          kingdomFactoryInstance.UpgradeCovert().watch(function(err, response){
            alert("Upgraded Covert Skill!");
            location.assign("train.html");
          });
        });
      })
    }).catch(function(err) {
      console.log('upgradeCovert:' + err.message);
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
};