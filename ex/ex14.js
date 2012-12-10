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

  var mydocuments = db.collection('mycountingdocuments');
  var counter = 100;

  for(var i = 0; i < 100; i++) {
    mydocuments.insert({i:i}, function(err, result) {
      counter = counter - 1;

      if(counter == 0) {
        db.close();
      }
    });
  }  
});