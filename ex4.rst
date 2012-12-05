Exercise 4: Connecting to a single MongoDB instance from Node.js
================================================================

In this exercise we will look at how to connect to ``MongoDB`` from Node.js. We will write a simple program that connects to the server and then disconnects itself. We are assuming the npm ``mongodb`` package is already installed (if not revisit exercise 1). Fire up your text editor and enter the following program.

.. literalinclude:: ex/ex5.js
    :language: javascript
    :linenos:

Notice the weird string ``mongodb://localhost:27017/test`` this is called an ``URI`` connection string and is used by the driver to allow you to specify how to connect to a MongoDB server without specifying it programatically. This is useful if you need to use the same program against multiple different MongoDB setups as you can just store a seperate string for each environment.

The ``MongoClient.connect`` takes a function with 2 parameters where the first one is named ``err`` and the second ``db``. This is how Node.js works and if you look at the documentation on the Node.js site http://nodejs.org/ you'll notice that all functions take the same function. If the function worked correctly the ``err`` parameter will be set to ``null``. If it's not set to ``null`` there was an error during the ``MongoClient.connect`` call. To check if there was an error the code does ``if(err)`` that will return true if ``err`` is anything but ``null`` and then prints an error message before closing the connection.

But say we have 2 different databases we want to use. Can we do just do ``MongoClient.connect`` calls. The answer is yes but that it's not optimal. The reason is that ``MongoClient.connect`` sets up a connection pool for each call meaning that if you call ``MongoClient.connect`` a lot you might find that you are opening a lot of uneccessary connection to the MongoDB server. Luckily we can avoid this simply. Enter the following code in you text editor.

.. literalinclude:: ex/ex6.js
    :language: javascript
    :linenos:

Notice the line ``db.db('test2')``. This creates a new Db object where all operations will go against the db ``test2`` but will share the underlying connection pool with the first database ``test``. This lets your program get efficient reuse of the connection pool we created using ``MongoClient.connect``.

That's covered ``MongoClient.connect``. Sometime we want better programatic control of our connections to MongoDB. Luckily ``MongoClient`` allows for this aswell. Spin up the text editor again and enter the following program.

.. literalinclude:: ex/ex7.js
    :language: javascript
    :linenos:

Notice the line ``Server = mongodb.Server``. It allows us to define the settings for connecting to a server instance. The line ``new MongoClient(new Server('localhost', 27017))`` creates an instance of ``MongoClient`` that is ready to connect to the MongoDB server at localhost on port 27017. The program then calls ``.open`` on the ``MongoClient`` instance. The main difference from the previous connection example using ``MongoClient.connect`` is that the function returns the ``MongoClient`` instance instead of a ``db`` instance. To get hold of the ``db`` instances we have to call the function ``.db('test')`` on the ``MongoClient`` instance. The code does this twice to retrieve a db instance for the databases ``test`` and ``test2`` before finally closing the connection to the MongoDB database. 

Notes
-----
MongoDB can be configured to run as a cluster or sharded system. In later exercises we will learn how to connect to this configuarations. It's very similar to the current examples but has some slight differences. You can read more about the ``URI`` format at http://docs.mongodb.org/manual/reference/connection-string/

