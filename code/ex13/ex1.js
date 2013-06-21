var mongodb = require('mongodb')
  , MongoClient = mongodb.MongoClient;

MongoClient.connect("mongodb://localhost:27017/test", function(err, db) {
  if(err) {
    console.log("failed to connect to the database");
  } else {
    console.log("connected to database");
  }

  var documents = [{
        _id: 1
      , user: 1
      , read:false
    }, {
        _id: 2
      , user: 1
      , read:false
    }, {
        _id: 3
      , user: 2
      , read:false
    }
  ];

  var collection = db.collection('upserts');
  
  collection.remove(function() {

    collection.insert(documents, function(err, result) {
      console.log("added document");

      collection.remove({user:1}, function(err, result) {
        console.log("removed documents");

        collection.find().toArray(function(err, docs) {
          console.log("documents");
          console.dir(docs);
          db.close();
        });
      });
    });
  });
});