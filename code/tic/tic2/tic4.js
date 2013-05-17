var run = function(callback) {
  gamer(db).init(function(err, result) {
    if(err) return callback(err);

    server.listen(APP_PORT, APP_HOST, function(err) {
      if(err) {
        db.close();
        return callback(err);
      }

      // Print out a nice message to the console
      console.log(
          [ ""
          , "        |       |"
          , "        |       |"
          , "  — — — | — — — | — — — "
          , "        |       |"
          , "        |       |"
          , "  — — — | — — — | — — — "
          , "        |       |"
          , "        |       |"
          , ""
          , "tic-tac-toe server v" + require('./package.json').version
          , "listening on port " + APP_PORT + " and host " + APP_HOST
        ].join('\n'));

      // Return successful start of server
      callback(null);
    });
  });  
}