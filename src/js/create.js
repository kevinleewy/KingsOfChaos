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

      return App.loadPage();
    });

    return App.bindEvents();
  },

  bindEvents: function() {
    $(document).on('click', '#createButton', App.handleCreate);
  },

  loadPage: function(kingdoms, account) {
    var kingdomFactoryInstance;

    App.contracts.KingdomFactory.deployed().then(function(instance) {
      kingdomFactoryInstance = instance;
      kingdomFactoryInstance.haveKingdom().then(function(haveKingdom){
        if(haveKingdom){
          location.assign("base.html");
        }
        loadSections(haveKingdom);
      })

    }).catch(function(err) {
      console.log('displayUserStats:' + err.message);
    });
  },

  handleCreate: function(event) {
    event.preventDefault();

    var name = $('#name').val();
    var race = $('#race').val();
    if(race < 0 || race > 4){
      console.log('Invalid race ID: ' + race);
    }

    var kingdomFactoryInstance;

    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
      }

      var account = accounts[0];

      App.contracts.KingdomFactory.deployed().then(function(instance) {
        kingdomFactoryInstance = instance;
        // Execute createNewKingdom as a transaction by sending account
        kingdomFactoryInstance.createNewKingdom(name, race, {from: account}).then(function() {
          kingdomFactoryInstance.NewKingdom().watch(function(err, response){
            alert("Created!");
            location.assign("base.html");
          });
        });
      }).catch(function(err) {
        console.log('handleCreate:' + err.message);
      });
    });
  }

};

$(function() {
  $(window).load(function() {
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
    $("#races").load("../sections/races.html");
};