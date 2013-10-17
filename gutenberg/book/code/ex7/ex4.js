var mongodb = require('mongodb')
  , MongoClient = mongodb.MongoClient;

MongoClient.connect("mongodb://localhost:27017/test", function(err, db) {
  if(err) {
    console.log("failed to connect to the database");
  } else {
    console.log("connected to database");    
  }

  var mydocuments = db.collection('mycountingdocuments');
  var counter = 100;
  var documents = [];

  for(var i = 0; i < 100; i++) {
    documents.push({i:i});
  }

  mydocuments.insert(documents, function(err, result) {

    db.close();
  });
});