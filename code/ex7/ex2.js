var mongodb = require('mongodb')
  , MongoClient = mongodb.MongoClient;

var document = {
    '_id': 1
  , 'hello': 'world'
}

MongoClient.connect("mongodb://localhost:27017/test", function(err, db) {
  if(err) {
    console.log("failed to connect to the database");
  } else {
    console.log("connected to database");    
  }

  var mydocuments = db.collection('mydocuments');
  
  mydocuments.insert(document, function(err, result) {

    mydocuments.insert(document, function(err, result) {

      if(err) {
        console.log("document with _id already exists");
      }

      db.close();
    });
  });  
});