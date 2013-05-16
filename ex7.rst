{% import "macros/ork.jinja" as ork with context %}
Exercise 7: Inserting documents
===============================

The first and most important feature of a database is to be able to store data in it. Let's get cracking on inserting documents into MongoDB. There are 3 main things you need to know about inserting documents in MongoDB using the Node.js driver. These are single inserts, bulk inserts and write concerns. Before hitting the details let's do a single document insert to get us moving and explain the basic concept. Fire up your text editor and enter the following code.

.. literalinclude:: ex/ex12.js
    :language: javascript
    :linenos:

Let's digest the code example. The first thing we notice after connecting to the database is that we create a document containing ``'hello': 'world'``. After that we grab the collection ``mydocuments`` and we call the method on the collection called ``.insert()``. The first parameter is the document we wish to store and the second is an object with the parameter ``w`` set to 0. Notice that we have not provided any callback function. We will touch on the concept of ``write concerns`` a bit down the line. Sufficient for now is to know that if we set ``w:0`` we are not asking MongoDB to acknowledge that the write was correctly recieved by the database server. Rather it's a ``fire and forget`` write of the document to MongoDB.

What happens under the cover is that the driver takes your document and converts it into a ``BSON`` document that is then sent over the socket to MongoDB. Let's boot up the MongoDB console and verify that the document made it to the console (we are assuming you have the executable ``mongodb`` in your path for your terminal/shell/windows prompt).

.. code-block:: console

    ~ $ mongo
    MongoDB shell version: 2.2
    connecting to: test    
    > use test
    switched to db test
    > show collections
    mydocuments
    system.indexes
    > db.mydocuments.findOne()
    { "hello" : "world", "_id" : ObjectId("50c5f63780ebe8585f000001") }

Notice that our document is correctly stored in our ``test`` database. But also notice that we have an additional field called ``_id`` that seems to be of a type known as ``ObjectId``. The first thing to understand is that all documents in a collection in MongoDB has what is termed a ``primary key`` called ``_id``. A ``primary key`` is a unqiue identifier for that specific document that is unique for the whole collection. There is a guarante from MongoDB's side that there cannot be more than one document using a specific ``ObjectId`` for the field ``_id`` in a collection. You can use the same ``ObjectId`` in other collections of course or in other field names. The driver actually generates these for you when you insert if they don't exist from before. Also notice that the number inside the ``ObjectId(...)`` will vary on your computer in comparision to the example as it's a generated value.

But you can also override the ``_id`` field yourself and set it to application generated id. This might be useful if you are generating your own globally unique numbers for example. Let's do this and also see what happens if we try to insert the same document with the same id twice. Enter the following code in your editor.

.. literalinclude:: ex/ex13.js
    :language: javascript
    :linenos:

When you run this you should see the following output

.. code-block:: console
    
    connected to database
    document with _id already exists

Let's check what's in the database after we ran our script.

.. code-block:: console

    ~ $ mongo
    MongoDB shell version: 2.2
    connecting to: test    
    > use test
    switched to db test
    > show collections
    mydocuments
    system.indexes
    > db.mydocuments.find().pretty()
    { "hello" : "world", "_id" : ObjectId("50c5f63780ebe8585f000001") }
    { "_id" : 1, "hello" : "world" }

So what happened here. The first insert command worked as expected and our document was saved in the database with the ``_id`` set to ``1`` as we expected. When the second insert was tried however it failed and we got the message that the document with that ``_id`` already exists. Since ``_id`` needs to be unique that is as expected.

One thing to remember is that the ``_id`` can be any ``BSON`` type including a binary which is used to for example use global unique identifiers called ``UUID's`` (read more at http://en.wikipedia.org/wiki/Universally_unique_identifier about UUID). This can be quite useful as we mentioned above for some specific scenarios. But for this book we will stick to the plain vanilla ``ObjectId`` or ``ObjectID`` as its nown in the Node.js driver.

Bulk Inserts
------------

So this is quite good, we can easily insert a document. So what if we want to insert 100 documents. The first thought might be something like the code below. Enter it an run it.

.. literalinclude:: ex/ex14.js
    :language: javascript
    :linenos:

Let's check that the documents made it to the database. Notice that we changed the name of the collection.

.. code-block:: console

    ~ $ mongo
    MongoDB shell version: 2.2
    connecting to: test    
    > use test
    switched to db test
    > show collections
    mycountingdocuments
    mydocuments
    system.indexes
    > db.mycountingdocuments.find().pretty()
    { "i" : 0, "_id" : ObjectId("50c5fb4ad2950cbd5f000001") }
    { "i" : 1, "_id" : ObjectId("50c5fb4ad2950cbd5f000002") }
    { "i" : 5, "_id" : ObjectId("50c5fb4ad2950cbd5f000006") }
    { "i" : 3, "_id" : ObjectId("50c5fb4ad2950cbd5f000004") }
    { "i" : 4, "_id" : ObjectId("50c5fb4ad2950cbd5f000005") }
    { "i" : 2, "_id" : ObjectId("50c5fb4ad2950cbd5f000003") }
    { "i" : 9, "_id" : ObjectId("50c5fb4ad2950cbd5f00000a") }
    { "i" : 8, "_id" : ObjectId("50c5fb4ad2950cbd5f000009") }
    { "i" : 6, "_id" : ObjectId("50c5fb4ad2950cbd5f000007") }
    { "i" : 7, "_id" : ObjectId("50c5fb4ad2950cbd5f000008") }
    { "i" : 10, "_id" : ObjectId("50c5fb4ad2950cbd5f00000b") }
    { "i" : 11, "_id" : ObjectId("50c5fb4ad2950cbd5f00000c") }
    { "i" : 12, "_id" : ObjectId("50c5fb4ad2950cbd5f00000d") }
    { "i" : 13, "_id" : ObjectId("50c5fb4ad2950cbd5f00000e") }
    { "i" : 14, "_id" : ObjectId("50c5fb4ad2950cbd5f00000f") }
    { "i" : 15, "_id" : ObjectId("50c5fb4ad2950cbd5f000010") }
    { "i" : 16, "_id" : ObjectId("50c5fb4ad2950cbd5f000011") }
    { "i" : 17, "_id" : ObjectId("50c5fb4ad2950cbd5f000012") }
    { "i" : 18, "_id" : ObjectId("50c5fb4ad2950cbd5f000013") }
    { "i" : 19, "_id" : ObjectId("50c5fb4ad2950cbd5f000014") }
    Type "it" for more
    > db.mycountingdocuments.count()
    100

As you can see we have inserted 100 documents into the database as expected. But surely there must be a better way to bulk insert documents than issuing 100 seperate insert commands. Luckily there is. MongoDB support bulk inserts. In fact the bulk insert command sent to the server is a single message. There is a limit on how much data you can send in a single bulk insert. For now the drivers enforce a 16MB limit. With this information let's rewrite the example to do the insert as a bulk insert.

.. literalinclude:: ex/ex15.js
    :language: javascript
    :linenos:

Before running the code let's cleanup the collection to ensure we don't have any existing documents in the collection. Fire up the console and do the following to remove all the documents.

.. code-block:: console

    ~ $ mongo
    MongoDB shell version: 2.2
    connecting to: test    
    > use test
    switched to db test
    > show collections
    mycountingdocuments
    mydocuments
    system.indexes
    > db.mycountingdocuments.remove()
    > db.mycountingdocuments.count()
    0

Run the example above and verify that all the documents made it to the collection on MongoDB.

.. code-block:: console

    ~ $ mongo
    MongoDB shell version: 2.2
    connecting to: test    
    > use test
    switched to db test
    > show collections
    mycountingdocuments
    mydocuments
    system.indexes
    > db.mycountingdocuments.find().pretty()
    { "i" : 0, "_id" : ObjectId("50c5fb4ad2950cbd5f000001") }
    { "i" : 1, "_id" : ObjectId("50c5fb4ad2950cbd5f000002") }
    { "i" : 5, "_id" : ObjectId("50c5fb4ad2950cbd5f000006") }
    { "i" : 3, "_id" : ObjectId("50c5fb4ad2950cbd5f000004") }
    { "i" : 4, "_id" : ObjectId("50c5fb4ad2950cbd5f000005") }
    { "i" : 2, "_id" : ObjectId("50c5fb4ad2950cbd5f000003") }
    { "i" : 9, "_id" : ObjectId("50c5fb4ad2950cbd5f00000a") }
    { "i" : 8, "_id" : ObjectId("50c5fb4ad2950cbd5f000009") }
    { "i" : 6, "_id" : ObjectId("50c5fb4ad2950cbd5f000007") }
    { "i" : 7, "_id" : ObjectId("50c5fb4ad2950cbd5f000008") }
    { "i" : 10, "_id" : ObjectId("50c5fb4ad2950cbd5f00000b") }
    { "i" : 11, "_id" : ObjectId("50c5fb4ad2950cbd5f00000c") }
    { "i" : 12, "_id" : ObjectId("50c5fb4ad2950cbd5f00000d") }
    { "i" : 13, "_id" : ObjectId("50c5fb4ad2950cbd5f00000e") }
    { "i" : 14, "_id" : ObjectId("50c5fb4ad2950cbd5f00000f") }
    { "i" : 15, "_id" : ObjectId("50c5fb4ad2950cbd5f000010") }
    { "i" : 16, "_id" : ObjectId("50c5fb4ad2950cbd5f000011") }
    { "i" : 17, "_id" : ObjectId("50c5fb4ad2950cbd5f000012") }
    { "i" : 18, "_id" : ObjectId("50c5fb4ad2950cbd5f000013") }
    { "i" : 19, "_id" : ObjectId("50c5fb4ad2950cbd5f000014") }
    Type "it" for more
    > db.mycountingdocuments.count()
    100

Awesome not hard right. Well what happens if there is a document with an error inbetween the ``100`` documents we plan to insert. Well let's try it and see what happens. Enter the example below. Before running it clear out the collection as previously shown. When you run it you should see the following output.

.. code-block:: console

    connected to database
    failed to perform bulk insert due to multiple documents havin the same _id field

.. literalinclude:: ex/ex16.js
    :language: javascript
    :linenos:

Ok we got an error from MongoDB but what happened in the database. Did it finish inserting the documents or did it stop. Let's have a look in the db.

    ~ $ mongo
    MongoDB shell version: 2.2
    connecting to: test    
    > use test
    switched to db test
    > show collections
    mycountingdocuments
    mydocuments
    system.indexes
    > db.mycountingdocuments.find().pretty()
    { "_id" : 1000 }
    { "_id" : 1001 }

As we can see MongoDB kept accepting the documents until we hit the document with the duplicate ``_id`` value and then stopped and returned an error. But what if we want to make the inserts continue even if there is an error. Well it's also possible. Clear out the db, enter the code below and run it.

.. literalinclude:: ex/ex17.js
    :language: javascript
    :linenos:

Notice that we get the same ouput as the following example but let's have a look at what's in MongoDB now.

    ~ $ mongo
    MongoDB shell version: 2.2
    connecting to: test    
    > use test
    switched to db test
    > show collections
    mycountingdocuments
    mydocuments
    system.indexes
    > db.mycountingdocuments.find().pretty()
    { "_id" : 1000 }
    { "_id" : 1001 }
    { "_id" : 1002 }

As we can see MongoDB did not stop inserting on the error but kept going inserting all the valid documents it could find. However one problem is that MongoDB is not currently able to tell us what specific document failed to insert so we need to programatically in our code. Let's see how we can identify what documents had the same ``_id`` variable below. Clean out the collection, then enter and run the code below.

.. literalinclude:: ex/ex18.js
    :language: javascript
    :linenos:

This code is a bit complicated but the basic explanation is that after we try to do the bulk insert and it fails we retrieve all documents which has a ``_id`` value equal to the documents we were trying to insert. We then create a hashmap of the ``_id`` where each value is set to true. Iterating through our original documents if we find it in the hashmap we set the hashmap value to false indicating it's been seen by the application. Any other document in the ``documents`` array will then trigger the condition ``!docHash[documents[i]._id]`` that will save the index in the ``documents`` array to the ``docsNotFound`` array. The ``docsNotFound`` array will contain all the indexes of the documents that failed to insert during the bulk insert.

You might wonder what the ``$in`` means and we will get into that in a later exercise. Sufficient to say for now that it's a asking MongoDB to return all documents where ``_id`` is in the list of ``_id's`` in the ``ids`` array.

One thing to note is that you might get a duplicate key error on another field in your document, how to resolve this issue I leave as an exercise for you to figure out.

Save
----

If you've looked at the documentation for the driver you might have noticed there is a ``save`` function on the ``collection`` object. From the beginning this might look like a resonable method to use to save your document. If this document already exists (it matches it by the ``_id``) it will replace the entire document. We will go through why this is non optimial later when we talk about updates but I'll give you a hint. Why replace the whole document if you only want to change a single field ? There are some other side effects of full document replacement that we will highlight later.

But for now let's move on to the next exercise which is about one of the most interesting features of MongoDB the ability to specify the durability concern for your application.












