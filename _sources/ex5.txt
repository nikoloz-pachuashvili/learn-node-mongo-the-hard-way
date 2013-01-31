Exercise 5: Document documents everywhere
=========================================

So it's probably dawned on you that MongoDB is a document database. Moreover it's schemaless database. So what does that mean in layman terms. Let's start with a simple example of a ``JSON`` document.

.. code-block:: json

  {
    'name': 'MongoDB',
    'version': 2.2,
    'description': 'A schemaless document database',
    'features': ['schemaless', 'document oriented', 'fast', 'scalable'],
    'main developer': {
      name: '10gen',
      location: 'new york city'
    }
  }

As we can the document is made up of set of names and values ``'name': 'MongoDB'`` and we can see that we can express such concepts as a list of features and a ``JSON`` embedded document under the name ``main developer``. The possibilities on how to structure your data in documents is only limited by your imagination and the current 16MB limit for a single document.

MongoDB extends on ``JSON`` by adding types. This format is called ``BSON`` and is a binary representation of ``JSON`` with additonal types so the database can operate on them. These types can be summed up in a table (more details available at http://bsonspec.org/#/specification). We've only included the types that you will use from your application and ignored the ones that are internal data types or are not generally used in documents.

=========   ===========
Type        Description
=========   ===========
Long        A 64 bit integer value that can take the value of +/- 9,223,372,036,854,775,808
Date        A UTC Datetime value
Regexp      A regular expression
Code        A Javascript string with an option scope for the script
Binary      A Binary blob object (can have a subtype)
Double      A 64 bit float value (only use this if you have a whole number that you want stored as a double instead and not an integer)
=========   ===========

So how do we express a Document with all these special types in Node.js. Well fire up the text editor and let's get cracking on the code below.

.. literalinclude:: ex/ex8.js
    :language: javascript
    :linenos:

The ``serialize`` function is not a function you'll usually use in your programs but allows us to verify that the document is a valid ``BSON`` document by serializing it to it's binary representation. 

There are some interesting limitations in Javascript due to the way way numbers are represented in the language. All numbers are actually ``double floats`` which means that the highest number you can represent in Javascript is 53 bits of resolution or ``+/- 9,007,199,254,740,992`` which is significantly less than the ``Long`` type. This means that any ``Long`` values stored in MongoDB is returned as a ``Long`` instance instead of a ``Number`` instance. Since MongoDB can only store either 32 bit ints, 64 bit ints or 64 bit doubles the driver does intelligent conversion where possible. You can override this by doing ``new Double(1)`` to force it to store it as a 64 bit float instead of a 32 bit integer.

If we look a the second value in the document ``array of values`` we can see that it's an array composed of some numbers, a string and a document. This is a reflection of the flexibility of expression the document model gives you when modeling your applications data and one of the main reasons I think MongoDB is a blast of fresh air to traditional data modelling with relational tables.

The ``Binary`` type let's us store raw byte data in MongoDB. You can store such things as images or maybe binary files such as word documents or pdf's. However remember that a single document has a maximum size of 16MB. If you need to store Bigger files we will show you how in a later exercise using a driver feature called ``GridFS``.

The ``Code`` object is kind of interesting and is used to store actual Javascript code in MongoDB. You can even execute this code on the server if you store it in a special place (but this is not recommended as Javascript on the server is not very performant and comes with some fairly harsh limitations, more on that later).

The ``date`` value is a Javascript Date object and MongoDB has native support for dates so you can sort on them in the database. For the driver this shows the perfect match of MongoDB and Node.js since the date type is just the one that already comes pre-packaged with Javascript.

The next value ``regexp`` is a a regular expression that can also be stored in MongoDB. For pure documents it might not be so useful but because queries in MongoDB are actually ``BSON`` documents it means that MongoDB supports regular expressions in queries.

The last value ``_id`` is a special type in MongoDB that is a 12 bit unique identifier inside a collection. This type is the default primary key in a collection (the primary key in a document is alway the ``_id`` field in a document) and is made up of a timestamp + some additional fields and an incremental value. This gives it a great secondary property of being sortable by time allowing you to sort any record that just contains the ``_id`` field by it's creation time.

So as you can see we can store pure ``JSON`` objects but also more complex types that go beyond what Javascript supports natively. This matching makes MongoDB a great database for Node.js. As we will see in future exercises the match between MongoDB and Node.js can be leveraged to do some very interesting and unique things.

.. NOTE::
    Much of the power of MongoDB is locked in the design of your schema, how you design your data will impact the way you read and write the data and also the performance of you application. We will go more indepth on schema design in future exercises and look at benefits and tradeoffs associated with specific solutions.
