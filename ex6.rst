{% import "macros/ork.jinja" as ork with context %}
Exercise 6: Databases and Collections
=====================================

MongoDB has is build around 3 main concepts. One or more ``db's`` that contain one or more ``collections`` that contain one or more ``documents``. So how do we get hold of a ``collection``? Time for some code entry.

.. literalinclude:: ex/ex9.js
    :language: javascript
    :linenos:

The example shows how to use the ``MongoClient.connect`` method to fetch a connection to a database directly. The ``connect`` method actually returns a database object. If we want to use other databases we can call the ``.db()`` method on the ``db`` object returned by the ``MongoClient.connect`` method. Notice that we don't need a new callback, this is because the ``.db()`` method does not open a new connection but reuses the existing connections that was created during the ``MongoClient.connect`` call.

So what is the ``.admin()`` method. Some administrative commands must be run against a special database called ``admin``. To make the it a little bit easier I created an ``.admin()`` method that returns an instance of the ``Admin`` class with helper methods to make it easier to use the administrative commands available.

The other main usage of the ``admin()`` database is for storing user credentials as a server level. Don't worry we will touch on this later as for now it's a more advanced topic than we need to be concerned about.

After having fetched the new dbs ``myotherdb`` and ``admin`` we want to grab some collections to do some work on. This is done by calling ``db.collection()`` that returns a ``Collection`` object helper methods to help us do work on the collection. The reason we don't need to use a callback function here is that ``.collection()`` does not actually call out to the database to create a collection. This happens automatically when we save the first document to MongoDB. MongoDB will create a default collection with the name we passed into the ``.collection()`` method and save the document to it.

Capped Collections
------------------

However this might not always be what we want. MongoDB has two types of collection types available. The first one we will refer to as the ``standard`` collection type and the second as the ``capped collection`` type. The ``capped collection`` type is quite a different beast from the ``standard`` collection type. It's of a fixed size (you have to specify the size of the intial collection in bytes) and you can set a max number of documents it can store. It's als a FIFO (First in first out) queue which means that when it reaches the end of the space it will wrap around. Other limitiations are that you cannot add fields to an existing document and you cannot delete them.

This might sound like a lot of limitiations but the FIFO property and the semantics of operations are actually really good if you want to limit the amount of data stored or don't care if data is overwritten after awhile.

So how do we create a ``capped collection`` instead of a ``standard`` collection ? Let's explore some code, typing it up in your editor.

.. literalinclude:: ex/ex10.js
    :language: javascript
    :linenos:

Notice the ``db.createCollection()`` method we are using. This is a method specifically made to allow us to create collections that are not ``standard`` collections. In this code example we are creating a ``capped collection`` with a size of ``100000`` bytes and holding a maximum of ``100`` documents before it starts overwritting them. The options we can pass in to the ``db.createCollection`` for a capped collection are.

* ``capped``: (true/false), specified that this is a capped (FIFO) collection
* ``size``: (a number of bytes larger than 0), specifies the maximum size in bytes of the capped collection.
* ``max``: (a number larger than 0), specifies the maximum number of documents that can be stored in the collection before the collection starts overwritten old documents.

Time to live collections (TTL)
------------------------------

From MongoDB 2.2 onwards there is a new type of collection called a ``TTL`` collection. It's a bit of a misdemeaner to call it a type of collections as it's actually a ``standard`` collection with a special type to live ``index`` on a date fields that automatically removes documents that are older than the time specified for the ``TTL index``. It's a very useful when want only to store data for a specified time period. Say we only want to keep 48 hours of log data in a collection. With ``TTL`` you can set the time of expiry to be 48 hours and documents will be removed when they are older than 48 hours. Code is a thousand words so fire up your editor and enter the code below.

.. literalinclude:: ex/ex11.js
    :language: javascript
    :linenos:

Notice the ``collection.ensureIndex()`` method. We will go deeper into how indexes work and how the Node.js driver can create them in a later exercise. The point to notice here is that the ``TTL`` collection needs an index on a data field to work correctly and that the ``expireAfterSeconds`` parameter is in seconds.

.. NOTE::
    One particular note to be made about ``TTL`` collections is that the expiry time is not a hard expiry time. What's meant by hard. Well it means that even if a document is exactly 48 hours old it might not be removed at exactly 48 hours but some time after that when MongoDB has free resources to remove the document. Also due to the fact that ``TTL`` collections need to remove documents from a collection ``TTL`` does not work with ``capped collections`` so keep that in mind.



