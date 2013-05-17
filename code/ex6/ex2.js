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

  db.createCollection("mycappedcollection", 
    { capped:true
      , size:100000
      , max: 100 }, function(err collection) {
    
    db.close();
  });
});