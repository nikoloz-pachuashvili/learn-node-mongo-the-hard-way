var request = require('request');

for(var i = 0; i < 100; i++) {
  request('http://www.google.com', function (error, response, body) {
    if (!error && response.statusCode == 200) {
      console.log("Retrieved the web page");
    }
  });
}

console.log("DONE");