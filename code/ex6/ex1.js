var mongodb = require('mongodb')
  , MongoClient = mongodb.MongoClient;

MongoClient.connect("mongodb://localhost:27017/test", function(err, db) {
  if(err) {
    console.log("failed to connect to the database");
  } else {
    console.log("connected to database");    
  }

  var myotherdb = db.db('myotherdb');
  var admin = db.admin();
  
  var mydocuments = db.collection('mydocuments');
  
  db.close();
});