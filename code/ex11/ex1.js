var mongodb = require('mongodb')
  , MongoClient = mongodb.MongoClient;

MongoClient.connect("mongodb://localhost:27017/test", function(err, db) {
  if(err) {
    console.log("failed to connect to the database");
  } else {
    console.log("connected to database");
  }

  var collection = db.collection('upserts');
  
  collection.remove(function() {

    collection.insert({_id:1, value:1}, function(err, result) {
      console.log("added document");

      collection.update({_id:1}, {$set: {_id: 1}}, function(err, result) {
        console.log("will fail");
        console.dir(err);

        collection.update({value:2}, {$set: {upserted:true}}, {upsert:true}
          , function(err, result) {
            console.log("upserted document");

            collection.find().toArray(function(err, docs) {
              console.log("documents");
              console.dir(docs);
              db.close();
            });
        });
      });
    });
  });
});