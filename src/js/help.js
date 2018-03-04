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
    //$(document).on('click', '#trainAttackButton', App.trainAttack);
  },

  loadPage: function(kingdoms, account) {

    var kingdomFactoryInstance;

    App.contracts.KingdomFactory.deployed().then(function(instance) {
      kingdomFactoryInstance = instance;
      kingdomFactoryInstance.haveKingdom().then(function(haveKingdom){
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
          });

          kingdomFactoryInstance.canAttack().then(function(result){
            var sidebar_user_stats = $('#sidebar_user_stats');
            if(result[0]){
              sidebar_user_stats.find('.attackCooldown').text("Ready");
            } else {
              sidebar_user_stats.find('.attackCooldown').text(secondsToDays(result[1]));
            }
          });
        }
        loadSections(haveKingdom);        
      });
    }).catch(function(err) {
      console.log('displayBase:' + err.message);
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