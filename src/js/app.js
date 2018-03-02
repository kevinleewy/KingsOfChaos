App = {
  web3Provider: null,
  contracts: {},
  buttonLink: "pages/create.html",

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
    $.getJSON('KingdomFactory.json', function(data) {
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
    $(document).on('click', '#createButton', App.handleJoin);
  },

  loadPage: function(kingdoms, account) {
    var kingdomFactoryInstance;

    App.contracts.KingdomFactory.deployed().then(function(instance) {
      kingdomFactoryInstance = instance;
      var count = kingdomFactoryInstance.getKingdomCount();
      return count;
    }).then(function(numOfKingdoms) {
      kingdomFactoryInstance.haveKingdom().then(function(haveKingdom){
        loadSections(haveKingdom);
        if(haveKingdom){
          kingdomFactoryInstance.getMyKingdom().then(function(kingdom){
            var sidebar_user_stats = $('#sidebar_user_stats');
            sidebar_user_stats.find('.gold').text(kingdom[5]);
          });
          App.buttonLink = "pages/base.html";
        }
      }).then(function(){
        var kingdomsRow = $('#kingdomsRow');
        kingdomsRow.html("");
        var kingdomTemplate = $('#kingdomTemplate');
        var newKingdomsRow = [];
        for (var i = 0; i < numOfKingdoms; i++) {
          (function(id) {
            kingdomFactoryInstance.getKingdom(id).then(function(kingdom){
              kingdomFactoryInstance.getPersonnel(id).then(function(personnel){
                kingdomTemplate.find('.name').attr("href", "/pages/stats.html?id=" + id);
                kingdomTemplate.find('.name').text(kingdom[0]);
                var race = idToRace(kingdom[1].c[0]);
                var image = 'images/main/' + race.toLowerCase() + '_shield.gif';
                kingdomTemplate.find('img').attr('src', image);
                kingdomTemplate.find('.race').text(race);
                kingdomTemplate.find('.numOfSoldiers').text(personnel[0]);
                kingdomTemplate.find('.siegeTechnology').text(weaponLevelToName(kingdom[2][0].c[0]));
                kingdomTemplate.find('.fortification').text(fortressLevelToName(kingdom[2][1].c[0]));
                kingdomTemplate.find('.gold').text(kingdom[3]);
                kingdomTemplate.find('.commander').attr("href", "/pages/stats.html?id=" + kingdom[4]);
                kingdomTemplate.find('.commander').text(kingdom[5]);
                kingdomsRow.append(kingdomTemplate.html());
              });
            });
          })(i);
        }
      });

    }).catch(function(err) {
      console.log('displayKingdoms:' + err.message);
    });
  },

  handleJoin: function(event) {
    event.preventDefault();

    location.assign(App.buttonLink);
  }

};

$(function() {
  $(window).load(function() {
    App.init();
  });
});

function loadSections(haveKingdom){
    $("#header").load("sections/header.html");
    $("#footer").load("sections/footer.html");
    if(haveKingdom){
      $("#sidebar").load("sections/sidebar2.html");
    } else {
      $("#sidebar").load("sections/sidebar.html");
    }
    $("#races").load("sections/races.html");
    $("#misc").load("sections/misc.html");
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

/*

myC = KingdomFactory.deployed()
myC.then(function(instance){return instance.kingdoms(1)})
myC.then(function(instance){return instance.getOfficers(1)})

myC = KingdomFactory.deployed()
myC.then(function(instance){return instance.attack(1)})
*/