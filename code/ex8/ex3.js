var mongodb = require('mongodb')
  , MongoClient = mongodb.MongoClient;

MongoClient.connect("mongodb://localhost:27017/test?w=0", function(err, db) {
  if(err) {
    console.log("failed to connect to the database");
  } else {
    console.log("connected to database");    
  }

  var collection = db.collection('my_write_concern_docs');

  collection.insert({_id:1});

  var collectionWithWriteConcernSet = db.collection('my_write_concern_docs', {w:1});

  collectionWithWriteConcernSet.insert({_id:1}, function(err, result) {
    if(err) {
      console.log("write concern on collection caught duplicate key error");
    }

    collection.insert({_id:1}, {j:true}, function(err, result) {
      if(err) {
        console.log("write concern on collection caught duplicate key error");
      }      

      db.close();
    });
  });
});