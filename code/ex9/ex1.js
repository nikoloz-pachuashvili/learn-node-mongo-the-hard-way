var mongodb = require('mongodb')
  , MongoClient = mongodb.MongoClient;

MongoClient.connect("mongodb://localhost:27017/test", function(err, db) {
  if(err) {
    console.log("failed to connect to the database");
  } else {
    console.log("connected to database");    
  }

  var collection = db.collection('my_basic_update_documents');
  
  collection.insert({_id:1, a:1}, function(err, result) {
    if(err) {
      console.log("write concern on collection caught duplicate key error");      
    }

    collection.update({_id:1}, {_id:1, b:1}, function(err, result) {      

      db.close();
    });
  });
});