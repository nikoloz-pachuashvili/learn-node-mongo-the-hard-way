var async = require('async')
  , request = require('request');

var numberOfBatches = 10;

async.whilst(
    function() { return numberOfBatches > 0; }
  , function(callback) {
      console.log("= Loading batch :: " + numberOfBatches);
      numberOfBatches = numberOfBatches - 1;

      var counter = 10;

      for(var i = 0; i < 10; i++) {
        request('http://www.google.com', function (error, response, body) {
          if (!error && response.statusCode == 200) {
            console.log("Retrieved the web page");
          }

          counter = counter - 1;
          if(counter == 0) callback();
        });        
      }
    }
  , function(err) {
    console.log("DONE");
  }
)
