{% import "macros/ork.jinja" as ork with context %}
Tic-Tac-Toe: Exercise 3
=======================

In this exercise we are going to start implementing the process of selecting a player to play against, and playing the game itself. This is where the code gets really interesting. The first step is to display a list of available gamers that we can invite to a game. Next for the invitation to a game we need to handle the invite and accept/reject game mechanics for the game.

The final functionality we are going to implement in this exercise is to actually create the game board and handle the playing of the game.

Where Is The Code
-----------------

The code for this exercise is located at

https://github.com/christkv/tic-tac-toe-steps/tree/step2

The Glue Of It All
------------------

The first thing we need to do is to be able to retrieve a list of all the available gamers. To do this we are going to create a new set of API calls for the gamer as well as extend our current ``Gamer`` model class with some more methods. Let's start with the ``Gamer`` model. Bring up the file ``lib/models/gamer.js`` with an editor and let's add the missing ``API`` calls.

{{ ork.code('code/tic/tic3/tic1.js|pyg') }}

The first method ``Gamer.findAllGamersBySids`` lets us locate all the gamers associated with a list of ``SocketIO`` session ids. This method is used to get the list of all currently active users. The second method ``Gamer.updateGamersUpdatedDateBySids`` is used to update the last active time on a set of users identified by their session ids (remember that the ``gamers`` collection is a ``TTL`` collection that times out active gamers after 1 hour).

The Game Model
--------------

We are going to introduce a concept of a ``Game``. A ``Game`` keeps track of a specific game between two players in the application. We need to implement a set of functions to handle the transitions of the game over time.

=====================   ================================
Function                Description
=====================   ================================
create_gamer            Create a brand new game for two players
find_name               Locate an existing game by the game id
update_board            Update an existing board with the board state
finalize_board          Sets the final state of the board (won/draw)
=====================   ================================

Let's create the files we need.

.. code-block:: console

    touch lib/handlers/gamer_handler.js
    touch lib/models/game.js

Open the ``lib/models/game.js`` file and lets enter the code for the methods we need for the application ``Game.create_gamer``, ``Game.find_name``, ``Game.update_board`` and ``Game.finalize_board``.

{{ ork.code('code/tic/tic3/tic2.js|pyg') }}

Let's start off with the ``Game.create_game`` function. As we can see it takes quite a bit of parameters. 

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

The ``Game.create_game`` method creates a new game document representing the starting state of a game between two players.

.. code-block:: javascript

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

The first six values in the document (``player1_sid``, ``player1_user_name``, ``player1_full_name``, ``player2_sid``, ``player2_user_name`` and ``player2_full_name``) are the ones passed to the function and define who the two players are. The next field down is the ``board`` field that contains A ``2D`` representation of the ``Tic-Tac-Toe`` board where we will store the state of the game. 

The ``created_on`` field contains the date of when the game was created. The ``starting_player`` field is the session id of the player that gets the first move and the ``current_player`` field is the session id of player who has the next move. This field is used to make sure only the player who has the next move can update the state of the board.

Next, let's look at the ``Game.find_game`` method. Not much to say here. Each ``Game`` document has a ``_id`` field containing an ``ObjectID`` assigned to it by ``MongoDB`` and this method lets us locate a board using that ``ObjectID``.

The ``Game.update_board`` method handles the updating of a game between two players.

.. code-block:: javascript

    Game.update_board = function(sid, game_id, next_sid, board, callback) {
      db.collection('games').update(
          {_id: new ObjectID(game_id), current_player: sid, $atomic:true}
        , {$set: {board: board, current_player: next_sid}}, function(err, result) {
          if(err) return callback(err);
          if(result == 0) return callback(new Error("It is not your turn"));
          callback(null, null);
        });
    }

The parameters passed passed into ``Game.update_board`` are used to locate a board where the ``game_id`` and ``current_player`` match. This will only happen when the caller attempting to update the board is the current player allowed to make a move. If it's not the current player the number of documents that were updated will be 0 and the method returns an error explaining that it's not that users turn to place a marker on the board. 

If it is the callers turn to place a marker the function updates the ``board`` field of the document with the new document state and sets the ``current_player`` to the session id of the other player allowing the other player to play his turn next.

Finally let's look at the ``Game.finalize_board`` where we set the final state of a game after the game is done.

.. code-block:: javascript

    //
    // Set the winner on the board if sid == null it's a draw
    //
    Game.finalize_board = function(sid, game_id, callback) {
      var state = sid == null ? 'draw' : 'win';

      db.collection('games').update(
          {_id: new ObjectID(game_id)}
        , {$set: {final_state: state, winner: sid}}, function(err, result) {
          if(err) return callback(err);
          if(result == 0) return callback(new Error("Failed to finalize the board with a winner or draw"));
          callback(null, null);
        });    
    }

If the session id passed in is a ``null`` value it's a draw and the ``final_state`` field is set to ``draw`` and the winner field to ``null``. Otherwise the ``final_state`` field is set to ``win`` and the ``winner field`` to the winners session id.

We can now create, locate and update as well as finalize a game correctly and also ensure that a board is never updated by a user who's not currently allowed to.

The Game Handler
----------------

Some of the things we need to ensure is that we should not be able to call functions unless we are correctly logged in as a gamer. We also need to have a way to locate a given ``SocketIO`` socket given only another users session id.

For the first part we will implement a method called ``is_authenticated`` and for the second part a method called ``locate_connection_with_session``. Bring up the file ``lib/models/shared.js`` and add the methods as shown below.

{{ ork.code('code/tic/tic3/tic3.js|pyg') }}

Alright we have the plumbing we need. It's time to implement the logic we need for the game on the backend. Let's open up the ``lib/handlers/gamer_handler.js`` file and get typing.

{{ ork.code('code/tic/tic3/tic4.js|pyg') }}

The find_all_available_gamers Handler
-------------------------------------

You might have noticed that the file is fairly big so we will go through each method in turn to make it more manageable. Let's start with the ``find_all_available_gamers`` method. This method retrieves a list of all ``Gamer`` documents for gamers who are currently active (as in connected to the server using ``SocketIO``)

.. code-block:: javascript

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

The very start of the method performs an ``is_authenticated`` verifying that the socket passed in is an authenticated session. If it's not valid we return an error notifying the user that they are not authenticated and unable to call this method. If the caller is authenticated we get all active ``SocketIO`` clients and get a list of all session ids for active players. Once we have the list of active players we retrieve all the ``Gamer`` documents associated with those session ids, and finally update the last active time stamp for those players before returning the list to the caller.

The invite_gamer Handler
------------------------

The next method concerns the act of inviting another player to play a game. Let's have a look at the code.

.. code-block:: javascript

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

So just as in the ``find_all_available_gamers`` method this method can only be called if the caller is authenticated correctly. Notice how we are calling the ``locate_connection_with_session`` method. We only have the session id of the player we wish to invite to a game, so we use this function to locate their ``SocketIO`` socket allowing us to communicate with them. 

If no connection is found we notify the caller about the missing player, otherwise we locate the ``Gamer`` instance for the player and send them a ``game_invite`` message so they get notified about the invitation. The ``game_invite`` message includes the session id of the gamer making the invitation and the ``Gamer`` document of the inviting player allowing the invited player to know who sent the invite.

The decline_game Handler
------------------------

The next method covers the case where the invited gamer decides to decline the invitation to play a game. Let's take a look at the code for the ``decline_game`` method.

.. code-block:: javascript

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

The premise for this method is that the player that received the game invitation decides to decline the invitation. Since the invitation contains the inviting users session id we can locate the connection associated with this session id and if it's present, issue the decline as an error to that users ``SocketIO`` socket. 

Remember how an ``API`` method in the frontend registers a callback with an event waiting for a return message from ``SocketIO`` containing that event. In the ``invite_gamer`` handler we did not actually issue a message with the event ``invite_gamer``. This left the calling method on the frontend waiting for a message with the ``invite_gamer`` event. We now notify the original inviter that the game invitation was declined. This usage of events lets us decouple the server processing from the frontend as we only need to notify the frontend by sending events when we are done. This let's us orchestrate interactions between multiple browsers.

The accept_game Handler
-----------------------

The last method that is part of the invite game cycle is the ``accept_game`` method. This method lets a player accept an invitation to play a game. Let's take a look at the code.

.. code-block:: javascript

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

The ``accept_game`` method is slightly more complicated than the previous ``reject_game`` method but take heart it's not as bad as it looks. 

First we check if the other player is still available and if he is, we locate both of the player's ``Gamer`` information by using the ``Gamer.findAllGamersBySids`` method. If we don't get back two documents we return an error to both players telling them we could not find the two players (the emphasis is we notify both of the players at the same time emitting an error on each players socket). 

If we do find two ``Gamer`` object we create a new ``Game`` for the two players. If there is no error during the creation of the game we notify both players (the calling player and the other player that originally sent the invitation) about the successful acceptance of the game invitation.

That's the whole invite and accept/decline and invitation part of the application. Next up is the actual game play. This contains changes both for the backend and the frontend of our application.

The place_marker Handler
------------------------

The ``place_marker`` method handles the actual game play between two players. It checks if the game has been won by one of the players or if it ended in a draw. It also updates the board to reflect the last move. Let's have a look at the code.

.. code-block:: javascript

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

              // Set the winner
              game(db).finalize_board(null, data.game_id, function(err, result) {
                // If we have an error it was not our turn
                if(err) return emit_error(calling_method_name, "Failed to set winner on table", socket);
                
                // If there are no open spots left on the board the game
                // is a draw
                emit_message(event_name_game_over, { ok: true, result: {draw:true} }, socket);        
                return emit_message(event_name_game_over, { ok: true, result: {draw:true} }, connection);          
              });
            }

            // Set the winner
            game(db).finalize_board(our_sid, data.game_id, function(err, result) {
              // If we have an error it was not our turn
              if(err) return emit_error(calling_method_name, "Failed to set winner on table", socket);

              // There was a winner and it was the last user to place a marker (the calling client)
              // signal both players who won the game
              emit_message(event_name_game_over, { ok: true, result: {winner: our_sid} }, socket);        
              emit_message(event_name_game_over, { ok: true, result: {winner: our_sid} }, connection);
            });
          })
        });
      }
    }

The first thing we attempt is to locate the game by the ``game_id`` passed in over the ``SocketIO`` connection. If we locate a game we grab the game board and assign the calling player a marker. 

If the calling player is the same as the ``starting_player`` off the game we get the marker ``x`` otherwise we get the marker ``o``. We then establish the other players session id by looking at the board (if the called is ``player_1`` then the other player is ``player_2``).

It's then time to verify that the co-ordinates passed to the ``player_marker`` function point to an empty board position. If it's not empty we return an error to the caller informing them that the cell is already selected. If the board position is empty we place the marker on the board and attempt to update the ``Game`` with the new ``board``. 

As we discussed earlier this will only succeed if it's the player that is calling this method's turn. Once the update is performed it's time to inform both of the players about the new state of the board by emitting a message with the board position that was changed and what kind of marker was put down.

.. code-block:: javascript

    {   ok: true
      , result: {
            y: data.y
          , x:data.x
          , marker: marker
        } 
    }

After we have emitted the new board state to the frontend, so they can render the board, we try to determine if the game was won by the method's calling player. This is done using the method ``is_game_over``. Let's have a look at the logic in this method.

.. code-block:: javascript

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

This method checks for the four possible conditions of winning, a ``diagonal``, ``horizontal`` or ``vertical`` win. There are probably some shorter and smarter versions of this code, but this is left as an exercise to you the reader if you think it's important.

If we determine that the board is not won by the placement of the marker we check if the board is a draw, meaning all positions in the board are marked. This code is very simple and is in the ``is_game_draw`` method.

.. code-block:: javascript

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

We just simply check if all of the fields are marked. If they are it's a draw. A single empty field means we are not in a draw position yet and the game can continue. If we have a draw we signal the players that the game ended in a draw, sending them the following message below. We then call the ``Game.finalize_board`` method passing in a null for the session id signaling a ``draw``. This updates the board to it's final state.

.. code-block:: javascript

    { 
        ok: true
      , result: {draw:true} 
    }

If the board was won by the calling player we send the players a message containing the winners session id and then call the ``Game.finalize_board`` method to finalize the board with the winning session id.

.. code-block:: javascript

    { 
        ok: true
      , result: {
          winner: our_sid
        } 
    }

That covers the backend API's. Before we move on to the frontend code let's wire up the handlers correctly. Open the file ``app.js`` and add the new handlers.

{{ ork.code('code/tic/tic3/tic5.js|pyg') }}

That's the backend taken care off and all wired up. It's time to turn our attention to the frontend part of the game.

The Front End
-------------

Let's get cracking on integrating our awesome backend API's on the frontend so we can play a game of Tic-Tac-Toe. Let's start by implementing the missing API calls on the frontend. Open up the ``public/javascripts/api.js`` file in your editor and get typing.

{{ ork.code('code/tic/tic3/tic6.js|pyg') }}

You might see that we are using two new templates one called ``board.ms`` and the other called ``decline_game.ms``. Let's create the two files for now and we will get back to the contents later in the exercise.

.. code-block:: console

    touch public/templates/board.ms
    touch public/templates/decline_game.ms

So what kind of API calls are we missing on the frontend. Well basically we need to wire up the backend functions we created. Let's look at what those methods are.

==========================   ================================
Function                     Description
==========================   ================================
find_all_available_gamers    Locate all currently active gamers in the system
invite_gamer                 Invite a player to a game using their session id
decline_game                 Decline an incoming invitation from another player
accept_game                  Accept the invitation to a game from another player
place_marker                 Attempt to place a marker on the Tic-Tac-Toe game
==========================   ================================

As we can see the methods all map to the backend ``API`` nice and cleanly. So let's start writing the frontend application code to make usage of them. 

The first thing we want to do is to add a new dialog for the game invitations to our ``lib/views/index.html`` file. Let's open up the file and add the ``invite_box`` div.

{{ ork.code('code/tic/tic3/tic1.html|pyg') }}

The ``invite_box`` div adds the dialog we will present to the user when they get invited to a new game allowing them to accept/decline the invitation.

After adding the new dialog we need to finish writing the template for our dashboard to include the list of available players the user can play. The template is in the file ``public/templates/dashboard.ms``. Open it up and add the following code.

{{ ork.code('code/tic/tic3/tic1.ms|pyg') }}

Notice the ``{{ '{{#gamers}}'}}`` tag that iterates through the ``gamers`` array in the ``context`` parameter we pass in when using the ``TemplateHandler.prototype.setTemplate`` or ``TemplateHandler.prototype.render`` method. 

For each gamer we add a new row in a table with a link that has the ``gamer_ + session id`` as an identifier. Later we will see how we wire up this link to be able to invite the player identified by it.

That's the dashboard taken care off. Let's move on and wire it up so that when you log on you can see the list of available players. Let's open up ``public/javascripts/app.js`` in the editor.

{{ ork.code('code/tic/tic3/tic7.js|pyg') }}

We need to add several event handlers as well as several utility methods in ``public/javascripts/app.js``. Let's first look at what we are adding in terms of event handlers.

==========================   ================================
Event                        Description
==========================   ================================
gamer_joined                 When a new player logs in the list of available players should get updated.
game_move                    When a valid move board move was performed update the board graphical display
game_over                    A move lead to the game finishing, determine what the outcome was and display the appropriate message to the player then return to the dashboard to start again
game_invite                  Another player invited you to join them in a game in Tic-Tac-Toe. Display the dialog to the player to allow them to accept/decline the invitation
==========================   ================================

Secondly lets look at what other handlers we are adding for user interactions with the application as well as methods to render a board, handle the invite process and the game itself.

=============================   ================================
Parameter                       Description
=============================   ================================
register_button_handler         When the player registers we now need to render the initial list of available players as well as the dashboard
login_button_handler            When the player logs in we now need to render the initial list of available players as well as the dashboard
invite_gamer_button_handler     When the player clicks on another player to invite them to a game
invite_accept_button_handler    Handle the user clicking to accept a game invitation
invite_decline_button_handler   Handle the user clicking on decline a game invitation
setupBoardGame                  Render a new clean Tic-Tac-Toe board and set up all the handlers for the placement of markers on it
game_board_cell_handler         Handle the user clicking on a board cell to place a marker
general_box_show                Show a general message box dialog
decline_box_show                Show a dialog where the other player declined a game invitation
game_invite_box_show            Show a dialog when the player gets invited to a new game by another player allowing them to accept/decline the invitation
=============================   ================================

Let's start with picking apart the code event handlers we listed above.

The gamer_joined Event Handler
------------------------------

.. code-block:: javascript

    /**
     * A new gamer logged on, display the new user in the list of available gamers
     * to play
     */
    api.on('gamer_joined', function(err, data) {
      if(err) return;
      // Get the gamer
      var gamer = data;
      // Check if we have the gamer already
      if(application_state.gamers == null) application_state.gamers = [];
      // Check if the gamer already exists and if it does 
      var found = false;

      // replace it with the new reference
      for(var i = 0; i < application_state.gamers.length; i++) {
        var _gamer = application_state.gamers[i];

        if(_gamer.user_name == gamer.user_name) {
          found = true;
          // Update the sid and update on
          _gamer.sid = gamer.sid;
          _gamer.updated_on = gamer.updated_on;      
          break;
        }
      }

      // If not found let's add it to the list
      if(!found) application_state.gamers.push(gamer);
      // If we currently have the dashboard
      if(template_handler.isTemplate("dashboard") && !application_state.modal) {
        var gamers = application_state.gamers;
        // Let's go to the dashboard of the game
        template_handler.setTemplate("#view", "dashboard", {gamers:gamers});    
        // Add handlers to the event
        for(var i = 0; i < gamers.length; i++) {
          $("#gamer_" + gamers[i]._id).click(invite_gamer_button_handler(application_state, api, template_handler));
        }
      }
    });

The ``gamer_joined`` event handler gets called every time a new player logs in. If the player already exists in our list we update the players session id and last active time to make sure we can talk to the correct player. If it does not exist we push it to the list of our users. 

In the case where are currently showing the ``dashboard`` view we re-render the list so we can show the newly added player. We don't re-render the dashboard if a modal dialog is currently being shown to the player. 

It's left as an exercise to the user on how to handle the rendering if the modal dialog is showing. One possible solution is to defer the rendering until the modal dialog is closed.

The game_move Event Handler
---------------------------

.. code-block:: javascript

    /**
     * The opponent made a valid move, render the move on the board
     */
    api.on('game_move', function(err, data) {
      if(err) return;
      // Get the move data
      var marker = data.marker;
      var y = data.y;
      var x = data.x;
      // Select the right box and mark it
      var cell_id_image = "#row" + y + "cell" + x + " img";
      // It was our turn, let's show the mark we set down
      if(marker == 'x') {
        $(cell_id_image).attr("src", "/img/cross.png");
      } else {
        $(cell_id_image).attr("src", "/img/circle.png");
      }
    });

The ``game_move`` event handler gets called each time a valid marker placement was done on the board. We then figure out if the marker is a ``x`` or a ``o`` and update the board position to show the image representing the marker placed on the board.

The game_invite Event Handler
-----------------------------

.. code-block:: javascript

    /**
     * The user was invited to play a game, show the invitation acceptance / decline box
     */
    api.on('game_invite', function(err, data) {
      if(data == null) return;  
      // Save the invitation in our application state
      application_state.invite = data;
      // Open the invite box
      game_invite_box_show(data.gamer);
    });

The ``game_invite`` event handler will save the invite in progress in the ``application_state`` and then display the invite accept/decline dialog box so the player can accept/decline the invitation.

The register_button_handler Handler
-----------------------------------

.. code-block:: javascript

    /**
     * Handles the attempt to register a new user
     */
    var register_button_handler = function(application_state, api, template_handler) {
      return function() {    
        // Lets get the values for the registration
        var full_name = $('#inputFullNameRegister').val();
        var user_name = $('#inputUserNameRegister').val();
        var password = $('#inputPasswordRegister').val();

        // Attempt to register a new user
        api.register(full_name, user_name, password, function(err, data) {
          // If we have an error show the error message to the user
          if(err) return error_box_show(err.error);

          // Load all the available gamers
          api.find_all_available_gamers(function(err, gamers) {
            // If we have an error show the error message to the user        
            if(err) return error_box_show(err.error);

            // Save the list of games in our game state
            application_state.gamers = gamers;
     
            // Show the main dashboard view and render with all the available players
            template_handler.setTemplate("#view", "dashboard", {gamers:gamers});
            
            // Add handlers for each new player so we can play them
            for(var i = 0; i < gamers.length; i++) {
              $("#gamer_" + gamers[i]._id).click(invite_gamer_button_handler(application_state, api, template_handler));
            }
          });
        });
      }
    }

We've modified the ``register_button_handler`` method to fetch the available players and render the ``dashboard`` view showing all of them. After finishing rendering the ``dashboard``, we wire up all the links to the players so we can click on them and trigger an invite to be sent.

The login_button_handler Handler
--------------------------------

.. code-block:: javascript

    /**
     * Handles the attempt to login
     */
    var login_button_handler = function(application_state, api, template_handler) {
      return function() {
        // Lets get the values for the login
        var user_name = $('#inputUserNameLogin').val();
        var password = $('#inputPasswordLogin').val();

        // Attempt to login the user
        api.login(user_name, password, function(err, data) {
          // If we have an error show the error message to the user
          if(err) return error_box_show(err.error);

          // Load all the available gamers
          api.find_all_available_gamers(function(err, gamers) {
            // If we have an error show the error message to the user        
            if(err) return error_box_show(err.error);

            // Save the list of games in our game state
            application_state.gamers = gamers;

            // Show the main dashboard view and render with all the available players
            template_handler.setTemplate("#view", "dashboard", {gamers:gamers});

            // Add handlers for each new player so we can play them
            for(var i = 0; i < gamers.length; i++) {
              $("#gamer_" + gamers[i]._id).click(invite_gamer_button_handler(application_state, api, template_handler));
            }
          });
        })
      }
    }

We've modified the ``login_button_handler`` method to fetch the available players and render the ``dashboard`` view showing all of them. After finishing rendering the ``dashboard``, we wire up all the links to the players so we can click on them and trigger an invite to be sent.

The invite_gamer_button_handler Handler
---------------------------------------

.. code-block:: javascript

    /**
     * Send an invitation to a player to pay a game
     */
    var invite_gamer_button_handler = function(application_state, api, template_handler) {
      return function(element) {
        var gamer_id = element.currentTarget.id;
        // Get the id
        var id = gamer_id.split(/\_/)[1];
        
        // Locate the gamer object
        for(var i = 0; i < application_state.gamers.length; i++) {
          if(application_state.gamers[i]._id == id) {
            var gamer = application_state.gamers[i];
        
            // Attempt to invite the gamer to play
            api.invite_gamer(gamer, function(err, game) {          
              // If we have an error show the declined game to the user
              if(err) return decline_box_show(template_handler, gamer);
              
              // Set up the board for a game
              setupBoardGame(application_state, api, template_handler, game);
            })        
          }
        }
      }
    }

The ``invite_gamer_button_handler`` method triggers when you click on one of the users available to invite. It will first locate the ``Gamer`` object for the player and use the ``api.invite_gamer`` to attempt to invite the user to a new game. If the other user accepts we call the ``setupBoardGame`` function to show the new board and set up all the handlers otherwise we shoe the decline dialog telling the player that the invite was declined.

The invite_accept_button_handler Handler
----------------------------------------

.. code-block:: javascript

    /**
     * Accept an invitation to play a game
     */
    var invite_accept_button_handler = function(application_state, api, template_handler) {
      return function() {
        // Accept the game invite
        api.accept_game(application_state.invite, function(err, game) {
          // If we have an error show the error message to the user        
          if(err) return error_box_show(err.error);

          // Set up the board for a game
          setupBoardGame(application_state, api, template_handler, game);
        });
      }
    }

The ``invite_accept_button_handler`` method handles the user clicking the accept button on the invite dialog. It calls the ``api.accept_game`` with the existing invite and if the successful it will set up the board using the ``setupBoardGame`` function. If unsuccessful we show an error dialog with the relevant error message. Let's see how we wire up those handlers.

.. code-block:: javascript

    // Load all the templates and once it's done
    // register up all the initial button handlers
    template_handler.start(function(err) {

      // Render the main view in the #view div
      template_handler.setTemplate("#view", "main", {});

      // Wire up the buttons for the main view
      $('#register_button').click(register_button_handler(application_state, api, template_handler));
      $('#login_button').click(login_button_handler(application_state, api, template_handler));

      // Wire up invite box buttons (this is in the main view)
      $('#invite_box_accept').click(invite_accept_button_handler(application_state, api, template_handler));
      $('#invite_box_decline').click(invite_decline_button_handler(application_state, api, template_handler));

      // Ensure we have the right state for the modal dialog
      $('#status_box').on("show", function() { application_state.modal = true; });  
      $('#status_box').on("hide", function() { application_state.modal = false; });
      $('#invite_box').on("show", function() { application_state.modal = true; });
      $('#invite_box').on("hide", function() { application_state.modal = false; });      
    })

Notice how we wire it up in the ``template_handler.start`` callback. This goes for both the ``invite_accept_button_handler`` and ``invite_decline_button_handler``. We only need to wire up these handlers once as the HTML elements they are wired up to will exist during the entire duration of the applications life. This is in contrast to the ``Gamer`` invite links that we need to rewire each time we show the list of ``Gamers`` available (Not optimal of course but this is left to you as an exercise to improve on).

The invite_decline_button_handler Handler
-----------------------------------------

.. code-block:: javascript

    /**
     * Accept an invitation to play a game
     */
    var invite_decline_button_handler = function(application_state, api, template_handler) {
      return function() {
        // Decline the game invite
        api.decline_game(application_state.invite, function(err, result) {
          // If we have an error show the error message to the user        
          if(err) return error_box_show(err.error);
          // No need to do anything as we declined the game and we are still showing the dashboard
        });
      }
    }

The ``invite_decline_button_handler`` handles the user clicking the decline button on invitation dialog. It calls the ``api.decline_game`` with the existing invite to cancel the invite and notify the inviting player about the player declining the invitation.

The setupBoardGame Function
---------------------------

.. code-block:: javascript

    /**
     * Set up a new game board and add handlers to all the cells of the board
     */ 
    var setupBoardGame = function(application_state, api, template_handler, game) {
      // Save current game to state
      application_state.game = game;
      // Let's render the board game
      template_handler.setTemplate("#view", "board", {});
      // Set the marker for our player (X if we are the starting player)
      application_state.marker = application_state.session_id == game.current_player ? "x" : "o";
      // Get all the rows
      var rows = $('#board div');

      // Add an event handler to each cell
      for(var i = 0; i < rows.length; i++) {
        var cells = $('#' + rows[i].id + " span");

        // For each cell create and add the handler
        for(var j = 0; j < cells.length; j++) {
          $("#" + cells[j].id).click(game_board_cell_handler(application_state, api, template_handler, game));
        }
      }
    }

The ``setupBoardGame`` function generates a new Tic-Tac-Toe game and renders the board in the browser and then attaches a handler ``game_board_cell_handler`` for each cell in the board that will handle the click of the user on that cell.

We created the ``public/templates/board.ms`` earlier and it's time to fill in the template with the layout of the board game.

{{ ork.code('code/tic/tic3/tic2.ms|pyg') }}

Nothing special here just a table with 4 rows and 4 columns containing a default background image as a placeholder.

The game_board_cell_handler Function
------------------------------------

.. code-block:: javascript

    /**
     * Create a cell click handler that will send the events to the server when the user clicks
     * on an event, and also show the result
     */ 
    var game_board_cell_handler = function(application_state, api, template_handler, game) {
      return function() {
        // Split up the id to get the cell position
        var row_number = parseInt(this.id.split("cell")[0].split("row")[1], 10);
        var cell_number = parseInt(this.id.split("cell")[1], 10);
        var cell_id = this.id;
        var cell_id_image = "#" + cell_id + " img";

        // Let's attempt to do a move
        api.place_marker(application_state.game._id, cell_number, row_number, function(err, data) {
          if(err) return error_box_show(err.error);

          // If we won
          if(data.winner != null && data.winner == application_state.session_id) {
            general_box_show("Congratulations", "<p>You won</p>");
          } else if(data.winner != null) {
            general_box_show("You lost", "<p>You got beaten buddy</p>");    
          } 

          if(data.marker == 'x') {
            $(cell_id_image).attr("src", "/img/cross.png");
          } else {
            $(cell_id_image).attr("src", "/img/circle.png");
          }
        });
      }
    }

The ``game_board_cell_handler`` is attached to each cell in the Tic-Tac-Toe board and detects the player clicking on it. When its fired, it will attempt to place a marker in that cell calling the ``api.place_marker`` method. 

If the placement of the marker leads to victory the player will receive a message back with the field ``winner`` set to the session id of the winning player. If that session id matches the calling player he won and we show the winning dialog. If it does not match we show the loser dialog. If we don't have a winner or loser we set the cell with the marker to show the move.

The general_box_show Function
-----------------------------

.. code-block:: javascript

    /**
     * General message box with configurable title and body content
     */ 
    var general_box_show = function(title, body) {
      // Set fields for the error
      $('#status_box_header').html(title);
      $('#status_box_body').html(body);
      // Show the modal box
      $('#status_box').modal({backdrop:true, show:true})    
    }

Generates a general box dialog with a provided title and body. Used to allow us to show a dialog with a custom title and body.

The decline_box_show Function
-----------------------------

.. code-block:: javascript

    /**
     * Show a game decline message box
     */ 
    var decline_box_show = function(template_handler, gamer) {
      // Set fields for the error
      $('#status_box_header').html("Invitation to game was declined");
      $('#status_box_body').html(template_handler.render("decline_game", gamer));
      // Show the modal box
      $('#status_box').modal({backdrop:true, show:true})    
    }

Generates a decline box dialog with the information about the gamer who declined the invite.

We use a ``decline_game`` template here that we created earlier. Let's fill in the template.

{{ ork.code('code/tic/tic3/tic3.ms|pyg') }}

As we can see it just renders the decline message using the passed in player information.

The game_invite_box_show Function
---------------------------------

.. code-block:: javascript

    /**
     * Show a game invite message box
     */ 
    var game_invite_box_show = function(gamer) {
      // Set fields for the error
      $('#invite_box_header').html("You have been invited to a game");
      $('#invite_box_body').html("The user <strong>" + gamer.user_name + "</strong> has challenged you to a game");
      // Show the modal box
      $('#invite_box').modal({backdrop:true, show:true})  
    }

Generates a accept/decline dialog box populated with the information of the inviting player.

Styling That Game
-----------------

Alright we are all wired up just one more thing to fix. Let's pretty up the board a little by adjusting the css for the board. Open the file ``public/css/app.css`` and enter the css.

{{ ork.code('code/tic/tic3/tic1.css|pyg') }}

Wrapping Up
-----------

Awesome we just finished ``Exercise 3`` and we have a fully working Tic-Tac-Toe game. In ``Exercise 4`` we will add some bonus features to the game and also handle a user closing the browser window in the middle of a game or deciding to quit a game in progress.

Notes
-----

There is lots of room for improvement in the code that you can do. Deferring the rendering of available players when a dialog is showing is one such thing. Rendering the board once only and clearing it instead of re-rendering might be another possible avenue.



