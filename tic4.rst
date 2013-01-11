Tic-Tac-Toe: Exercise 4
=======================

In the last Exercise we will be adding chat functionality to the game and also a way for the players to detect if the other player left the game as well as a button that allows us to leave a game while it's in play.

Let's start with the chat functionality. Chat is defined as a text instant message conversation between two players over a game to be used four taunting and distracting you opponent so you can clinch victory. Since we are doing this we have decided to add the chat itself as an array on the board in play. Let's open the ``lib/models/game.js`` file and modify the ``Game.create_game`` function to add the ``chat:[]`` field.

.. code-block:: javascript
    :linenos:

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

Then we are going to create a handler for the chat message so let's create the file ``lib/handlers/chat_handler.js`` and open it with our editor.

.. code-block:: console
    :linenos:

    touch lib/handlers/chat_handler.js

enter

.. literalinclude:: ex/tic28.js
    :language: javascript
    :linenos:

The ``chat_handler.js`` file only includes a single method called ``send_message`` that takes a ``SocketIO`` message including the fields ``game_id`` and ``message``. Using the ``Game.find_game`` method we retrieve the game and knowing the caller session id we determine the recipients session id before calling the new method ``Game.save_chat`` in the ``lib/models/game.js`` file.

.. literalinclude:: ex/tic29.js
    :language: javascript
    :linenos:

The ``Game.save_chat`` method uses the ``$push`` operator with a ``MongoDB`` update to insert a message object containing a ``from``, ``to`` and ``message`` field to the back of the ``chat`` field array.

If the insert is successful ``send_message`` notifies both parties in the chat that the message was successfully transmitted. As you can see not very complicated. Finally lets wire up the ``send_message`` handler by opening the ``app.js`` file in our editor and adding the lines below the ``socket.on('place_marker'...`` line.

.. code-block:: javascript
    :linenos:

    // Accepts chat messages
    socket.on('send_message', send_message(io, socket, session_store, db));

Don't forget to add the ``send_message`` handler to the ``require`` section at the top.

.. code-block:: javascript
    :linenos:

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

We have to do some modifications to the frontend. Let's start by opening the ``public/javascript/api.js`` file and adding the method ``API.prototype.send_message``.

.. literalinclude:: ex/tic30.js
    :language: javascript
    :linenos:

Next we need to add the location for our chat window. Open the file ``public/templates/board.ms`` and add add the following to it in the area marked ``<div class="span4">``

.. code-block:: html
    :linenos:

    <div class="span4">
      <div id="chat"></div>
      <input class="input-block-level" type="text" placeholder="chat message" id="chat_message"/>
    </div>

Let's pretty it up a bit by adding some css styling. Open the ``public/css/app.css`` file and add the following to the end of it.

.. code-block:: css
    :linenos:

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

Nice that's formating take care off. It's time to wire up the chat functionality to your application. First open up the ``public/javascripts/app.js`` file and add the ``chat_handler`` function to it.

.. code-block:: javascript
    :linenos:

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

Wire it up by adding this line to the end of the ``setupBoardGame`` function in the same ``public/javascripts/app.js`` file.

.. code-block:: javascript
    :linenos:

    // Map up the chat handler
    $('#chat_message').keypress(chat_handler(application_state, api, template_handler, game));  

The ``chat_handler`` will listen for key presses and if it detects the ``return`` key it will take the content of the chat input box and send it to the server using the ``api.send_message`` function and if it's successful append it to the log.

The last part we need to add is an event handler for the ``chat_message`` event from the server that is triggered when the other player sends a message. To the same file add the following event handler.

.. code-block:: javascript
    :linenos:

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

As you can see we use a method called ``get_date_time_string`` that is a helper method to format a date-time stamp for the chat message. Add the implementation under the ``Helper`` section of the ``public/javascripts/app.js`` file.

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

And that's it we've added chatting capabilities between two given players on a board. The only thing left to implement is two small scenarios. The first one is if one of the two players close the browser window and the second one is a quit the game button.

The Player Has Left The Building
--------------------------------

The first scenario happens when one of the players close their window. In this case we should terminate all the current games they are participating in by sending a user went away message.

Lets create a new handler that fill handle socket disconnects by messaging the still active players about them. Let's create the handler file.

.. code-block:: javascript
    :linenos:

    touch lib/handlers/user_handler.js

Fire up your editor and edit the ``lib/handlers/user_handler.js``.

.. literalinclude:: ex/tic31.js
    :language: javascript
    :linenos:

We need to locate all games that are still active for this player and set the to draw. First lets add the ``Gamer.finalize_all_boards_as_draws`` method to the ``lib/models/game.js`` file.

.. code-block:: javascript
    :linenos:

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

An active game is a game without the ``winner`` field set. This method locates all the games that the player closing the socket is currently in and sets them to a ``draw`` state. We then signal all active players that we have a disconnect event enabling them to recover from a game in progress.

Before we jump to the frontend let's make sure we wire up the new handler. Open the ``app.js`` file and add.

.. code-block:: javascript
    :linenos:

    var disconnected                      = require('./lib/handlers/user_handler').disconnected; 

at the top and the handler below the ``send_message`` handler

.. code-block:: javascript
    :linenos:

    // On disconnect
    socket.on('disconnect', disconnected(io, socket, session_store, db));

Let's move to the frontend and get the event wired up.

Frontend Handling
-----------------

Let's open the ``public/javascripts/app.js`` file and add an event handler for the ``disconnect`` event.

.. code-block:: javascript
    :linenos:

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

This handler will catch the ``disconnected`` event and if the game we are currently playing is with the disconnected player we render the dashboard and display an error.

We are nearly there but we need to let the gamer have a way to leave a game in progress as well so we are going to add a button to allow a user to leave a game in progress. Let's modify the ``public/templates/board.ms`` file to add a leave the game button. Open it up and modify the ``<div class="span">``.

.. code-block:: html
    :linenos:

    <div class="span4">
      <div><button id="quit_game">Quit Game</button></div>
      <div id="chat"></div>
      <input class="input-block-level" type="text" placeholder="chat message" id="chat_message"/>
    </div>

Next we need to add a handler for the button. Let's open up the ``public/javascripts/app.js`` and modify the ``setupBoardGame`` adding a handler ``quit_game_handler`` below the ``$('#chat_message').keypress(chat_handler(application_state, api, template_handler, game));``

.. code-block:: javascript
    :linenos:

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

Now let's define the ``quit_game_handler`` function and add it to the ``public/javascripts/app.js`` file.

.. code-block:: javascript
    :linenos:

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

We are defining a new ``API`` call called ``leave_game`` that will message the server that the player have left the game. It's a fairly simple ``API`` call. Open up ``public/javascripts/api.js`` and add the ``API`` call.

.. code-block:: javascript
    :linenos:

    /**
     * Send a disconnect message to the server
     */
    API.prototype.leave_game = function(callback) {
      this.socket.emit("leave_game", {});  
      callback(null, null);
    }

Notice that we not expecting a callback as we are in fact reusing the ``disconnected`` handler in the ``lib/handlers/user_handler.js``. But we are defining a new server ``API`` call named ``leave_game``. So let's wire up the ``disconnect`` handler in the ``app.js`` file.

.. code-block:: javascript
    :linenos:

    socket.on('leave_game', disconnected(io, socket, session_store, db));

We Did It
---------

That rounds up the tutorial. It's been a long winding road of code and editor usage but you now have your basic Tic-Tac-Toe multiplayer game. There are lots of possible improvements that be performed on the game of course. You could extend the game to be able to run multiple games at the same time against multiple player. If a player leaves or joins you might not want to render the whole dashboard but just update the list. Maybe introduce a friend relationship with players ?. Your imagination is the limit. Go forth and expand it as much as you want.


