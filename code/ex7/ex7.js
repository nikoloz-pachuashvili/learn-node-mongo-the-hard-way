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
  var documents = [
      {_id: 1000}
    , {_id: 1001}
    , {_id: 1000}
    , {_id: 1002}
  ];

  mydocuments.insert(documents, {continueOnError: true}, function(err, result) {

    if(err) {
      var ids = [];
      for(var i = 0; i < documents.length; i++) {
        ids.push(documents[i]._id);
      }

      mydocuments.find({_id: {$in: ids}}, {_id: 1}).toArray(function(err, docs) {
        var docHash = {};
        var docsNotFound = [];

        for(var i = 0; i < docs.length; i++) {
          docHash[docs[i]._id] = true;
        }

        for(var i = 0; i < documents.length; i++) {
          if(!docHash[documents[i]._id]) {
            docsNotFound.push(i);
          } else {
            docHash[documents[i]._id] = false;            
          }
        }

        console.dir(docsNotFound);
      });
    }

    db.close();
  });
});