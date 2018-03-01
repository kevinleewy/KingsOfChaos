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
        loadSections(haveKingdom);
        start = GetURLParameter('start');
        if(haveKingdom){
          kingdomFactoryInstance.getMyKingdom().then(function(kingdom){
            var sidebar_user_stats = $('#sidebar_user_stats');
            sidebar_user_stats.find('.gold').text(kingdom[5]);
          });

          if(start == null){
            kingdomFactoryInstance.getMyKingdomId().then(function(id){
              start = id.c[0];
            });
          }
        }
        if(start == null || start >= numOfKingdoms.c[0]){
          start = 0;
        } else {
          start = start - start % 20; //display only 20 per page
        }
        end = Math.min(start + 20, numOfKingdoms);
        var table = $('#battlefieldTable')
        table.find('.totalPlayers').text(numOfKingdoms);
        table.find('.pageNum').text(Math.floor(start/20) + 1);
        table.find('.totalPages').text(Math.floor(numOfKingdoms/20) + 1);
      }).then(function(){
        for (var i = start; i < end; i++) {
          (function(id) {
            kingdomFactoryInstance.getKingdom(id).then(function(kingdom){
              $('#battlefieldTable tr:last').before('\
                <tr class="player" user_id="' + id + '" >\
                    <td align="center" valign="middle" style="padding: 0">\
                        <img class="buddy_type" style="display: none" alt="" src="/images//buddy_icons/small_icon_.gif">\
                        &nbsp;\
                    </td>\
                    <td align="right" style="color: #ffffff;">\
                        <a href="alliances.php?id=">&nbsp;</a>\
                    </td>\
                    <td><a class="player" href="stats.html?id=' + id + '" >' + kingdom[0] + '</a></td>\
                    <td align="right">' + numberWithCommas(kingdom[2].c[0]) + '</td>\
                    <td align="left">' + idToRace(kingdom[1].c[0]) + '</td>\
                    <td align="right" style="padding-right: 20px;">' +  numberWithCommas(kingdom[5].c[0]) + ' Gold</td>\
                    <td align="right" style="padding-right: 20px;">' + numberWithCommas(id) + '</td>\
                </tr>\
              ');                  
            });
          })(i);
        }
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