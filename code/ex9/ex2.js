var mongodb = require('mongodb')
  , MongoClient = mongodb.MongoClient;

MongoClient.connect("mongodb://localhost:27017/test", function(err, db) {
  if(err) {
    console.log("failed to connect to the database");
  } else {
    console.log("connected to database");    
  }

  var collection = db.collection('my_basic_update_documents');  

  collection.remove(function() {

    collection.insert({_id:2, value:1}, function(err, result) {
      if(err) {
        console.log("write concern on collection caught duplicate key error");      
      }

      collection.update({_id: 2}, {$set: {value: 2}}, function(err, result, full_result) {
        console.log("updated " + result + " number of documents");
        console.dir(full_result);

        collection.findOne({_id: 2}, function(err, doc) {

          console.dir(doc);

          db.close();
        });
      });
    });
  });
});