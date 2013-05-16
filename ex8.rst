{% import "macros/ork.jinja" as ork with context %}
Exercise 8: Write Concerns
==========================

Remember we briefly mentioned something called ``write concerns`` earlier when we introduced the option ``w:0`` on the insert. Write concerns is one of the more crucial concepts to understand when using MongoDB. They allow you to set the guarantee of persitance that you want for your documents. This means you can set your app to wait for MongoDB to save the document to memory, disk or send it over to other members in a cluster (more on clusters later). At one end of the spectrum is ``w:0`` which means no ``acknowledgement`` from MongoDB. This means the driver does not ask MongoDB if the write succeded or not (fire and forget). You application will never know if the data was correctly written to MongoDB unless you attempt to retrieve the data later. This might now sound like a good idea but it comes with one good upside, namely raw insert performance. Let's say you are inserting analytical data from a mouse tracking application. The analytics might be all about aggregation so a single missing data point does not matter but the insert speed does. So to avoid that the application has to wait for an acknowledgement from MongoDB you set ``w:0`` and don't incur the cost of the acknowledgement.

So what kind of values can write concerns be and what do they mean. Below is a table outlining the write concerns and what they mean.

==============       ===========
WriteConcern         Description
==============       ===========
w:0                  No acknowlegement of the write from MongoDB
w:1                  MongoDB acknowleges when the document has been safely written to memory
w:2 or larger        MongoDB acknowleges when the document has been safely written to memory in N servers
w:'majority'         MongoDB acknowleges when the document has been safely written to memory in a majority of servers (f.ex if you have 1 primary and 4 secondaries this would be 3 servers as 3 out of 5 is a majority of servers)
j:true               MongoDB acknowleges when the document has been safely written to the MongoDB journal
fsync:true           MongoDB acknowleges when the document has been safely written to disk
==============       ===========

Quite a bit of new terminology. Let's look through the different write concerns and explain what they mean. I will introduce the concept of a ``replicaset`` here but only as a concept as we will go more indepth in later exercises. In short a ``replicaset`` is a MongoDB cluster that in the simplest form concists of a ``primary`` which accepts writes (inserts/update/removes) and one or more ``secondaries`` that only accept reads (queries).

Let's look at how MongoDB actually works under the cover when you want to ackowledge an insert. The first thing we need to understand is that MongoDB seperates the writing of the data from the ackowledgement. They are in fact two different commands. So when the driver does a non ackowledge write using ``w:0`` it only sends the write command. If your application needs written to memory ackowledgement with ``w:1`` it will send a write command and a ``getLastError`` command together.

The ``getLastError`` command is the command that returns the the status of the last executed operation on a specific socket. It will wait until the specified write concern is fulfilled. Let's try it ourselves. Let's fire up the ``mongo`` console.

.. code-block:: console

    ~ $ mongo
    MongoDB shell version: 2.2
    connecting to: test    
    > use test
    switched to db test
    > db.getlasterrortest.insert({_id: 1})
    > db.getlasterrortest.insert({_id: 1})
    E11000 duplicate key error index: test.getlasterrortest.$_id_  dup key: { : 1.0 }
    > db.getLastError()
    E11000 duplicate key error index: test.getlasterrortest.$_id_  dup key: { : 1.0 }
    > db.getlasterrortest.insert({_id: 2})
    > db.getLastError()
    null

As we can see the ``getLastError`` returns the last command status for our connection. Once we insert a new record with no error ``getLastError`` returns ``null``.

So let's play with the write concerns in a bit of code. Get your editor and start typing.

.. literalinclude:: ex/ex19.js
    :language: javascript
    :linenos:

When I run it on my local machine the output looks something like.

.. code-block:: console
    
    connected to database
    time w:0 ~ 0
    Duplicate document
    time w:1 ~ 0
    time j:true ~ 31
    Duplicate document
    time fsync:true ~ 35
    Duplicate document

Let's look at the usage of the write concerns. We are doing 4 different types in this code. The first one is ``w:0``, the second one is ``w:1`` the third ``j:true`` and the last one ``fsync:true``. Note that when we try to insert a duplicate document using ``w:0`` we don't recieve any error message back as we are not sending the ``getLastError`` command to the MongoDB server. Once we use ``w:1, j:true or fsync:true`` we get an error message back when we try to insert a duplicate document. The example also calculates the time it took to insert a document when using ``w:0, w:1, j:true, fsync:true`` and as we can see there is a marked jump in time take from ``w:1`` to ``j:true`` and ``fsync:true``. This is because when you put ``j:true`` ``getLastError`` waits for the document to be written to the MongoDB ``journal``. The ``journal`` flushes to disk every ``100`` ms so in the worst case it will take ``100`` miliseconds before you get an acknowledgement but most likely it will be less than ``100`` miliseconds. However if you wait for ``j:true`` you have a guarantee that you can recover the data if the MongoDB database should crash.

For ``fsync:true`` the server needs to write the document to memory and then write that memory to disk which can be quite slow depending on how much data MongoDB has to write and what kind of disk you have (SSD or HD). Safe to say you should avoid ``fsync:true`` if possible.

We can see that ``w:1`` is close to ``w:0`` and this will for the most part be true. There are some corner cases where this is not true and that is if MongoDB has to make some space in memory before it can write the document. In this case it might take longer as it needs to be shuffle memory around to make some space for the new document. Some of the more observant might point out that ``w:0`` cannot be measures as it does not perform a ``getLastError``. That's very true but it still shows that there is little difference between ``w:0`` and ``w:1`` when it comes to general performance.

Problems In Paradise
--------------------

So one of the traps you can fall into is that you decide to do all the inserts using ``w:0`` only to discover that you run out of memory on huge inserts of documents. This happens because Node.js is capable of processing more documents for insert than MongoDB and your network can handle so they back up in the socket buffers until you run out of memory. Or you find that you are writing so much to MongoDB that is has problems responding to other operations.

Luckily there is a way to control the flow of the inserts and the clue lies in ``getLastError``. Let's type in the example below and have a look at how the flow control works.

.. literalinclude:: ex/ex20.js
    :language: javascript
    :linenos:

The first part of the code after the ``MongoClient.connect`` is to generate an array of documents (in this case ``100005`` documents). After creating the documents we calculate the number of batches needed when the batchsize is ``1000``. And after getting the right number of batches we use the ``modulo operator %`` in the statement ``var leftOverDocuments = numberOfDocuments % batchSize;`` to determine how many documents are left outside the batches. In this case the number of batches are ``100`` and the left over number of documents ``5``

We then call the ``runBatches`` function with the collection, batchSize, numberOfBatches and documents. The ``runBatches`` function calls the ``batch`` function that inserts ``999`` with the write concern ``w:0`` and then the last one of the ``1000`` with the write concern ``w:1``. Once the ``batch`` function finishes we call ``runBatches`` again with ``numberOfBatches - 1`` until ``numberOfBatches`` equals ``0`` (notice that we call ``numberOfBatches`` using ``process.nextTick()`` to make sure we don't run out of stack space). After the batch inserts are done we check if we have any left over documents and do a final ``batch`` insert with any leftover documents.

The benefit of this is that we are inserting ``1000`` documents and for each ``1000`` documents we are doing a write concern of ``w:1`` to let MongoDB catch up. This lets us throttle the insert rate, get the benefit of no ackowledgement using ``w:0`` but at the same time avoiding overflowing the socket buffers.

Setting Default Write Concern
-----------------------------

The Node.js driver lets you set the default write concern at different levels. ``MongoClient`` already comes with the default write concern set to ``w:1`` but your application can set it at the ``Db``, ``Collection`` or individual operation. Let's enter some example code showing how to set it at different levels.

.. literalinclude:: ex/ex21.js
    :language: javascript
    :linenos:

When you run the script the output should look something like this.

.. code-block:: console

    connected to database
    write concern on collection caught duplicate key error
    write concern on collection caught duplicate key error

Let's dissect the code and look at how it works. The first insert is the ``collection.insert({_id:1})`` when we connected to the db we used the connection string ``mongodb://localhost:27017/test?w=0`` where ``w=0`` means no ackowledgement by default. This is inherited by the collection when we do ``var collection = db.collection('my_write_concern_docs');`` meaning that the first insert is done with ``w:0``. The second insert shows how we can override the default write concern set for the database for a collection. ``var collectionWithWriteConcernSet = db.collection('my_write_concern_docs', {w:1});`` creates a new collection object where all operations will default to ``w:1``. This causes the insert to fail as we try to insert a duplicate document. The last insert shows how we can override the write concern on an individual insert operation. In this case we take the ``collection`` variable which has the default write concern ``w:0`` and override it for the insert to be ``j:true`` by doing ``collection.insert({_id:1}, {j:true}, .......``.

As we can see write concerns can be specified at the ``Db``, ``Collection`` and the individual operation level and if not set the individual operation inherits from the ``Collection`` settings while the ``Collection`` inherits the write concern from the ``Db`` if not set.

.. NOTE::
    ``Replicasets`` and write concerns will be covered in later exercises. One of the things to keep in mind about write concerns is that the cost of higher guarantees of durability comes with an insert performance cost. So think carefully if you need your documents to be replicated across multiple ``secondaries`` or if you are good enough with them being ackowledged as written to the memory of the ``primary`` server. A typical mistake is to be to paranoid about losing data and setting the highest possible durability you can do and getting very bad insert performance as a consequence.















