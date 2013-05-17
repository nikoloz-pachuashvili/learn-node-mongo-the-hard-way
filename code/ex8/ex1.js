var mongodb = require('mongodb')
  , MongoClient = mongodb.MongoClient;

MongoClient.connect("mongodb://localhost:27017/test", function(err, db) {
  if(err) {
    console.log("failed to connect to the database");
  } else {
    console.log("connected to database");    
  }

  var mydocuments = db.collection('playing_with_write_concerns');
  var start = new Date().getTime();

  mydocuments.insert({_id:1}, {w: 0}, function(err, result) {
    console.log("time w:0 ~ " + (new Date().getTime() - start))

    mydocuments.insert({_id:1}, {w: 0}, function(err, result) {      
      if(err) {
        console.log("Duplicate document")
      }

      mydocuments.insert({_id:1}, {w: 1}, function(err, result) {      
        if(err) {
          console.log("Duplicate document")
        }

        start = new Date().getTime();      

        mydocuments.insert({_id:2}, {w: 1}, function(err, result) {      
          console.log("time w:1 ~ " + (new Date().getTime() - start))

          start = new Date().getTime();      

          mydocuments.insert({_id:3}, {j:true}, function(err, result) {      
            console.log("time j:true ~ " + (new Date().getTime() - start))

            mydocuments.insert({_id:3}, {j:true}, function(err, result) {      
              if(err) {
                console.log("Duplicate document")
              }

              start = new Date().getTime();      

              mydocuments.insert({_id:4}, {fsync:true}, function(err, result) {      
                console.log("time fsync:true ~ " + (new Date().getTime() - start))

                mydocuments.insert({_id:4}, {fsync:true}, function(err, result) {      
                  if(err) {
                    console.log("Duplicate document")
                  }

                  db.close();
                });
              });
            });
          });
        });
      });
    });
  });
});