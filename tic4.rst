{% import "macros/ork.jinja" as ork with context %}
Tic-Tac-Toe: Exercise 4
=======================

In the last Exercise we will be adding chat functionality to the game and a button to allow a player to quit a game in progress. As part of allowing a player to quit a game in progress we also are going to handle the situation where they close the browser in the middle of a game, thus disconnecting.

Where Is The Code
-----------------

The code for this exercise is located at

https://github.com/christkv/tic-tac-toe-steps/tree/step3

Chatting It Up
--------------

Let's start with the chat functionality. Chat is defined as a text instant message conversation between two players over a game to be used for taunting and distracting you opponent so you can clinch victory. We have decided to add the chat messages themselves as an array on the board document in play. So let's open the ``lib/models/game.js`` file and modify the ``Game.create_game`` function to add the ``chat:[]`` field.

.. code-block:: javascript

    //
    // Create a new game, it contains all the information about the two players, the empty board, the whole
    // game chat record, who is starting the game and who is the current player.
    // 
    Game.create_game = function(p1_sid, p1_user_name, p1_full_name, p2_sid, p2_user_name, p2_full_name, callback) {
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
        , chat: []
        , created_on: new Date()
        , starting_player: p1_sid
        , current_player: p1_sid
      }, function(err, result) {
        if(err) return callback(err);
        callback(null, Array.isArray(result) ? result[0] : result);
      })
    }

Now let's create a handler for the chat messages. Create the file ``lib/handlers/chat_handler.js`` and open it with your editor.

.. code-block:: console

    touch lib/handlers/chat_handler.js

enter

{{ ork.code('code/tic/tic4/tic1.js|pyg') }}

The ``chat_handler.js`` file only includes a single method called ``send_message`` that takes a ``SocketIO`` message that includes the fields ``game_id`` and ``message``. Using the ``Game.find_game`` method we retrieve the game and knowing the caller session id from the ``SocketIO`` socket we determine the recipients session id before calling the new method ``Game.save_chat`` in the ``lib/models/game.js`` file.

{{ ork.code('code/tic/tic4/tic2.js|pyg') }}

The ``Game.save_chat`` method performs a ``$push`` update operation to push a message object containing a ``from``, ``to`` and ``message`` field to the back of the ``chat`` field array contained in the game document.

If the update is successful ``send_message`` notifies both players that the message was successfully transmitted.

Last but not least, lets wire up the ``send_message`` handler by opening the ``app.js`` file in our editor and adding the lines shown below under the ``socket.on('place_marker'...`` line.

.. code-block:: javascript

    // Accepts chat messages
    socket.on('send_message', send_message(io, socket, session_store, db));

Let's not forget to add the ``send_message`` handler to the ``require`` section at the top.

.. code-block:: javascript

    var register_handler                  = require('./lib/handlers/login_handler').register_handler
      , login_handler                     = require('./lib/handlers/login_handler').login_handler
      , find_all_available_gamers         = require('./lib/handlers/gamer_handler').find_all_available_gamers
      , invite_gamer                      = require('./lib/handlers/gamer_handler').invite_gamer
      , decline_game                      = require('./lib/handlers/gamer_handler').decline_game
      , accept_game                       = require('./lib/handlers/gamer_handler').accept_game
      , place_marker                      = require('./lib/handlers/gamer_handler').place_marker
      , send_message                      = require('./lib/handlers/chat_handler').send_message;


Front End
---------

We have to do some simle modifications to the frontend. Let's start by opening the ``public/javascript/api.js`` file and adding a method ``API.prototype.send_message``.

{{ ork.code('code/tic/tic4/tic3.js|pyg') }}

Next we need to add the HTML markup for that makes up the chat interface on the frontend. Open the file ``public/templates/board.ms`` and add add the following to it, in the area marked ``<div class="span4">``

.. code-block:: html

    <div class="span4">
      <div id="chat"></div>
      <input class="input-block-level" type="text" placeholder="chat message" id="chat_message"/>
    </div>

Let's pretty it up a bit, by adding some css styling. Open the ``public/css/app.css`` file and add the following to the end of it.

.. code-block:: css

    #chat p {
      margin: 0px 0px 0px 0px;
      padding: 0px 0px 0px 0px;
    }

    #chat {
      border: 1px solid gray;
      height: 400px;
    }

    .chat_msg_other {
      font-size: 14px;
      margin-left: 5px;
      margin-right: 5px;
      color: red;
    }

    .chat_msg_current {
      font-size: 14px;
      margin-left: 5px;
      margin-right: 5px;
      color: blue;
    }    

That's formating take care off. It's time to wire up the chat functionality to your application. First open up the ``public/javascripts/app.js`` file and add the ``chat_handler`` function to it.

.. code-block:: javascript

    /**
     * Handle chat messages from the user, (activates on the return key)
     */ 
    var chat_handler = function(application_state, api, template_handler, game) {
      return function(e) {    
        if(e.which == 13) {
          var chat_input = $('#chat_message');
          var chat_window = $('#chat');
          // Fetch the message the user entered
          var message = chat_input.val();
          if(application_state.game == null) return;
          
          // Send the message to the other player
          api.send_message(application_state.game._id, message, function(err, data) {
            // If we have an error show the error message to the user        
            if(err) return error_box_show(err.error);
      
            // Push the current message to the bottom
            chat_window.append('<p class="chat_msg_current">' + get_date_time_string() + '&#62; ' + message + "</p>");
            // Clear out the messages
            chat_input.val('');
          });
        }
      }  
    }

Wire it up by adding the line shown below to the end of the ``setupBoardGame`` function in the same ``public/javascripts/app.js`` file.

.. code-block:: javascript

    // Map up the chat handler
    $('#chat_message').keypress(chat_handler(application_state, api, template_handler, game));  

The ``chat_handler`` will listen for keyboard key presses and if it detects the ``return`` key it will take the content of the chat input box and send it to the server using the ``api.send_message`` method and append it to the chat window if the sending of the message succeeded.

The item we need to add is an event handler for ``chat_message`` events sent from the server. This event is fired when the server relays a message from the other player. Open up the ``public/javascripts/app.js`` and add the event handler shown below.

.. code-block:: javascript

    /**
     * The other player sent a message, render the message in the chat box
     */
    api.on('chat_message', function(err, data) {
      if(err) return;
      // Get the message
      var message = data.message;
      // Get the chat window  
      var chat_window = $('#chat');
      // Push the current message to the bottom
      chat_window.append('<p class="chat_msg_other">' + get_date_time_string() + '&#62; ' + message + '</p>');
    });

Notice that we use a method called ``get_date_time_string``. This is a helper method to format a date-time stamp for the chat message. Add the implementation under the ``Helper`` section of the ``public/javascripts/app.js`` file.

.. code-block:: javascript
    :linenos:

    /**
     * Get a date time string
     */ 
    var get_date_time_string = function() {
      var date = new Date();
      var string = date.getHours() < 10 ? "0" + date.getHours() : date.getHours();
      string += ":" + (date.getMinutes() < 10 ? "0" + date.getMinutes() : date.getMinutes());
      string += ":" + (date.getSeconds() < 10 ? "0" + date.getSeconds() : date.getSeconds());
      return string;
    }

We've now finished adding the functionality for two players to perform a chat during a game. The only thing that's left to implement is the two ways to leave a game in progress. The first one is if one of the two players closes the browser window containing the game in progress, and the second one is a button on the board for the player to leave the game.

Reddit Is More Interesting I'm Out Of Here
------------------------------------------

The first scenario happens when one of the players close their browser window. In this case we should terminate all the current games they are participating in by sending a user went away message to all the opposing players.

Lets start by creating a new handler that handles socket disconnects by messaging the still active players about them. First let's create the empty handler file.

.. code-block:: javascript

    touch lib/handlers/user_handler.js

Then it's time to fire up your editor and edit the newly created file ``lib/handlers/user_handler.js``.

{{ ork.code('code/tic/tic4/tic4.js|pyg') }}

We need to locate all games that are still active for this player and then set them to the status of a ``draw`` (it might not be the players fault as his internet connection might have dropped). First add the ``Gamer.finalize_all_boards_as_draws`` method to the ``lib/models/game.js`` file.

.. code-block:: javascript

    //
    // Finalizes all the boards as a draw
    //
    Game.finalize_all_boards_as_draws = function(sid, callback) {
      db.collection('games').update(
          {$or: [{player1_sid: sid}, {player2_sid: sid}], winner: {$exists: false}}
        , {$set: {final_state: 'draw', winner: null}}, {multi:true}, function(err, result) {
          if(err) return callback(err);
          if(result == 0) return callback(new Error("Failed to finalize the boards with a draw"));
          callback(null, null);
        });    
    }

If you remember from the last exercise an active game is a game without the ``winner`` field set. This method locates all the games that the player closing the socket is currently in and sets them to a ``draw`` state. It then messages all active players that we have experienced a disconnect event enabling them to recover from a game in progress.

Before we jump to the frontend let's make sure we wire up the new handler. Open the ``app.js`` file and add.

.. code-block:: javascript

    var disconnected                      = require('./lib/handlers/user_handler').disconnected; 

at the top and the handler below the ``send_message`` handler

.. code-block:: javascript

    // On disconnect
    socket.on('disconnect', disconnected(io, socket, session_store, db));

Now let's move to the frontend and get the event wired up correctly so the interface can respond to it.

Frontend Handling
-----------------

Open the ``public/javascripts/app.js`` file and add an event handler for the ``disconnect`` event.

.. code-block:: javascript

    /**
     * A player disconnect from the game, ensure we cancel any games we are playing
     * with them
     */
    api.on('disconnected', function(err, data) {
      if(err) return;
      // Get the sid
      var sid = data;
      // Check if the current game is being played with this user
      if(application_state.game 
        && (application_state.game.player1_sid == sid || application_state.game.player2_sid == sid)) {

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

          // Reset the game state
          application_state.game = null;

          // If we have an error show the error message to the user
          error_box_show("User disconnected");
        });
      }
    });

This handler will trigger on the ``disconnected`` event and if the game we are currently playing is with the disconnected player we render the dashboard and display the disconnect error (this effectively puts the player back in a position where they can challenge another player).

We are nearly there but we need to let the gamer have a way to leave a game at their leisure as well. To allow this we are going to add a button to leave a game in progress. Let's modify the ``public/templates/board.ms`` file to the button. Modify the ``<div class="span">`` with the HTML below adding the ``Quit Game`` button.

.. code-block:: html

    <div class="span4">
      <div><button id="quit_game">Quit Game</button></div>
      <div id="chat"></div>
      <input class="input-block-level" type="text" placeholder="chat message" id="chat_message"/>
    </div>

We then need to add a handler for the ``Quit Game`` button. Open up the ``public/javascripts/app.js`` file and modify the ``setupBoardGame`` to add a handler called ``quit_game_handler`` below the ``$('#chat_message').keypress(chat_handler(application_state, api, template_handler, game));`` line.

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

      // Map up the chat handler
      $('#chat_message').keypress(chat_handler(application_state, api, template_handler, game));  
      $('#quit_game').click(quit_game_handler(application_state, api, template_handler, game));
    }

Now we need to complete the ``quit_game_handler`` method and add it to the ``public/javascripts/app.js`` file.

.. code-block:: javascript

    /**
     * Create a handler for the quit game button on the board, sending a disconnect message
     * to the server and bringing the player back to the dashboard
     */ 
    var quit_game_handler = function(application_state, api, template_handler, game) {
      return function() {
        // Execute a disconnect
        api.leave_game(function(err, result) {
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

To make it all work we need to define a new ``API`` call called ``leave_game`` that will send a message to the server signaling that the player has left the game. Open up ``public/javascripts/api.js`` and add the ``API`` call.

.. code-block:: javascript

    /**
     * Send a disconnect message to the server
     */
    API.prototype.leave_game = function(callback) {
      this.socket.emit("leave_game", {});  
      callback(null, null);
    }

Notice that we not expecting a callback as we are in fact reusing the ``disconnected`` handler in the ``lib/handlers/user_handler.js`` file. We do need to define a new server ``API`` call named ``leave_game`` but we can reuse the same ``disconnected`` handler. Let's go ahead and wire up the ``disconnect`` handler in the ``app.js`` file.

.. code-block:: javascript

    socket.on('leave_game', disconnected(io, socket, session_store, db));

We Did It
---------

That ends the Tic-Tac-Toe tutorial. It's been a long winding road of code and editor usage but you now have your basic Tic-Tac-Toe multi-player game. There are lots of possible improvements that be implemented in the game of course. You could extend the game to be able to run multiple games at the same time against multiple players. Maybe introduce a friend relationship with players ?. Your imagination is the limit. Go forth and expand it as much as you want.


