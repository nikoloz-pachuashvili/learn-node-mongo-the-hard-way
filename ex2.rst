{% import "macros/ork.jinja" as ork with context %}
Exercise 2: Installing MongoDB
==============================

This book is all about using ``Node.js`` with ``MongoDB`` so naturally
we need to install ``MongoDB``. With no further ado let's get to it.

Mac OSX
-------

This exercise is made up by the following tasks that we need to complete
to finish this exercise.

1.  Go to the ``MongoDB`` website at http://www.mongodb.org/downloads
2.  Locate the latest ``MongoDB`` production release for ``OS X 64 bit``
3.  Copy the link address to the latest release in the browser (right click
    on the link).
4.  Open ``Terminal`` application
5.  Go to the directory ``learn-exercises`` we created in ``exercise 0``.
6.  Write the following, where ``link`` is the pasted link from the browser
    Following the download do an ```ls -la`` to see the file you downloaded.
    
    The example below is with 2.2.2 of mongodb

    .. code-block:: console

        ~ $ curl -O link
        % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                         Dload  Upload   Total   Spent    Left  Speed
        100 56.6M  100 56.6M    0     0   353k      0  0:02:44  0:02:44 --:--:--  277k
        ~ $ ls -la
        total 115928
        drwxr-xr-x   4 ck  staff       136 Dec  4 13:20 .
        drwxr-xr-x  25 ck  staff       850 Dec  4 12:56 ..
        -rw-r--r--   1 ck  staff  59352946 Dec  4 13:23 mongodb-osx-x86_64-2.2.2.tgz
        drwxr-xr-x   3 ck  staff       102 Dec  4 12:57 node_modules        
7.  Unpack the mongodb server in the local directory
  
    .. code-block:: console

        ~ $ tar xvfz mongodb-osx-x86_64-2.2.2.tgz
        x mongodb-osx-x86_64-2.2.2/GNU-AGPL-3.0
        x mongodb-osx-x86_64-2.2.2/README
        x mongodb-osx-x86_64-2.2.2/THIRD-PARTY-NOTICES
        x mongodb-osx-x86_64-2.2.2/bin/mongodump
        x mongodb-osx-x86_64-2.2.2/bin/mongorestore
        x mongodb-osx-x86_64-2.2.2/bin/mongoexport
        x mongodb-osx-x86_64-2.2.2/bin/mongoimport
        x mongodb-osx-x86_64-2.2.2/bin/mongostat
        x mongodb-osx-x86_64-2.2.2/bin/mongotop
        x mongodb-osx-x86_64-2.2.2/bin/mongooplog
        x mongodb-osx-x86_64-2.2.2/bin/mongofiles
        x mongodb-osx-x86_64-2.2.2/bin/bsondump
        x mongodb-osx-x86_64-2.2.2/bin/mongoperf
        x mongodb-osx-x86_64-2.2.2/bin/mongosniff
        x mongodb-osx-x86_64-2.2.2/bin/mongod
        x mongodb-osx-x86_64-2.2.2/bin/mongos
        x mongodb-osx-x86_64-2.2.2/bin/mongo        

    We are going to create a file called ``start-mongodb.sh`` that we will
    use to start the server.
8.  Open ``TextWrangler`` and a new document. Enter the following code but
    change the directory reference to the one matching your mongodb version.
    
    In this case it's ``mongodb-osx-x86_64-2.2.2``

    Enter the following code.

    .. code-block:: bash

        export PATH=./mongodb-osx-x86_64-2.2.2/bin:$PATH

    Save the file to the ``learn-exercises`` directory as ``setup.sh``
9.  Change the permission of the file so it can be executed

    .. code-block:: console

        ~ $ chmod 775 ./setup.sh
10. Execute the ``setup.sh`` script in our local context to set the
    environmental settings.

    .. code-block:: console

        ~ $ . ./setup.sh

    Notice the ``.`` before the file, this runs the script in the current
    shell context allowing us to modify the current PATH.
11. Let's create a directory to store our database and start up ``MongoDB``

    .. code-block:: console

        ~ $ mkdir data
        ~ $ mongod --dbpath=./data
        Tue Dec  4 14:33:17 [initandlisten] MongoDB starting : pid=79402 port=27017 
        dbpath=./data/ 64-bit host=ChristianK-MacBook-Pro.local
        Tue Dec  4 14:33:17 [initandlisten] 
        Tue Dec  4 14:33:17 [initandlisten] ** WARNING: soft rlimits too low. Number of 
        files is 256, should be at least 1000
        Tue Dec  4 14:33:17 [initandlisten] db version v2.2.2, pdfile version 4.5
        Tue Dec  4 14:33:17 [initandlisten] git version: 
        d1b43b61a5308c4ad0679d34b262c5af9d664267
        Tue Dec  4 14:33:17 [initandlisten] build info: Darwin bs-osx-106-x86-64-1.local 
        10.8.0 Darwin Kernel Version 10.8.0: Tue Jun  7 16:33:36 PDT 2011; 
        root:xnu-1504.15.3~1/RELEASE_I386 i386 BOOST_LIB_VERSION=1_49
        Tue Dec  4 14:33:17 [initandlisten] options: { dbpath: "./data/" }
        Tue Dec  4 14:33:17 [initandlisten] journal dir=./data/journal
        Tue Dec  4 14:33:17 [initandlisten] recover : no journal files present, 
        no recovery needed
        Tue Dec  4 14:33:17 [websvr] admin web console waiting for connections on port 28017
        Tue Dec  4 14:33:17 [initandlisten] waiting for connections on port 27017        
12. Open a new terminal shell window, ensure you are in the directory ``learn-exercises``
    and do.

    .. code-block:: console

        ~ $ . ./setup.sh
13. Let's connect to the ``MongoDB`` instance using the ``Mongo`` shell and execute
    a couple of commands.

    .. code-block:: console

        ~ $ mongos
        MongoDB shell version: 2.2.2
        connecting to: test
        > show dbs
        local (empty)
        > use test
        switched to db test
        > db.test.insert({a:1})
        > db.test.find().pretty()
        { "_id" : ObjectId("50bdfd7d9806fc973570b5b2"), "a" : 1 }
        > exit
        bye

.. NOTE::
    For the rest of our exercises we are going to assume that you have mongod running on your development machine running on ``localhost`` and port ``27017`` which are the default. All the code in the rest of the examples that use ``MongoDB`` will assume this unless otherwise stated.
