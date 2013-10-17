var http = require('http')
  , mongodb = require('mongodb')
  , MongoClient = mongodb.MongoClient;

var dbInstance = null;

var server = http.createServer(function(req, res) {
  res.end("hello world!");
});

MongoClient.connect("mongodb://localhost:27017/library", function(err, db) {
  if(err) throw err;
  dbInstance = db;
  console.log("connected to mongodb")

  server.listen(9090, function() {
    console.log("listening on ", 9090);
  });  
});
