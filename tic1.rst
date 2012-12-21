Tic-Tac-Toe: Exercise 1
=======================

We are going to build ourselves a brand new super hi technology multiplayer Tic-Tac-Toe game (and the crowd goes wild). During these exercises we will learn about exiting technologies such as ``SocketIO`` and ``Express JS` two of the most popular ``NPM`` modules currently available for Node.JS in 2013 as well as ``MongoDB`` of course. The application is also build slightly differently than what you might be used to if you've written more classic web applications. It's 100% client driven and dynamic. Yes you read right it's Javascript the whole way down in this app. Only a single controller renders HTML once the rest is all rendered in the client using ``Mustache`` to create an awesome next generation Tic-Tac-Toe worthy of the title the best multiplayer Tic-Tac-Toe game ever.

Architecture
------------

The first choice was to use ``SocketIO`` for communication. ``SocketIO`` is an abstraction library for message passing between the client and server. It's got full support for websockets but also has fallback mechanisms if websockets are not available. This makes it a great choice for games like Tic-Tac-Toe that does not have strong realtime requirements (with realtime we mean positions of players must be updated at least 25 times per second).

The second one was to build our application as a set of API methods that model the interactions between the front (client side javascript) and the server code. The idea was outline how the interactions look like between the client and the server and between two players.

The first realization is that there are two types of interactions. There are interactions initiated by the client (ex: get a list of all available gamers) and there are interactions initiated by either the server or another client via the server (ex: player one invites player two to play a game). That means a calling ``API`` as well as event handling. Having this in mind let's look at what kind of actions we need in our fancy Tic-Tac-Toe game.

From the client there are several actions that we need to take in relation to the game such as finding the list of available gamers, logging in, invite a player to a game and actually play the game by putting down markers.

==========================  ================================
Action                      Description
==========================  ================================
register                    Attempt to register a new user
login                       Attempt to perform a login of an existing user
find_all_available_gamers   Locate all logged on gamers
invite_gamer                Invite another gamer to participate in a new game
decline_game                Decline an invitation to participate in a game
accept_game                 Accept an invitation to participate in a game
place_marker                Attempt to place a new marker on a board
send_message                Send a chat message to another player during a game
==========================  ================================

The events we can receive from the server or another player are such things as an invitation to a new game, chat messages, a game over message, a placement of a marker on the board, chat messages and more.

=================   ================================
Event               Description
=================   ================================
init                Server calls back with initial state information when ``SocketIO`` connects
game_move           A valid placement of a marker on the board was performed by the other player
game_over           The game is over, returns the state of the game (who won or if it's a draw)
game_invite         Another user invited the player to a game
chat_message        A chat message was received by the gamer
gamer_joined        A new gamer joined the system (let's us update the list of gamers we can play)
=================   ================================

The simple idea is to model the application interactions as an ``API`` where the calls go over ``SocketIO`` allowing us to write the application in more thick client way. Some of you might point out that there are libraries to help do this already but the idea here was to keep the amount of learning to a minimum and show the core ideas behind such libraries.

So let's get rolling with the first steps.

Mac OSX and Linux
-----------------

Go to the directory where you want to put the game and let's set up the basics.

.. code-block:: console
    :linenos:

    mkdir tic-tac-toe
    cd tic-tac-toe
    npm init

``NPM`` will ask you a lot of questions, fill them in as you see fit. Once you are done, we need to edit the newly created ``package.json`` file. So open it in your editor and add the ``dependencies`` part. The repository version looks like this.

.. code-block:: json

    {
      "name": "tic-tac-toe",
      "version": "0.0.1",
      "description": "A multiplayer tic-tac-toe game",
      "main": "index.js",
      "scripts": {
        "test": "echo \"Error: no test specified\" && exit 1"
      },
      "repository": {
        "type": "git",
        "url": "git://github.com/christkv/tic-tac-toe.git"
      },
      "keywords": [
        "tic",
        "tac",
        "toe",
        "game",
        "tutorial"
      ],
      "dependencies": {
        "mongodb": "1.2.4",
        "express": "3.0.4",
        "cookie": "0.0.5",
        "socket.io": "0.9.13"
      },
      "author": "Christian Kvalheim",
      "license": "BSD",
      "readmeFilename": "README.md"
    }

Notice the part called ``dependencies``. This tells NPM that our application needs to use the MongoDB driver as well as ``express`` and ``ejs``. Right save it and then do.

.. code-block:: console

    npm install

``NPM`` will not go ahead and download our dependencies. Once it is finished we need to ``bootstrap`` our application or in other words set up the initial structure. Lets boot up the console and create our directory structure as well as grab the libraries like ``bootstrap``, ``jquery``, ``mustache`` and the images we need for the board.

.. code-block:: console
    :linenos:

    mkdir public
    mkdir public/javascripts
    mkdir public/css
    mkdir public/templates
    mkdir public/img
    mkdir lib
    mkdir lib/controllers
    mkdir lib/handlers
    mkdir lib/models
    mkdir lib/views
    touch app.js
    touch env.js
    touch public/javascripts/app.js
    touch public/javascripts/api.js
    touch public/javascripts/template_handler.js
    touch public/css/app.css
    curl http://www.bootstrapcdn.com/twitter-bootstrap/2.2.2/js/bootstrap.min.js > public/javascripts/bootstrap.min.js
    curl http://www.bootstrapcdn.com/twitter-bootstrap/2.2.2/css/bootstrap.css > public/css/bootstrap.css
    curl http://www.bootstrapcdn.com/twitter-bootstrap/2.2.2/css/bootstrap-responsive.css > public/css/bootstrap-responsive.css
    curl http://cdnjs.cloudflare.com/ajax/libs/jquery/1.8.3/jquery.min.js > public/javascripts/jquery.js
    curl http://cdnjs.cloudflare.com/ajax/libs/mustache.js/0.7.0/mustache.min.js > public/javascripts/mustache.js
    curl https://raw.github.com/christkv/tic-tac-toe/master/public/img/board_background_img.png > public/img/board_background_img.png
    curl https://raw.github.com/christkv/tic-tac-toe/master/public/img/circle.png > public/img/circle.png
    curl https://raw.github.com/christkv/tic-tac-toe/master/public/img/cross.png > public/img/cross.png
    curl https://raw.github.com/christkv/tic-tac-toe/master/public/img/glyphicons-halflings-white.png > public/img/glyphicons-halflings-white.png
    curl https://raw.github.com/christkv/tic-tac-toe/master/public/img/glyphicons-halflings.png > public/img/glyphicons-halflings.png

Right we are set for the basic structure of the application. Let's get cracking on the first part of the application. The place where everything starts is the ``app.js`` and the ``env.js`` file. Let's have a look at the ``app.js`` file. Fire up the editor and type in the code.

App.js
------

.. literalinclude:: ex/tic1.js
    :language: javascript
    :linenos:

The two main things to notice here is that we have hidden most of the wiring of the plumbing in the ``env.js`` but that we are setting up the ``controllers`` and ``SocketIO`` in ``app.js``. The function ``app.get('/', ....)`` maps the handler ``main_controller.index()`` to the root of the web address (if the server is running on ``localhost`` and port ``3000`` it would map to ``http://localhost:3000``). Let's have a quick look at ``main_controller.js``

.. literalinclude:: ex/tic2.js
    :language: javascript
    :linenos:

Notice how the ``index`` function returns a function that takes request and response. This lets us do things like this ``index(db)`` and create a function that knows about a shared ``MongoDB`` database object. We will see in the next exercise how this is used to create handlers for the ``SocketIO`` based ``API``. The ``index`` controller reads the file ``lib/views/index.html`` and sends it to the browser. The ``index.html`` file contains the start screen of our Tic Tac Toe application. Fire up your editor and enter it.

.. literalinclude:: ex/tic3.html
    :language: html
    :linenos:

If you are wondering how this HTML works I suggest you have a look at http://twitter.github.com/bootstrap/index.html for documentation. In short it lets people like me with lesser design abilities to create websites that are not complete eyesores. Also notice that we are including the javascript files for ``api.js``, ``app.js`` and ``template_handler.js`` that we ``touched`` when we created the initial directory structure. These will include the actual logic for the client side part of the game and their secrets will be revealed in due time.

Let's look at the final file of our first step. That's the ``env.js`` file. If you revisit the ``app.js`` file you will notice that it contains two methods that are called. The first one is ``initialize`` and the second one is ``run``. Let's enter the ``env.js`` file and have a look at what it does.

.. literalinclude:: ex/tic4.js
    :language: javascript
    :linenos:

The answer is quite a lot. The ``intialize`` function sets up the ``Express JS`` webframework with a ``session`` store static file serving of all files under the ``/public`` directory (this lets us access the javascripts, css and image files from the browser). Further more we notice that on the top of the code we have the following three lines.

.. code-block:: javascript
    :linenos:

    , app = express()
    , server = require('http').createServer(app)
    , io = require('socket.io').listen(server)

This sets up an ``Express JS`` instance and maps ``SocketIO`` to the same socket so they can work well together. The ``SocketIO`` instance is names ``io`` and for us to be able to connect the browser and the ``SocketIO`` connection we need to be able to access what is called a ``Session Cookie``. The ``io.set('authorization', ...)`` event happens when the web pages is first loaded and a ``SocketIO`` connection is made. When the connection happens the code looks up the ``Session Cookie`` set by ``Express JS`` and adds it to the ``SocketIO`` connection we just made. This makes it possible for the application to identify what user is associated with what ``SocketIO`` connection and further exercises will show how we use this to communicate between two specific users.

Lastly we call ``MongoClient.connect`` to connect to the ``MongoDB`` server and if everything worked out well we return to the calling code in ``app.js``. When ``app.js`` calls the ``run`` method in ``env.js`` the ``Express JS`` server starts up and we print the welcome message to the console.

You can now go to ``http://localhost:3000`` and see the initial page running in your browser. Awesome right? Now that we have the basic scaffolding in place we can move on to the next exercise where we will create the login and registration api's and test them out.
