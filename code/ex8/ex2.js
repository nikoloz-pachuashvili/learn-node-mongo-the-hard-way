var mongodb = require('mongodb')
  , MongoClient = mongodb.MongoClient;

var batch = function(collection, documents, callback) {
  var counter = documents.length;

  for(var i = 0; i < documents.length; i++) {
    var writeConcern = i == documents.length ? {w:1} : {w:0};

    collection.insert(documents[i], writeConcern, function(err, doc) {
      counter = counter - 1;

      if(counter == 0) {
        callback(null);
      }
    });
  }
}

var runBatches = function(collection, batchSize, numberOfBatches, documents, callback) {
  if(numberOfBatches == 0) return callback();  
  console.log("number of batches left = " + numberOfBatches);

  batch(collection, documents.splice(0, batchSize), function(err, result) {
    process.nextTick(function() {
      runBatches(collection, batchSize, numberOfBatches - 1, documents, callback);
    });
  });
}

MongoClient.connect("mongodb://localhost:27017/test", function(err, db) {
  if(err) {
    console.log("failed to connect to the database");
  } else {
    console.log("connected to database");    
  }

  var collection = db.collection('mybatchdocs');
  var documents = [];
  var batchSize = 1000;
  var numberOfDocuments = 100005;
  var numberOfBatches = Math.round(numberOfDocuments / batchSize);
  var leftOverDocuments = numberOfDocuments % batchSize;

  for(var i = 0; i < numberOfDocuments; i++) {
    documents.push({i:i});
  }

  runBatches(collection, batchSize, numberOfBatches, documents, function(err, result) {

    if(leftOverDocuments == 0) return db.close();

    batch(collection, documents, function(err, result) {
      db.close();
    });
  });
});