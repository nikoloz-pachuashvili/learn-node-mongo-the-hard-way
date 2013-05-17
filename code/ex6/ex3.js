var mongodb = require('mongodb')
  , MongoClient = mongodb.MongoClient;

var document = {
  'hello': 'world'
}

MongoClient.connect("mongodb://localhost:27017/test", function(err, db) {
  if(err) {
    console.log("failed to connect to the database");
  } else {
    console.log("connected to database");    
  }

  var collection = db.collection('myttlcollection');
  var fortyeighthours = 60 * 60 * 48;

  collection.ensureIndex(
      {created_on: 1}
    , {expireAfterSeconds: fortyeighthours}, function(err, result) {

      db.close();
  });
});