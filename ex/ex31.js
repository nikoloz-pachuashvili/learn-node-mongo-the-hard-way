var mongodb = require('mongodb')
  , MongoClient = mongodb.MongoClient;

MongoClient.connect("mongodb://localhost:27017/test", function(err, db) {
  if(err) {
    console.log("failed to connect to the database");
  } else {
    console.log("connected to database");
  }

  var meeting = {
      _id : 1
    , title: "Let's buy a widget"
    , description: "We need to buy the ACME widget and need budget approval"
    , startTime: new Date()
    , endTime: new Date()
  }

  var users = [
      { name: 'April', email: 'april@inc.com'}
    , { name: 'John', email: 'john@inc.com'}
  ]

  var collection = db.collection('meetings');
  
  collection.remove(function() {

    collection.insert(meeting, function(err, result) {
      if(err) {
        console.log("write concern on collection caught duplicate key error");
      }

      collection.update({ _id: meeting._id }
        , {$pushAll: {participants: users}}, function(err, result, full_result) {

          var april = { name: 'April', email: 'april@inc.com'};

          collection.update({_id: meeting._id}
            , {$addToSet: {participants: april}}, function(err, result, full_result) {

            collection.findOne({ _id: meeting._id }, function(err, doc) {

              console.dir(doc);

              db.close();
            });
        });
      });
    });
  });
});