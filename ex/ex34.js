var mongodb = require('mongodb')
  , MongoClient = mongodb.MongoClient;

MongoClient.connect("mongodb://localhost:27017/test", function(err, db) {
  if(err) {
    console.log("failed to connect to the database");
  } else {
    console.log("connected to database");
  }

  var collection = db.collection('work');
  
  collection.remove(function() {

    collection.findAndModify(
        {started:false}
      , {priority:-1}
      , {$set: {started:true, startTime:new Date()}}
      , {new:true, upsert:true}, function(err, doc) {
        console.log("added document");
        console.dir(doc);

        collection.find({}).toArray(function(err, docs) {
          console.log("all documents");
          console.dir(docs);

          db.close();
        });
    });
  });
});