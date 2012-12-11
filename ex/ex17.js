var mongodb = require('mongodb')
  , MongoClient = mongodb.MongoClient;

MongoClient.connect("mongodb://localhost:27017/test", function(err, db) {
  if(err) {
    console.log("failed to connect to the database");
  } else {
    console.log("connected to database");    
  }

  var mydocuments = db.collection('mycountingdocuments');
  var documents = [
      {_id: 1000}
    , {_id: 1001}
    , {_id: 1000}
    , {_id: 1002}
  ];

  mydocuments.insert(documents, {continueOnError: true}, function(err, result) {
    if(err) {
      console.log("failed to perform bulk insert due to multiple documents having the same _id field")
    }

    db.close();
  });
});