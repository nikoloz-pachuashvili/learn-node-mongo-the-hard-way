var mongodb = require('mongodb')
  , MongoClient = mongodb.MongoClient;

MongoClient.connect("mongodb://localhost:27017/test", function(err, db) {
  if(err) {
    console.log("failed to connect to the database");
  } else {
    console.log("connected to database");
  }

  var documents = [{
      _id : 1
    , title: "Buy milk"
    , priority: 5
    , started: false
    , done: false
    , startTime: null
    , endTime: null
    }, {
      _id : 2
    , title: "Become a Billionaire"
    , priority: 1
    , started: false
    , done: false
    , startTime: null
    , endTime: null
    }, {
      _id : 3
    , title: "Play DOOM"
    , priority: 1000
    , started: false
    , done: false
    , startTime: null
    , endTime: null
    }
  ]

  var collection = db.collection('work');
  
  collection.remove(function() {

    collection.insert(documents, function(err, result) {
      if(err) {
        console.log("write concern on collection caught duplicate key error");
      }

      collection.findAndModify(
          {started:false}
        , {priority:-1}
        , {$set: {started:true, startTime:new Date()}}
        , {new:true}, function(err, doc) {
          console.log("changed document");
          console.dir(doc);

          collection.find({}).toArray(function(err, docs) {
            console.log("all documents");
            console.dir(docs);

            db.close();
          });
      });
    });
  });
});