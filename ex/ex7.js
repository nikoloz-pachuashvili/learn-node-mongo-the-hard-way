var mongodb = require('mongodb')
  , MongoClient = mongodb.MongoClient
  , Server = mongodb.Server;

var mongoclient = new MongoClient(new Server('localhost', 27017));
mongoclient.open(function(err, mongoclient) {
  if(err) {
    console.log("failed to connect to the database");
  } else {
    console.log("connected to database");    
  }

  var test = mongoclient.db('test');
  var test2 = mongoclient.db('test2');

  mongoclient.close();
})