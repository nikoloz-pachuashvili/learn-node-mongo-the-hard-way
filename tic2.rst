Tic-Tac-Toe: Exercise 2
=======================

Welcome back it's time to start filling in our empty frame of a game with all our functionality. In this exercise we will implement our registration and login process for the game thus allowing our marks (I mean potential tic-tac players) to register to play the game and to return to wet their addiction in the future with a user and password. Since we want to keep the registration process as simple as possible we are going to just remove any such thing as email verification (feel free to add this if you fear an avalanche of 419 scams).

As we mentioned in the last tutorial exercise we've decided to go with a API over websocket as it's all the rage (as in 2013 at least when this was written) and we've forgone any fancy frameworks like ``meteor``, ``socketstream`` etc to make it very clear what's going on (I hope).

The glue to hold i together
---------------------------

Let's create the pieces we need.

.. code-block:: console
    :linenos:

    touch lib/handlers/login_handler.js
    touch lib/models/shared.js
    touch lib/models/user.js
    touch lib/models/gamer.js

So we are going to need to API calls for out login process. The first one is to register a new user and the second one to allow a existing user to login. Let's open the ``app.js`` file and add the new handlers for our API calls.

.. literalinclude:: ex/tic5.js
    :language: javascript
    :linenos:

Notice that we are adding the handlers as events to the socket connection. This is because we are using the custom event functionality of ``SocketIO`` to map our messages from the ``frontend`` javascript to the backend API.

.. code-block:: javascript
    :linenos:

    socket.on('register', register_handler(io, socket, session_store, db));
    socket.on('login', login_handler(io, socket, session_store, db));

We pass in the ``io`` variable that represents our ``SocketIO`` instance allowing us to interact with all of the other ``SocketIO`` connections. Next is the current ``socket`` for the current user, the ``session store`` so we can do such stuff as registering if the user is currently logged on or not and finally the ``db`` instance so we can interact with ``MongoDB``.

We are defining both of these ``handler`` functions in the ``lib/handlers/login_handler.js`` file and include them at the top of the file using ``require``. 

.. code-block:: javascript
    :linenos:

    var register_handler                  = require('./lib/handlers/login_handler').register_handler
      , login_handler                     = require('./lib/handlers/login_handler').login_handler

Modeling that data
------------------

So it's quite obvious that we need some sort of entities in our game for the user. In this game we've decided to use the two terms ``user`` and ``gamer`` where ``user`` is the login and user information for a particular mark(user) and where gamer is the current ``session`` relationship between a ``user`` in ``MongoDB`` and the browser the user is playing on.

For the user we will need a couple of functions to allow us to correctly implement a ``registration`` and ``login process`.

=====================   ================================
Function                Description
=====================   ================================
findByUser              Locate a user object by user name
findByUserAndPassword   Locate a user by username and password, used for login verification
createUser              Create a user with his full name, user name and elected password
=====================   ================================

Let's Implement the user module, fire up the editor again and enter.

.. literalinclude:: ex/tic6.js
    :language: javascript
    :linenos:

There are a couple of things to notice here. The first one is the ``module.exports = function(db)``. What we do is let us do ``user(db).findByUser`` and apply the method ``findByUser`` to the selected ``db``. Remember that in ``Javascript`` a constructor is just a function so in this case ``User`` which is a function is returned but since it's created inside the function ``module.exports = function(db)`` ``db`` is in the scope of the returned ``User`` function. A useful pattern to remember.

Let's have a look at ``findByUserAndPassword``. We are using the ``crypto`` library in ``Node.js`` to encrypt the passed in password. Always remember to do this in your application. ``NEVER`` store the clean word password in your database as it's a huge security risk. In this case I've picked a hashing method called ``sha1`` but feel free to pick something like ``sha256`` if you really want to avoid the chance of people being able to crack the password. We then turn the ``sha'ed`` password into a ``hex`` string and attempt to lookup a user by the user name and the ``hex`` digest of the password they provided. If no user is returned there either is no user or the password does not match.

The ``createUser`` is quite similar to the ``findByUserAndPassword`` the main difference being that we are adding a user to the db instead of checking if it exists and has a valid password.

Let's move on to the ``gamer`` model we are using to map the users browser ``session`` to his database ``user``. For this one we are going to need a couple of things. First off all we are defining the ``collection`` for the data as ``time to live or TTL`` collection meaning that the seesions will timeout after a certain period of time (in this case 60 seconds times 60 minutes or 1 hour). The other two is to look up a user by a ``session`` and to update an existing gamer ``session``. So we will implement the following methods.

=====================   ================================
Function                Description
=====================   ================================
findGamerBySid          Locate a gamer by his session id
updateGamer             Updates a given user with a live session id
init                    Sets up the TTL collection
=====================   ================================

Fire up the editor and implement the code below.

.. literalinclude:: ex/tic7.js
    :language: javascript
    :linenos:

Two things to notice the ``Gamer.init`` and the ``Gamer.updateGamer`` methods. The first ``Gamer.init`` should be run only once when we are setting up the server to ensure we have the ``TTL`` index all set up on the ``gamers`` collection. Let's modify the ``env.js`` file with the editor.

.. literalinclude:: ex/tic8.js
    :language: javascript
    :linenos:

Notice that added the line ``gamer(db).init(function(err, result) {`` to the ``env.js`` file. This means the initialization of the ``TTL`` index on the ``gamers`` collection will only happen at startup. Alright we got our models up and running let's get cracking on the backend API's for our game.

Handler time
------------

As we see we have two handlers we need to define on the server side to allow for a new user to ``register`` and ``login`` namely ``register_handler`` and ``login_handler``.

Fire up the text editor, open ``lib/handlers/login_handler.js`` and get cracking on the code for the handlers by entering the following code.

.. literalinclude:: ex/tic9.js
    :language: javascript
    :linenos:

The register_handler function
-----------------------------

Let's have a look at the ``register_handler`` method that handle the registration of a new user to the game. The first thing you notice is that we return a ``function``. This is used to create a unique function tied to the specific connection's socket. The returned function actually responds to any messages sent via ``SocketIO`` with the event ``register``. ``SocketIO`` will return a ``data`` object that contains ``full_name``, ``user_name`` and ``password``. The first step is to check if the user already exists by calling the ``findByUser`` method on the ``User`` model we have. If there is one we call a method called ``emit_error`` that is defined in ``shared.js`` that ensures all error messages sent back to the browser share the same formating.

If no user exists we create a new user using the ``User.createUser`` method we wrote earlier and use the shared method ``emit_login_or_registration_ok`` to login the user and notify the browser about a successful login. Before we look at ``emit_login_or_registration_ok`` let's have a quick look at ``emit_error`` in ``shared.js``

.. literalinclude:: ex/tic10.js
    :language: javascript
    :linenos:

As we can see the method ``emit_error`` will emit an object to one or more ``SocketIO`` sockets (if it detects that the socket parameter is an Array it will loop through all the sockets and emit the error). The message is ``standardized`` for the application so we can handle all the errors in one way in the browser. Standardizing your messaging protocol is quite useful to avoid complexity and unnecessary duplicated code.

.. code-block:: javascript
    :linenos:

    socket.emit("data", {
        event: event
      , ok: false
      , is_error:true
      , error: err
    });

The other two functions in the ``shared.js`` file is the ``emit_message`` and ``emit_message_all``. The ``emit_message`` is fairly simple it just emits a message over the provided ``SocketIO`` with a given socket, event and message. The ``emit_message_all`` uses the ``io.socket.clients()`` method to get a list of all connected ``SocketIO`` clients and then loops through all of them with the exception being the ``socket`` that called the method. The exclusion is done using the ``clients[i].handshake.sessionID`` that is set in the ``env.js`` file when a user first visits the game.

Alright let's get back to the ``emit_login_or_registration_ok`` function in the ``register_handler`` function. The first thing the function does it to update the current gamers session and last active time using the passed in user name. It then sets the sessions value ``session_store.sessions[socket.handshake.sessionID].user_name`` that is used to ensure the user is authenticated (in later exercises we will use this to lock down API calls to make sure there is a valid authenticated user calling the method). Once this is done we send a message back over the user ``socket`` with the event ``register`` and the object ``{ok:true}`` that notifies the browser that registered correctly and are logged in.

At the end we look up our ``gamer`` document by our ``session`` id and send a message with the event ``gamer_joined`` to all the other gamers currently connected via SocketIO. This lets us update things such as the available players continuously as people are logging into the game. Also since we are iterating over all the live ``SocketIO`` connections only players that are still active will receive the message of the newly joined gamer.

That closes up the backend part of the registration/login process. Let's move onto the frontend part of the application and implement the other side of our game.

Fronting it
-----------

One of the things we touched upon earlier was a common error message. We want to have a common error box for all errors on the frontend and we are going to add it as a ``modal`` dialog using ``bootstrap``. Let's bring up the editor and add it to our ``index.html`` file.

.. literalinclude:: ex/tic3.html
    :language: html
    :linenos:

Awesome let's go full steam ahead and look at the core of the frontend interface to our backend. This is the ``public/javascript/api.js`` file. Open the file and enter the following code.

.. literalinclude:: ex/tic11.js
    :language: javascript
    :linenos:

Let's start with the actual API creation function.

.. code-block:: javascript
    :linenos:

    /**
     * Wraps the API used for the game and handles the socketIO connection
     */
    var API = function() {
      var self = this;

      this.socket = io.connect("http://" + document.domain);
      this.handlers = {};
      this.once_handlers = {};

      // Handle the data returned over the SocketIO
      this.socket.on("data", function(data) {

        // If the data object has an event member we have
        // a valid event message from the server
        if(data && data.event) {
          var handlers = self.handlers[data.event];
          if(handlers != null) {
            for(var i = 0; i < handlers.length; i++) {
              data.is_error ? handlers[i](data) : handlers[i](null, data.result);
            }
          }
          
          var handlers = self.once_handlers[data.event];
          if(handlers != null) {
            while(handlers.length > 0) {
              data.is_error ? handlers.pop()(data) : handlers.pop()(null, data.result);
            }

            delete self.once_handlers[data.event];
          }
        }
      });
    }

The first thing we notice is that we use the ``docuemnt.domain`` as the identifier for the ``SocketIO`` connection. This is to ensure we are not doing cross-domain websockets and to avoid any authentication issues. Once the connection has been created we add an event listener to the event ``data``. Notice that we don't handle any ``errors`` on the socket. We leave it as an exercise to handle how to reconnect if the socket closes.

The handler for the ``data`` event takes the object returned by ``SocketIO`` and determines what kind of event it is by looking at the ``data.event`` value that is always present in our messages (hence the importance of standardizing your messaging protocol messages so they always look the same). After having determined what kind of ``event`` we received we locate all the handlers that are interested in the event and call their functions notifying all interested parties.

There are two types of handlers we can set up. 

.. code-block:: javascript
    :linenos:

    /**
     * Register an event listener callback (will keep receiving messages)
     */
    API.prototype.on = function(event, callback) {
      if(this.handlers[event] == null) this.handlers[event] = [];
      this.handlers[event].push(callback);
    }

    /**
     * Register an event listener callback for a single instance of the event
     */
    API.prototype.once = function(event, callback) {
      if(this.once_handlers[event] == null) this.once_handlers[event] = [];
      this.once_handlers[event].push(callback);
    }

A ``on`` and ``once`` handler (blatant ripoff from Node.js EventEmitter). The ``on`` registers a function to an ``event`` that gets called each time that event is detected in a ``SocketIO`` message. The ``once`` registers a function that will only fire once when a message of the event type is detected in a ``SocketIO`` message.

Why do we do this. Well simply put. When we do a single call to the backend we don't want the callback to be executed more than once and since all messaging is driven by events we register a callback for only a single ``execution``. But for some other things like when a new player joins the game we might want to get messaged each time it happens using the same function. That's when ``on`` comes into force. Don't worry it will make more sense when we show you the next pice of code.

.. code-block:: javascript
    :linenos:

    /**
     * Register a new user
     */
    API.prototype.register = function(full_name, user_name, password, callback) {  
      // Do basic validation
      if(full_name == null || full_name.length == 0) return callback(create_error("register", "Full name cannot be empty"));
      if(user_name == null || user_name.length == 0) return callback(create_error("register", "User name cannot be empty"));
      if(password == null || password.length == 0) return callback(create_error("register", "Password name cannot be empty"));
      // Register callback
      this.once("register", callback);
      // Fire message
      this.socket.emit("register", {
          full_name: full_name
        , user_name: user_name
        , password: password
      });
    }

    /**
     * Login a user
     */
    API.prototype.login = function(user_name, password, callback) {  
      // Do basic validation
      if(user_name == null || user_name.length == 0) return callback(create_error("login", "User name cannot be empty"));
      if(password == null || password.length == 0) return callback(create_error("login", "Password name cannot be empty"));
      // Register callback
      this.once("login", callback);
      // Fire message
      this.socket.emit("login", {
          user_name: user_name
        , password: password
      });
    }

    /**
     * Send a message to a specific gamer on a specific game
     */
    API.prototype.send_message = function(game_id, message, callback) {
      this.once("send_message", callback);  
      this.socket.emit("send_message", {game_id: game_id, message: message});
    }

    /**
     * Simple method to create a formated error message that fits the
     * format returned from the server
     */
    var create_error = function(event, err) {
      return {
          event: event
        , ok: false
        , is_error: true
        , error: err
      }
    }

Let's have a look at the ``API.prototype.register`` function in the ``API``. It first does a couple of validations checking that ``full_name``, ``user_name`` and ``password`` are not empty strings and if anyone of them are it calls the calling function with a ``standardized`` error message (same format as we send from the server) using the ``create_error`` function. If all the validations pass we use the ``once`` method mentioned above to register the calling functions ``callback`` function to the event ``register``. This means that when the frontend receives an event of type ``register`` it will locate that callback and execute it returning the results to the code originally calling the ``register`` ``API`` method. After registering the ``callback`` the method sends a message down to the backend with the event ``register`` that gets processed by our backend handler in ``lib/handlers/login_handler.js`` file called ``register_handler``. 

The same applies for the ``API.prototype.login`` method the difference being that the message sent is handled by the ``login_handler`` function in the ``lib/handlers/login_handler.js`` file.

Wiring up the code
------------------

Right we've defined the ``API`` for the game, let's wire it all up so we can actually perform a registration or login. Open the file ``public/javascript/app.js`` in your editor.

.. literalinclude:: ex/tic12.js
    :language: javascript
    :linenos:

The first part of the file is the ``application_state``. This object keeps track of all application specific information needed across the lifetime of the application such as the current session id associated with the current user. The ``var api = new API()`` statement keeps an instance of the api around for the application to use and initiates contact with the server over websockets.

Let's have a look at a special class we use to handle the rendering of our templates. Open the ``public/javascripts/template_handler.js`` and add the following code.

.. literalinclude:: ex/tic13.js
    :language: javascript
    :linenos:

This class takes care of loading, caching and rendering our templates used in the application.

=====================   ================================
Function                Description
=====================   ================================
start                   Loads all the templates provided in the constructor
setTemplate             Renders a template and sets a div
isTemplate              Checks if a named template exists
render                  Render a named template and return the rendered result
=====================   ================================

All templates passed into the ``TemplateHandler`` constructor are passed as an object like this. Each template has a unique name and a url location for the template itself. All the templates are written in a template language called ``mustache`` http://mustache.github.com/.

.. code-block:: json
    :linenos:

    {
        "main": "/templates/main.ms"
      , "dashboard": "/templates/dashboard.ms"
    }

Open up your editor and enter the two templates. The first one is at ``public/templates/main.ms``

.. literalinclude:: ex/tic14.ms
    :language: mustache
    :linenos:

The second one is at ``public/templates/dashboard.ms``

.. literalinclude:: ex/tic15.ms
    :language: mustache
    :linenos:

The benefit of ``Mustache`` is that it keeps a very sharp divider between your code and the rendering avoiding silly string concatenations to generate HTML for your application. You can read more up on ``Mustache`` on the link above but safe to say it's a very very simple and limited little template language.

Alright after that digression let's return to the ``TemplateHandler`` class. The ``TemplateHandler.prototype.start`` method will use ``JQuery`` to load the templates specified and store them in an internal hash. The application uses the method ``TemplateHandler.prototype.setTemplate`` to set a overwrite an HTML elements content identified by ``id`` using ``JQuery`` with the content of the rendered template identified by ``template_name`` and the passed in values in the ``context`` object.

The other method ``TemplateHandler.prototype.render`` is similar to the ``TemplateHandler.prototype.setTemplate`` method but returns the rendered template result instead of overwriting the content of an existing HTML element.

Ok that explains the ``TemplateHandler`` class it's time to get back to the ``public/javascript/app.js`` file and write some of the code for the application (I consider ``TemplateHandler`` a plumbing class).

.. code-block:: javascript
    :linenos:

    // Load all the templates and once it's done
    // register up all the initial button handlers
    template_handler.start(function(err) {

      // Render the main view in the #view div
      template_handler.setTemplate("#view", "main", {});

      // Wire up the buttons for the main view
      $('#register_button').click(register_button_handler(application_state, api, template_handler));
      $('#login_button').click(login_button_handler(application_state, api, template_handler));
    })

When the user loads the webpage a ``TemplateHandler`` instance gets created and the method ``start`` is called that loads all the templates and then sets the initial template view overwriting the HTML element identified by the id ``view``. After rendering and replacing the HTML the method wires up the ``register_button`` and the ``login_button`` to listen for a user clicking the button. If a user clicks the ``register_button`` the ``register_button_handler`` function is called and if the user clicks the ``login_button`` the ``login_button_handler`` function is called.

Lets look at the next part of the file ``public/javascript/app.js``.

.. code-block:: javascript
    :linenos:

    /**
     * The init event, the server has set up everything an assigned us
     * a session id that we can use in the application
     */
    api.on("init", function(err, data) {
      application_state.session_id = data;
    });

    /**
     * A new gamer logged on, display the new user in the list of available gamers
     * to play
     */
    api.on('gamer_joined', function(err, data) {
      if(err) return;
    });

Here are using the ``on`` method from the ``API`` class to listen to the events ``init`` and ``gamer_joined``. As you can see at this point we are only storing the result returned in the ``init`` event handler. This happens to be the current session id returned from the server. The other event handler will be fleshed out in later tutorial exercises.

Time to look at our two actual button handlers.

.. code-block:: javascript
    :linenos:

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

          // Show the main dashboard view and render with all the available players
          template_handler.setTemplate("#view", "dashboard", {gamers: []});
        });
      }
    }

The first part of the method grabs the content of the three fields ``inputFullNameRegister``, ``inputUserNameRegister`` and ``inputPasswordRegister`` then attempts to register the user calling the ``api.register`` method. When the method returns the callback gets called with two parameters ``err`` and ``data`` (Standard Node.js callback). If the ``err`` parameter is not equal to ``null`` the ``register`` function failed and we use the method ``error_box_show`` to present the user with an error message dialog. Since all our error messages follow the same standard this makes it easy to create a more generalized error message box. If not error happened the user was successfully created and logged in and we then set the HTML element to the ``dashboard.ms`` template and render it. Registration complete. 

.. code-block:: javascript
    :linenos:

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

          // Show the main dashboard view and render with all the available players
          template_handler.setTemplate("#view", "dashboard", {gamers:[]});
        });
      }
    }

The login code is very similar as you can see with the difference just being that we are calling the ``api.login`` function. Pretty self explanatory.

We've finally finished up the ``register`` and ``login`` parts of the tic-tac-toe game. Let's fire up the server an play around with our result.

.. code-block:: console
    :linenos:

    node app

Some scenarios to try out.

1. Attempt a login with non existing user.
2. Attempt to register a new user with the full name field empty.
3. Fill in all the fields correctly for a registered user.
4. Login in using a registered user.

That finished step two in the tutorial. Join us for the next tutorial step where we implement the game play.

Notes
-----

This is a very simplified registration and login process. You might want to do things like extend the validations on the client and server side for password strength and maybe add an email verification process to make sure the new player enters a valid email but this is left as an exercise for you to do.








