var request = require('request');

var load10AtATime = function(callback) {
  var counter = 10;  

  for(var i = 0; i < 10; i++) {
    request('http://www.google.com', function (error, response, body) {
      counter = counter - 1;

      if (!error && response.statusCode == 200) {
        console.log("Retrieved the web page");
      }

      if(counter == 0) callback();
    });
  }
}

var loadBatches = function(numberOfBatches, callback) {
  console.log("= Loading batch :: " + numberOfBatches);

  load10AtATime(function() {
    numberOfBatches = numberOfBatches - 1;
    
    if(numberOfBatches == 0) return callback();
    loadBatches(numberOfBatches, callback);
  })
}

loadBatches(10, function() {
  console.log("DONE");  
})