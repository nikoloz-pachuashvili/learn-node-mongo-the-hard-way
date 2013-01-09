Tic-Tac-Toe: Exercise 3
=======================

We are getting down to the awesome part of the application as we are going to start implementing the process of selecting a player to play against and playing the game itself. This is where the code gets really interesting. 

The first step is to display a list of available gamers that we can invite to play and we need to handle the invite and accept/reject game mechanics for the game. 

In the final step of this exercise we are going to actually create the game board and handle the playing of the game.

The Glue Of It All
------------------

The first thing we need to do is to be able to retrieve a list of all the available gamers that we can play against. To do this we are going to create a new set of API calls for the gamer as well as extend our current ``Gamer`` model class. Let's bring up the file ``lib/models/gamer.js`` with an editor and let's add the missing ``API`` calls.

.. literalinclude:: ex/tic16.js
    :language: javascript
    :linenos:

The first method ``Gamer.findAllGamersBySids`` let's us locate all the gamers associated with a list of ``SocketIO`` session ids. This is used to get the list of currently active users. The second method ``Gamer.updateGamersUpdatedDateBySids`` is used to update the last active time on a set of users identified by their session ids.

The Game Model
--------------

We are going to introduce a concept of a ``Game`` than needs to have a couple of different functionalities.

=====================   ================================
Function                Description
=====================   ================================
create_gamer            Create a brand new game for two players
find_name               Locate an existing game by the game id
update_board            Update an existing board with the board state
=====================   ================================

Let's create the files we need.

.. code-block:: console
    :linenos:

    touch lib/handlers/gamer_handler.js
    touch lib/models/game.js

Open the ``lib/models/game.js`` file and lets enter the code for the tree methods we need for the game ``Game.create_gamer``, ``Game.find_name`` and ``Game.update_board``.

.. literalinclude:: ex/tic17.js
    :language: javascript
    :linenos:

Let's have a look at the ``Game.create_game`` function it takes quite a bit of parameters. 

=====================   ================================
Parameter               Description
=====================   ================================
p1_sid                  The session id for player 1
p1_user_name            The user name of player 1
p1_full_name            The full name of player 1
p2_sid                  The session id for player 2
p2_user_name            The user name of player 2
p2_full_name            The full name of player 2
=====================   ================================

The method creates a new game document representing that stores the state of a game between two players.

.. code-block:: javascript
    :linenos:

    {
        player1_sid: "some session id 1"
      , player1_user_name: "player1"
      , player1_full_name: "Joe Player 1"
      , player2_sid: "some session id 2"
      , player2_user_name: "player2"
      , player2_full_name: "Joe Player 2"
      , board: [
          [0, 0, 0, 0]
        , [0, 0, 0, 0]
        , [0, 0, 0, 0]
        , [0, 0, 0, 0]
      ]
      , created_on: new Date()
      , starting_player: "some session id 1"
      , current_player: "some session id 1"
    }    

Let's have a look at the fields in the document. Obviously the first 6 fields are just the passed in values for the method. The next field is the ``board`` field that contains A ``2D`` representation of the ``Tic-Tac-Toe`` where we will store the moves of the game. The ``created_on`` contains the date of when the game was created. The ``starting_player`` is the session id of the player that gets the first move and the ``current_player`` is the player who's turn it is and is used to make sure only the player who has the current turn can update the state of the board.

Let's checkout the ``Game.find_game`` method next. Not much to say here. Each ``Game`` document has a ``_id`` field assigned to it in the database and this method lets us locate a board using that ``ObjectID``.

Finally lets look at the ``Game.update_board`` where we update a specific game's board.

.. code-block:: javascript
    :linenos:

    Game.update_board = function(sid, game_id, next_sid, board, callback) {
      db.collection('games').update(
          {_id: new ObjectID(game_id), current_player: sid, $atomic:true}
        , {$set: {board: board, current_player: next_sid}}, function(err, result) {
          if(err) return callback(err);
          if(result == 0) return callback(new Error("It is not your turn"));
          callback(null, null);
        });
    }

The parameters passed in are used to locate a board where the ``game_id`` and ``current_player`` match which will only happen when the caller attempting to update the board is the current player allowed to make a move. If this is not a case the number of documents that are updated will be 0 and the method returns an error explaining that it's not that users current turn. If it is the callers turn it updates the ``board`` field of the document with the new document state and sets the ``current_player`` to the session id of the other player allowing the other player to perform his move.

Sweet we can now create, locate and update a game correctly and also ensure that a board is never updated by a user who's not currently allowed to.

The Game Handler
----------------

One of the things we need to ensure is that we can't call functions unless we are correctly logged in as a gamer. The other thing we need is to locate a given ``SocketIO`` socket by a given session id. 

For the first part we will implement a method called ``is_authenticated`` and for the second part a method called ``locate_connection_with_session``. Bring up the file ``lib/models/shared.js`` and add the methods as shown below.

.. literalinclude:: ex/tic18.js
    :language: javascript
    :linenos:

Time to implement the logic we need for the game on the backend. Open up the ``lib/handlers/gamer_handler.js`` file and get typing.

.. literalinclude:: ex/tic19.js
    :language: javascript
    :linenos:

The find_all_available_gamers Handler
-------------------------------------

You'll notice the file is fairly big so we will go through each method in turn. Let's start with the ``find_all_available_gamers`` method.

.. code-block:: javascript
    :linenos:

    /**
     * Locate all the available gamers by their session ids. We do this by introspecting
     * all available connections for SocketIO. However note that if we wanted to use
     * the cluster functionality in Node.JS we would probably have to rewrite this as
     * a lot of the users might be living in different processes and by default SocketIO
     * is only single process aware.
     */
    var find_all_available_gamers = function(io, socket, session_store, db) {
      // Easier to keep track of where we emitting messages
      var calling_method_name = "find_all_available_gamers";

      // Function we return that accepts the data from SocketIO
      return function(data) {
        // Ensure the user is logged on and emit an error to the calling function if it's not the case
        if(!is_authenticated(socket, session_store)) return emit_error(calling_method_name, "User not authenticated", socket);
        
        // Locate all active socket connections
        var clients = io.sockets.clients();
        var sids = [];

        // Find all the users session ids excluding the calling functions
        // this makes up all current active gamers
        for(var i = 0; i < clients.length; i++) {
          if(clients[i].handshake.sessionID != socket.handshake.sessionID) {
            sids.push(clients[i].handshake.sessionID);
          }
        }

        // Locate all the gamers by their session ids
        gamer(db).findAllGamersBySids(sids, function(err, gamers) {
          // If there is an error during the query return it to the calling function
          if(err) return emit_error(calling_method_name, err.message, socket);    

          // Update All the gamers last active time
          gamer(db).updateGamersUpdatedDateBySids(sids, function(err, result) {
            // If there is an error during the update return it to the calling function
            if(err) return emit_error(calling_method_name, err.message, socket);    

            // Emit the list of gamers to the calling function on the client
            emit_message(calling_method_name, {
                ok: true
              , result: gamers
            }, socket);    
          });
        });    
      } 
    }

The very start of the method performs an ``is_authenticated`` verifying that the socket passed in is an authenticated session. If it's not valid we return an error notifying the user that they are not authenticated to call this method. If the caller is authenticated we get all active ``SocketIO`` clients and get a list of all session ids for available players. Once we have that we retrieve all the ``Gamer`` documents based on the list of session ids, and finally update the last active time stamp for those players before returning the list of players to the caller. In short this method retrieves all the gamers that are currently active.

The invite_gamer Handler
------------------------

The next method concerns the act of inviting another player to play a game. Let's have a look at the code.

.. code-block:: javascript
    :linenos:

    /**
     * Invite a gamer to play a game
     */
    var invite_gamer = function(io, socket, session_store, db) {
      // Easier to keep track of where we emitting messages
      var calling_method_name = "invite_gamer";
      var event_name          = "game_invite";

      // Function we return that accepts the data from SocketIO
      return function(data) {
        // Ensure the user is logged on and emit an error to the calling function if it's not the case
        if(!is_authenticated(socket, session_store)) return emit_error(calling_method_name, "User not authenticated", socket);

        // Locate the destination connection
        var connection = locate_connection_with_session(io, data.sid);

        // If there is no connection it means the other player went away, send an error message
        // to the calling function on the client
        if(connection == null) return emit_error(calling_method_name, "Invited user is no longer available", socket);

        // Grab our session id
        var our_sid = socket.handshake.sessionID;

        // Locate our gamer object using our session id
        gamer(db).findGamerBySid(our_sid, function(err, gamer_doc) {
          // If there is an error during the query return it to the calling function
          if(err) return emit_error(calling_method_name, err.message, socket);    
          
          // Invite the other player to play a game with the
          // calling player, we send the calling players session id and his gamer information
          emit_message(event_name, {
              ok: true
            , result: {
                sid: our_sid
              , gamer: gamer_doc          
            }
          }, connection);    
        });
      }
    }

So just as ``find_all_available_gamers`` this method can only be called if the caller is authenticated correctly. Notice how are next use the ``locate_connection_with_session`` method. Since we are inviting another user we only have their session id so we use this function to locate their ``SocketIO`` socket so we can communicate with them. If no connection is found we notify the caller about missing player, otherwise locate the ``Gamer`` instance for the player we wish to invite to play a game and send them a ``game_invite`` so they get notified about the invitation. The ``game_invite`` message includes the session id of the gamer making the invitation and the ``Gamer`` document with their information.

The decline_game Handler
------------------------

The next method covers the case where the invited gamer decides to decline the invitation to play the game. Let's have a look at the code for ``decline_game`` method.

.. code-block:: javascript
    :linenos:

    /**
     * Handles the users decision to decline an invitation to a game
     */
    var decline_game = function(io, socket, session_store, db) {
      // Easier to keep track of where we emitting messages
      var calling_method_name = "decline_game";
      var event_name          = "invite_gamer";

      // Function we return that accepts the data from SocketIO
      return function(data) {
        // Ensure the user is logged on and emit an error to the calling function if it's not the case
        if(!is_authenticated(socket, session_store)) return emit_error(calling_method_name, "User not authenticated", socket);

        // Grab our session id
        var our_sid = socket.handshake.sessionID;
        // Locate the destination connection
        var connection = locate_connection_with_session(io, data.sid);

        // If there is no connection it means the other player went away, send an error message
        // to the calling function on the client
        if(connection == null) return emit_error(calling_method_name, "User is no longer available", socket);

        // Send an error to the player who sent the invite, outlining the decline of the offer
        // to play a game
        emit_error(invite_gamer, "User declined game", connection);
      }
    }

The player that received the game invitation decides to decline a game invitation. Since the invitation contains the inviting users session id we can locate the connection associated with this session id and if it's present issue the decline as an error to that users ``SocketIO`` socket. The reason takes us back to the previous exercise. Remember how an ``API`` method in the frontend registers a callback with an event waiting for a return message from ``SocketIO`` with that particular event. In the ``invite_gamer`` handler we did not actually issue a message with the event ``invite_gamer``. This left the calling method on the frontend waiting for a message with the ``invite_gamer`` event. We now notify the original inviter that the game invitation was declined.

The accept_game Handler
-----------------------

The last method that is part of the invite game cycle is the ``accept_game`` method. Let's look at the code.


.. code-block:: javascript
    :linenos:

    /**
     * Handles the users decision to accept an invitation to play a game
     */
    var accept_game = function(io, socket, session_store, db) {
      // Easier to keep track of where we emitting messages
      var calling_method_name = "accept_game";
      var event_name          = "invite_gamer";

      // Function we return that accepts the data from SocketIO
      return function(data) {
        // Ensure the user is logged on and emit an error to the calling function if it's not the case
        if(!is_authenticated(socket, session_store)) return emit_error(calling_method_name, "User not authenticated", socket);
        // Our session id
        var our_sid = socket.handshake.sessionID;
        // Locate the destination connection
        var connection = locate_connection_with_session(io, data.sid);

        // If there is no connection it means the other player went away, send an error message
        // to the calling function on the client
        if(connection == null) return emit_error(calling_method_name, "User is no longer available", socket);    

        // Locate both the calling player and the destination player by their session ids
        gamer(db).findAllGamersBySids([our_sid, data.sid], function(err, players) {
          // If we have an error notify both the inviter and the invited player about an error
          if(err || players.length != 2) {
            emit_error(event_name, "Failed to locate players for game acceptance", connection);
            return emit_error(calling_method_name, "Failed to locate players for game acceptance", socket);
          }

          // Grab player 1 and player 2 from the results
          var p1 = players[0];
          var p2 = players[1];
          
          // Create a new game with player 1 and player 2
          game(db).create_game(p1.sid, p1.user_name, p1.full_name, p2.sid, p2.user_name, p2.full_name, function(err, game_doc) {
            // If we have an error notify both the inviter and the invited player about an error
            if(err) {
              emit_error(event_name, "Failed to create a new game", connection);
              return emit_error(calling_method_name, "Failed to create a new game", socket);
            }

            // We have a new game, notify both players about the new game information
            emit_message(event_name, { ok: true, result: game_doc }, connection);
            emit_message(calling_method_name, { ok: true, result: game_doc }, socket);
          });
        });
      }
    }

Right the ``accept_game`` method is slightly more complicated than the previous ``reject_game`` method but take heart it's not as bad as it looks. Let's start. First we check if the other player is still available and if he is we locate both of the players ``Gamer`` information by using the ``Gamer.findAllGamersBySids`` method. If we don't get back two documents we return an error to both players telling them we could not find the two players (the emphasis is we notify both of the players at the same time emitting an error on each players socket). Given we get two ``Gamer`` object we create a new ``Game`` for the two players and if there is no error during the creation of the game we notify both players (the calling player and the other player that originally invited this player) about the successful acceptance of the game invitation.

That's the whole game loop, lets look at the method that handles the actual game logic.

The place_marker Handler
------------------------

The ``place_marker`` method handles the actual game play between two players. It checks if the game has been decided or been a draw and also updates the board with the players moves. Let's have a look at the code.

.. code-block:: javascript
    :linenos:

    /**
     * Handles the users decision to accept an invitation to play a game
     */
    var place_marker = function(io, socket, session_store, db) {
      // Easier to keep track of where we emitting messages
      var calling_method_name      = "place_marker";
      var event_name_move          = "game_move";
      var event_name_game_over     = "game_over";

      // Function we return that accepts the data from SocketIO
      return function(data) {
        // Ensure the user is logged on and emit an error to the calling function if it's not the case
        if(!is_authenticated(socket, session_store)) return emit_error(calling_method_name, "User not authenticated", socket);
        // Grab our session id
        var our_sid = socket.handshake.sessionID;

        // Locate the game we want to place a marker on
        game(db).find_game(data.game_id, function(err, game_doc) {
          // If there is an error during the query return it to the calling function
          if(err) return emit_error(calling_method_name, "Could not find the game", socket);

          // Let's get the current board in play
          var board = game_doc.board;
          // Get the marker for the calling player (if we are the starting player we are X)
          var marker = game_doc.starting_player == our_sid ? "x" : "o";
          
          // Locate other players session id
          var other_player_sid = game_doc.player1_sid == our_sid ? game_doc.player2_sid : game_doc.player1_sid;

          // If we are trying to set a cell that's already set emit an error to the calling function
          if(board[data.y][data.x] == "x" || board[data.y][data.x] == "o") 
            return emit_error(calling_method_name, "Cell already selected", socket);;

          // Mark the cell with our marker
          board[data.y][data.x] = marker;

          // Attempt to update the board
          game(db).update_board(our_sid, data.game_id, other_player_sid, board, function(err, result) {
            // If we have an error it was not our turn
            if(err) return emit_error(calling_method_name, "Not your turn", socket);

            // Locate the destination connection
            var connection = locate_connection_with_session(io, other_player_sid);
      
            // If there is no connection it means the other player went away, send an error message
            // to the calling function on the client
            if(connection == null) return emit_error(calling_method_name, "User is no longer available", socket);

            // Emit valid move message to caller and the other player
            // this notifies the clients that they can draw the marker on the board
            emit_message(calling_method_name, { ok: true
              , result: {y: data.y, x:data.x, marker: marker} }
              , socket);        
            emit_message(event_name_move, { ok: true
              , result: {y: data.y, x:data.x, marker: marker} }
              , connection);

            // If there was no winner this turn
            if(is_game_over(board, data.y, data.x, marker) == false) {
              // If there are still fields left on the board, let's keep playing
              if(!is_game_draw(board)) return;
              
              // If there are no open spots left on the board the game
              // is a draw
              emit_message(event_name_game_over, { ok: true, result: {draw:true} }, socket);        
              return emit_message(event_name_game_over, { ok: true, result: {draw:true} }, connection);          
            }

            // There was a winner and it was the last user to place a marker (the calling client)
            // signal both players who won the game
            emit_message(event_name_game_over, { ok: true, result: {winner: our_sid} }, socket);        
            emit_message(event_name_game_over, { ok: true, result: {winner: our_sid} }, connection);
          })
        });
      }
    }

The first thing we attempt is to locate the game by the ``game_id`` passed in over the ``SocketIO`` connection. If we locate a game we grab the game board and assign the calling player a marker. If the calling player is the same as the ``starting_player`` off the game we get the marker ``x`` otherwise we get the marker ``o``. We then establish the other players session id which is session is that did not call the ``player_marker`` method.

It's then time to verify that the co-ordinates passed to the ``player_marker`` function are two an empty board position. If it's not be return an error to the caller informing them that the cell is already selected. If we have no error we place the marker on the board and attempt to update the ``Game`` with the new ``board``. As we saw earlier this will only succeed if it's the calling players turn. Once we are finished it's time to inform both of the players about the new state of the board by emitting the object.


.. code-block:: javascript
    :linenos:

    {   ok: true
      , result: {
            y: data.y
          , x:data.x
          , marker: marker
        } 
    }

to both the calling player and the other participating player. After we have emitted the new board state to the frontend so they can render the board we try to determine if the game was won by the calling player. This is done using the method ``is_game_over``. Let's have a look at the logic in this method.

.. code-block:: javascript
    :linenos:

  /**
   * Checks from a given marker position if it's a winner
   * on the horizontal, vertical or diagonal
   *
   * [0, 0, 0] [0, 1, 0] [1, 0, 0] [0, 0, 1]
   * [1, 1, 1] [0, 1, 0] [0, 1, 0] [0, 1, 0]
   * [0, 0, 0] [0, 1, 0] [0, 0, 1] [1, 0, 0]
   */
  var is_game_over = function(board, y, x, marker) {
    // Check the x and y for the following ranges
    var found_vertical = true;
    var found_horizontal = true;
    var found_diagonal = true;

    // y and x = 0 to x = n
    for(var i = 0; i < board[0].length; i++) {
      if(board[y][i] != marker) {
        found_horizontal = false;
        break;
      }
    }
    // Found a winning position
    if(found_horizontal) return true;

    // x and y = 0 to y = n
    for(var i = 0; i < board.length; i++) {
      if(board[i][x] != marker) {
        found_vertical = false;
        break;
      }
    }

    // Found a winning position
    if(found_vertical) return true;

    // 0, 0 to n, n along the diagonal
    for(var i = 0, j = 0; i < board[0].length; i++) {
      if(board[j++][i] != marker) {
        found_diagonal = false;
        break;
      }
    }

    // Found a winning position
    if(found_diagonal) return true;
    // Reset found diagonal
    found_diagonal = true;

    // n, 0 to 0, n along the diagonal
    for(var i = board[0].length - 1, j = 0; i > 0 ; i--) {
      if(board[j++][i] != marker) {
        found_diagonal = false;
        break;
      }
    }

    // Return result of looking in the diagonal
    return found_diagonal;
  }

This method checks for the four possible conditions of winning, a ``diagonal``, ``horizontal`` or ``vertical`` win. There are probably some shorter versions of the code but this is left as an exercise to you the reader if you think it's important. If you expect your Tic-Tac-Toe game boards to be very big it's suboptimal.

If we determine that the board is not won by the placement of the marker we check if the board is a draw, meaning all positions in the board are marked. This code is very simple and is in the ``is_game_draw`` method.

.. code-block:: javascript
    :linenos:

    /**
     * Checks if all the spaces in the board have been used
     */
    var is_game_draw = function(board) {
      for(var i = 0; i < board.length; i++) {
        for(var j = 0; j < board[i].length; j++) {
          if(board[i][j] == 0) {
            return false;
          }
        }
      }

      return true;
    }

Simply we just check if all of the fields are marked. If they are it's a draw. A single empty field means we are not in a draw position yet and the game can continue. If we have a draw we signal the players that the game ended in a draw sending them the following message.

.. code-block:: javascript
    :linenos:

    { 
        ok: true
      , result: {draw:true} 
    }

If the board was won be signal the players who won the game by sending them a message with the callers session id.

.. code-block:: javascript
    :linenos:

    { 
        ok: true
      , result: {
          winner: our_sid
        } 
    }

That covers the backend api's let's make sure we wire up the handlers correctly as the last thing before we move up to the frontend. Open the file ``app.js`` and add the missing handlers.

.. literalinclude:: ex/tic20.js
    :language: javascript
    :linenos:

That's that the backend is all wired up and it's time to turn our attention to the frontend of the game.

The Front End
-------------
