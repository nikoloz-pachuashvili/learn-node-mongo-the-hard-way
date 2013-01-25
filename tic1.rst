Tic-Tac-Toe: Exercise 1
=======================

We are going to build ourselves a brand new super high-tech multiplayer Tic-Tac-Toe game (and the crowd goes wild). During these exercises we will learn about exiting technologies such as ``SocketIO`` and ``Express JS`, two of the most popular ``NPM`` modules, as well as ``MongoDB``, of course. The application is built slightly differently than what you might be used to if you've written other classic web applications. It's 100% client driven and dynamic. Yes, you read that right. It's Javascript powered all the way down. A single controller renders HTML and only a single template. The rest is all rendered in the client using ``Mustache`` to create an awesome next generation Tic-Tac-Toe worthy of the title of the best multiplayer Tic-Tac-Toe game ever (irony noted).

Where Is The Code
-----------------

The code for this exercise is located at

https://github.com/christkv/tic-tac-toe-steps/tree/step0

Architecture
------------

Let's look at why we picked ``SocketIO`` for communication. ``SocketIO`` is an abstraction library for message passing between the client and server. It's got full support for websockets but also has fallback mechanisms if Websockets is not available in the browser. This makes it a great choice for games like Tic-Tac-Toe that do not have strong realtime requirements which need to be able to reliably deliver 25 messages a second.

The main goal is to build our application as a set of API methods that model the interactions between the front (client side javascript) and the server code. This makes the interactions between the client and the server a defined set and gives us some structure for our application so we can extend it in the future.

The first realization is that there are two types of interactions in our application: those initiated by the client (ex: get a list of all available gamers) and those initiated by either the server or another client via the server (ex: player one invites player two to play a game). That means a calling ``API`` as well as event handling. Having this in mind, let's look at what kind of actions we need in our fancy Tic-Tac-Toe game.

From the client (browser) there are several actions that we need to consider in relation to the game such as finding the list of available gamers, logging in, inviting a player to a game and actually playing the game by putting down markers.

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
leave_game                  The player wishes to leave a game in progress
==========================  ================================

We've outlined the actions a client can perform to interact with the server or other players. However, what are the types of messages the client needs to listen to? Let's list them out.

=================   ================================
Event               Description
=================   ================================
init                Server calls back with initial state information when ``SocketIO`` connects
game_move           A valid placement of a marker on the board was performed by the other player
game_over           The game is over, returns the state of the game (who won or if it's a draw)
game_invite         Another user invites the player to a game
chat_message        A chat message is received by the gamer
gamer_joined        A new gamer joins the system (lets us update the list of gamers we can play)
disconnected        A player leaves a game currently in progress
=================   ================================

The simple idea is to model the application interactions as an ``API`` where the calls go over ``SocketIO``. This allows us to write the application in a more thick client style without having to rely on server logic and define the boundary between the server and the client. Some of you might point out that there are libraries to help do this already but the core idea of this exercise is to show the basic principals behind such libraries so that you can understand them better and make a more enlightened choice for your own future applications.

So let's get started with the first steps.

Mac OSX and Linux
-----------------

Go to the directory where you want to store your application and let's set up the basics.

.. code-block:: console
    :linenos:

    mkdir tic-tac-toe
    cd tic-tac-toe
    npm init

``NPM`` will ask you a lot of questions. Fill them in as you see fit. Once you're done, you need to edit the newly created ``package.json`` file. So, open it in your editor and add the ``dependencies`` part. The repository version looks like this.

.. code-block:: json

    {
      "name": "tic-tac-toe-steps",
      "version": "0.0.1",
      "description": "ERROR: No README.md file found!",
      "main": "app.js",
      "scripts": {
        "test": "echo \"Error: no test specified\" && exit 1"
      },
      "dependencies": {
        "mongodb": "1.2.9",
        "express": "3.0.4",
        "cookie": "0.0.5",
        "socket.io": "0.9.13"
      },
      "repository": "",
      "author": "",
      "license": "BSD"
    }

Notice the part called ``dependencies``. This tells NPM that the application needs to use the ``MongoDB`` driver as well as ``Express JS``, ``SocketIO`` and an utility module called ``cookie``.

.. code-block:: console

    npm install

``NPM`` will now download the declared dependencies. Once ``NPM`` finishes we need to ``bootstrap`` the application or in other words set up the initial structure. Let's boot up the console and create our directory structure as well as grab the libraries like ``bootstrap``, ``jquery``, ``mustache`` and the images we need for the board.

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

Right we are set for the basic structure of the application. Let's get cracking on the first part of the application. The places to start are the ``app.js`` and the ``env.js`` files. 

App.js
------

First, let's have a look at the ``app.js`` file. Fire up your preferred code editor and type in the code.

.. literalinclude:: ex/tic1.js
    :language: javascript
    :linenos:

Something to notice here is that we have hidden most of the plumbing of the application in the ``env.js`` file but that we are setting up the ``controllers`` and ``SocketIO`` in the ``app.js`` file. The function ``app.get('/', ....)`` maps the handler ``main_controller.index()`` to the root of the web address (if the server is running on ``localhost`` and port ``3000`` it would map to ``http://localhost:3000``). Let's have a quick look at ``main_controller.js``

.. literalinclude:: ex/tic2.js
    :language: javascript
    :linenos:

Notice how the ``index`` function returns a function that takes a request and a response parameter. Returning a function lets us do things like ``index(db)`` and create a function that knows about a shared ``MongoDB`` database object (we are creating a function in a scope where the db object exists). In the next exercise we will see how this is used to create handlers for the ``SocketIO`` based ``API``. The ``index`` controller reads the file ``lib/views/index.html`` and sends it to the browser. The ``index.html`` file contains the start screen of our Tic-Tac-Toe application. Fire up your editor and enter it.

.. literalinclude:: ex/tic3.html
    :language: html
    :linenos:

If you are wondering how this HTML works I suggest you have a look at http://twitter.github.com/bootstrap/index.html for documentation. In short, it lets people like me with lesser well developed design abilities create websites that are not complete eyesores. Also, notice that we are including the javascript files for ``api.js``, ``app.js`` and ``template_handler.js`` that we ``touched`` when we created the initial directory structure. These will include the actual logic for the client side part of the game and their secrets will be revealed in due time.

Env.js
------

Let's take a quick look at ``env.js`` file. If you remember the ``app.js`` file you would have noticed that it contained two methods that did not exist in the ``app.js`` file. The first one was ``initialize`` and the second one was ``run``. Open up your editor and bring up the ``env.js`` file and get coding.

.. literalinclude:: ex/tic4.js
    :language: javascript
    :linenos:

So, what do the methods do? Well, the ``intialize`` function sets up the ``Express JS`` web framework with a ``session`` store and a location for static file serving of all files under the ``/public`` directory which lets us access the javascripts, css and image files from the browser. At the top of the file, you'll notice the three core lines.

.. code-block:: javascript
    :linenos:

    , app = express()
    , server = require('http').createServer(app)
    , io = require('socket.io').listen(server)

This sets up an ``Express JS`` instance and maps ``SocketIO`` to the same socket so they can work together. The ``SocketIO`` instance is stored in the variable ``io``. One of the things we need to ensure is that our ``SocketIO`` instance can be associated with the initial web page the user loaded through a ``Session Cookie``. To do this, we need to do some mapping between the ``SocketIO`` instance and the server session using our ``Session`` Store. Luckily ``SocketIO`` has thought about this.

The ``io.set('authorization', ...)`` event occurs when the web page is first loaded and a ``SocketIO`` connection is made. When the connection happens, the code looks up the ``Session Cookie`` set by ``Express JS`` and adds it to the ``SocketIO`` connection. This makes it possible for the application to identify which user is associated with which ``SocketIO`` connection and future exercises will show how we use this to communicate between two specific users.

Lastly, we call ``MongoClient.connect`` to connect to the ``MongoDB`` server and if all works well, we'll return to the calling code in ``app.js``. When ``app.js`` calls the ``run`` method in ``env.js``, the ``Express JS`` server starts up and we print the welcome message to the console. Before we can boot up, we need a ``MongoDB`` server. Open another terminal and go to the project directory. Let's start a new server.

.. code-block:: console

    mkdir data
    mongod --dbpath=./data

In your previous terminal, start the application (make sure your node.js executable is in your path).

.. code-block:: console

    node app.js

You can now go to ``http://localhost:3000`` and see the initial page running in your browser. Awesome, right? Now that we have the basic scaffolding in place, we can move on to the next exercise where we will create the ``login`` and ``registration`` API's.
