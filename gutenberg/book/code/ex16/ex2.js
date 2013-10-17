var mongodb = require('mongodb')
  , MongoClient = mongodb.MongoClient;

MongoClient.connect("mongodb://localhost:27017/test", function(err, db) {
  if(err) {
    console.log("failed to connect to the database");
  } else {
    console.log("connected to database");
  }
  var collection = db.collection('salaries');
  collection.find({salary:7000}, {explain:true}).toArray(function(err, docs) {
    console.log("documents");
    console.dir(docs);
    db.close();
  });
});