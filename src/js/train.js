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
    //$(document).on('click', '#trainAttackButton', App.trainAttack);
    //$(document).on('click', '#trainDefenseButton', App.trainDefense);
    $(document).on('click', '#trainSpiesButton', App.trainSpies);
    $(document).on('click', '#trainSentriesButton', App.trainSentries);
    //$(document).on('click', '#reassignAttackButton', App.reassignAttack);
    //$(document).on('click', '#reassignDefenseButton', App.reassignDefense);
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
          personnelTable.find('.spies').text(numberWithCommas(personnel[1]));
          personnelTable.find('.sentries').text(numberWithCommas(personnel[2]));
          var totalFightingForce = 0;
          personnel.forEach(function(x){
            totalFightingForce += x.c[0];
          })
          personnelTable.find('.totalFightingForce').text(numberWithCommas(totalFightingForce));
          personnelTable.find('.personnelCount').text(numberWithCommas(totalFightingForce));
        });

        
      });
    }).catch(function(err) {
      console.log('displayBase:' + err.message);
    });
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
};

function loadSections(haveKingdom){
    $("#header").load("../sections/header.html");
    $("#footer").load("../sections/footer.html");
    if(haveKingdom){
      $("#sidebar").load("../sections/sidebar2.html");
    } else {
      $("#sidebar").load("../sections/sidebar.html");
    }
    $("#personnel").load("../sections/personnel.html");
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