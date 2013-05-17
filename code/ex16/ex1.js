var mongodb = require('mongodb')
  , MongoClient = mongodb.MongoClient;

MongoClient.connect("mongodb://localhost:27017/test", function(err, db) {
  if(err) {
    console.log("failed to connect to the database");
  } else {
    console.log("connected to database");
  }

  var documents = [
    {
      pid: 1,
      name: 'Steve',
      salary: 10000
    },
    {
      pid: 2,
      name: 'John',
      salary: 12000
    },
    {
      pid: 7,
      name: 'Peter',
      salary: 7000
    },
    {
      pid: 18,
      name: 'Arnold',
      salary: 32000
    },
    {
      pid: 23,
      name: 'Gandalf',
      salary: 34000
    }
  ];

  var collection = db.collection('salaries');
  collection.remove(function(err, result) {
    
    collection.insert(documents, function(err, result) {
      if(err) throw err;
      console.log("added salary documents");

      collection.ensureIndex({salary:1}, function(err, index_name) {
        
        collection.find({salary:7000}).toArray(function(err, docs) {
          console.log("documents");
          console.dir(docs);
          db.close();
        });
      });
    });    
  });
});