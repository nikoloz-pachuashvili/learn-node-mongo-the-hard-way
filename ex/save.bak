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

  var mydocuments = db.collection('mydocuments');
  
  mydocuments.insert(document, {w:0});
  
  db.close();
});