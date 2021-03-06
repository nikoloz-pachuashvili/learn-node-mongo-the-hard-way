var ObjectID = require('mongodb').ObjectID;

module.exports = function(db) {
  var Game = function() {}

  //
  // Create a new game, it contains all the information about the two players, 
  // the empty board, the whole game chat record, who is starting the game and 
  // who is the current player.
  // 
  Game.create_game = function(p1_sid, p1_user_name
    , p1_full_name, p2_sid, p2_user_name, p2_full_name, callback) {
      db.collection('games').insert({
          player1_sid: p1_sid
        , player1_user_name: p1_user_name
        , player1_full_name: p1_full_name
        , player2_sid: p2_sid
        , player2_user_name: p2_user_name
        , player2_full_name: p2_full_name
        , board: [
            [0, 0, 0, 0]
          , [0, 0, 0, 0]
          , [0, 0, 0, 0]
          , [0, 0, 0, 0]
        ]
        , created_on: new Date()
        , starting_player: p1_sid
        , current_player: p1_sid
      }, function(err, result) {
        if(err) return callback(err);
        callback(null, Array.isArray(result) ? result[0] : result);
      })
  }

  //
  // Locate an existing game by it's game id
  //
  Game.find_game = function(game_id, callback) {
    db.collection('games').findOne({_id: new ObjectID(game_id)}, function(err, doc) {
      if(err) return callback(err);
      if(doc == null) 
        return callback(new Error("could not find the game with id " + game_id));
      return callback(null, doc);
    })
  }

  //
  // Attempt to update the board for a specific game and player
  // the update fails if the current players is not the player attempting to 
  // update the board notice that since we are doing multiple sets we are 
  // using the $atomic operation to ensure we don't get any interleaved updates 
  // in between the two sets
  //
  Game.update_board = function(sid, game_id, next_sid, board, callback) {
    db.collection('games').update(
        {_id: new ObjectID(game_id), current_player: sid, $atomic:true}
      , {$set: {board: board, current_player: next_sid}}, function(err, result) {
        if(err) return callback(err);
        if(result == 0) return callback(new Error("It is not your turn"));
        callback(null, null);
      });
  }

  //
  // Set the winner on the board if sid == null it's a draw
  //
  Game.finalize_board = function(sid, game_id, callback) {
    var state = sid == null ? 'draw' : 'win';

    db.collection('games').update(
        {_id: new ObjectID(game_id)}
      , {$set: {final_state: state, winner: sid}}, function(err, result) {
        if(err) return callback(err);
        if(result == 0) 
          return callback(new Error("Failed to finalize the board with a winner or draw"));
        callback(null, null);
      });    
  }  

  // Return Game object class
  return Game;
}