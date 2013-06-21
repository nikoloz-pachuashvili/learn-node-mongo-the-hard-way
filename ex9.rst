{% import "macros/ork.jinja" as ork with context %}
Exercise 9: Update Basics
=========================

In the previous exercises we learned how to insert documents into MongoDB and what a write concern is. We also learned why ``.save()`` is not a good way of saving your documents and how bulk inserts work. We've managed to get all those documents into MongoDB but now we find we need to update some of the fields. In this exercise we will focus on the basic operations to change your documents in MongoDB and in the next exercise on the more advanced ways to modify your existing documents.

Lets start with a simple insert and full document update and explain why this in general is a bad idea. Fire up the editor and type in the following code.

{{ ork.code('code/ex9/ex1.js|pyg') }}

We first insert a document with the values ``{_id: 1, a:1}`` then after it inserted we do an update statement

.. code-block:: javascript

    collection.update({_id:1}, {_id:1, b:1}, function(err, result) {

      db.close();
    });

The update statement is made up of two different objects. The first part is the query to match locate the document we wish to change ``{_id:1}`` and the second object is the way we wish to change the document. In this case we are passing in the document ``{_id:1, b:1}`` which will replace the existing document with the new one. Let's see what's in the database. Let's fire up mongo.

.. code-block:: console

    ~ $ mongo
    MongoDB shell version: 2.2
    connecting to: test
    > use test
    switched to db test
    > db.my_basic_update_documents.find()
    { "_id" : 1, "b" : 1 }

As we can see the whole document ``{_id: 1, a:1}`` was replaced. This can cause some issues. Imagine that there are several applications trying to modify the same document. Each ``update`` would overwrite any changes in the document meaning we would loose all changes but the last update. This is what the ``collection.save()`` function does. There is also a problem of efficiency. When we save the whole document we need to transfer the whole document to MongoDB even if we only want to change one field. This is less than optimial as we can imagine especially if we have a large document. Luckily we don't have to do that and we can also avoid the problem of overwritting any existing changes in a document. We do this using special operators called ``atomic`` operators.

Atomic Operators
----------------

Let's start with the basics of what an Atomic operator is. To do this let's imagine that we have a document that looks like this.

.. code-block:: json

    {
      "value" : 1
    }

Now let's imagine that two different applications wish to change the value by incrementing it by one. The end result should be ``3``. To make sure that ``value`` is incremented correctly we need to ensure that only one of the two applications can change the the ``value`` at any given time. Otherwise both applications might read the ``value`` to be incremented at the same time and increment it from ``1`` to ``2``. The property of ensuring only one application can change the value at a time is called an atomic operation. The second benefit of atomic operators is that we are changing are only sending the changes to MongoDB not the whole document so the amount of information that needs to be sent over the network is smaller and MongoDB can in most cases update the document where it is in memory without having to move the document to a new location on the Database.

So what kind of operators does MongoDB have that are atomic.

==============    ===========  ============================
Operator          Operates On  Description
==============    ===========  ============================
$set              Field        Set a particular field in the document
$unset            Field        Remove a particular field from the document
$inc              Field        Increments a numeric field by the provided value and sets it to the provided value if the field does not exist
$rename           Field        Renames a field or overwrites the existing field with the new field
$                 Array        Updates an element in an array field to update without specifiying the exact position. Acts as a placeholder for the first match.
$push             Array        Appends a value to an array, if the array does not exist it gets created.
$pushAll          Array        Works as $push but lets you push multiple values to the array
$addToSet         Array        Only adds the value to the array if it does not already exist
$pop              Array        Pop the last element off the array or shift the first element of the array
$pull             Array        Removes all instances of a value from an array
$pullAll          Array        Removes all instances of the list of values passed from an array
$bit              Bitwise      Perform a bitwise operation on a field, letting you do bitmapped files for compact storing of flags etc.
==============    ===========  ============================

Since ``atomic`` operations are only guaranteed for one of these operations at a time MongoDB also has a special operator called ``$isolated`` that will guarantee that multiple ``atomic`` operations in an update happen without changes being applied by other applications during it's execution.

That's a lot to take in so in this exercise we are going to just focus on the field and bitwise operators and leave the array operators for the next exercise.

$set/$unset Operators
---------------------

Let's have a look at the ``$set``. For this exercise we will also use a method called ``collection.findOne()`` to retrieve the document and allow us to print it out to see the changes instead of using the ``mongo`` console. Also notice that we are removing all the documents from the collection before starting using the ``collection.remove()`` method. Fire up the editor and enter the code below.

{{ ork.code('code/ex9/ex3.js|pyg') }}

Run the code in the console and you should see the following ouput

.. code-block:: console

    connected to database
    updated 1 number of documents
    { updatedExisting: true, n: 1, connectionId: 55, err: null, ok: 1 }
    { _id: 2, value: 2 }

Let's dissect the code we just ran. The ``collection.remove()`` function does what name implies. It removes all the documents in the collection. This is just done so it will be a bit easier to run the example multiple times as we can avoid the duplicate document errors. The next operation ``collection.insert()`` should be familiar by now. It inserts a document containing ``{_id:2, value:1}`` in the collection. The following operation is what we are interested in here. ``collection.update({_id: 2}, {$set: {value: 2}}, function(err, result) {})``. The first part of the ``update`` operation ``{_id: 2}`` matches the first document where ``_id: 2``. Note ``changes the first document matched``, if you have two documents with the same field you are matching on it will not change both just the first one it finds which which might not be consistent. In the next exercise we will explain how to do multi document updates. The second part of the update is the bread and butter of this exercise namely the ``atomic`` operator ``$set``. The statement ``{$set: {value: 2}}`` sets the ``value`` field of the matched document to 2.

Once the update operation has finished the callback happens and returns the result. Notice that we have 3 return parameters in this case. The first ``err`` is the normal error object, the second is the number of documents changed during the update and the last ``full_result`` contains the whole update result including a special field called ``updatedExisting`` that will contain the information if we updated an existing document or a new one was created. The secret of this field will be revealed in the next exercise.

Let's move on and look at $unset. Enter the following code in your editor and run it.

{{ ork.code('code/ex9/ex3.js|pyg') }}

Your console output should look something like.

.. code-block:: console

    connected to database
    updated 1 number of documents
    { updatedExisting: true, n: 1, connectionId: 75, err: null, ok: 1 }
    { _id: 2 }

The main difference from the previous example is that the second term of the update now reads like ``{$unset: {value: ""}}``, this removes the field ``value`` from the document. That's fairly straight forward.

$inc Operator
-------------

Let's move on to the ``$inc`` operator that lets us manipulate a numeric value. Fire up your editor and enter the code.

{{ ork.code('code/ex9/ex4.js|pyg') }}

Execute the code and your output should look something like.

.. code-block:: console

    connected to database
    updated 1 number of documents
    { updatedExisting: true, n: 1, connectionId: 85, err: null, ok: 1 }
    updated 1 number of documents
    { updatedExisting: true, n: 1, connectionId: 86, err: null, ok: 1 }
    { _id: 2, value: 2, value2: -5.1 }

The first update operation uses the update statement ``{$inc: {value: 1}}``, since the ``value`` field already exists it gets incremented by 1. The operation translates to ``new value = old value + increment value``. The second update statement creates the field ``value2`` as it does not already exist and sets it to ``-5.1``. Pretty cool we can now do such things as keeping count of items. Also note that ``$inc`` works with floating point values aswell as whole integers.

$bit Operator
-------------

Sweet let's touch on the last field operator before we show how we can apply multiple updates to a single document. The last field operator is the ``$bit`` operator. It's very useful for some situations. Imagine that you might want to store ``8`` different status flags. You could do it like this.

.. code-block:: console

    {
        flag1: true
      , flag2: true
      , flag3: true
      , flag4: true
      , flag5: true
      , flag6: true
      , flag7: true
      , flag8: true
    }

    or maybe like this

    {
      flags: [true, true, true, true, true, true, true, true]
    }

But they take up quite a bit of memory space. So say you want to save space and want to pack all the ``8`` flags into a single field. That's where bitwise operators come in (more information on bit fields at http://en.wikipedia.org/wiki/Bit_field). Let's fire up the editor and enter the code below. Don't worry if bitwise operations are a bit difficult to understand, consider it priming you brain with an idea you can exploit at some later point in the future.

{{ ork.code('code/ex9/ex5.js|pyg') }}

You should see the following output

.. code-block:: console

    connected to database
    { _id: 2, value: 17 }
    { _id: 2, value: 1 }

So what does this little example do. It first inserts a document with the field ``value`` set to 1. The first update applies the value ``0x10`` (hex value) against the field using the ``$bit`` operator and an ``or``. First lets we need to understand how ``or`` works. Let's look at the ``or`` table.

.. code-block:: console

        value: 0 0 1 1
     or value: 0 1 0 1
    ------------------
       result: 0 1 1 1

Basically if the bit position is not set it will be set if we ``or`` with a ``1`` while preserving existing flags.Let's see what happens to the value when we apply it.

.. code-block:: console

    existing value:   0 0 0 0  0 0 0 1
   or value (0x10):   0 0 0 1  0 0 0 0
   -----------------------------------
       final value:   0 0 0 1  0 0 0 1
         hex value:   0x11
     decimal value:   17

Cool we flipped a single bit positon to 1 which we consider to be the true value. What if we want to flip it back. Normally you would use an operation called ``xor`` to do this but as of now MongoDB does not support ``xor``. Luckily it does support an operation called ``and``. How does and work. Well let's look at the ``and`` table.

.. code-block:: console

        value: 0 0 1 1
    and value: 0 1 0 1
    ------------------
       result: 0 0 0 1

If we ``and`` a bit with the value ``1`` it will preserve the existing bit value. If we ``and`` it with ``0`` it will set the corresponding bit to ``0`` as well. This lets us flip a bit to ``0`` as long as all the bits in our value are set to ``1``. Let's see what happens when we apply the value.

.. code-block:: console

    existing value:   0 0 0 1  0 0 0 1
  and value (0xEF):   1 1 1 0  1 1 1 1
  ------------------------------------
       final value:   0 0 0 0  0 0 0 1
         hex value:   0x01
     decimal value:   1

Perfect we just flipped the value back to ``0`` setting our flag to ``false``. In short ``bit fields`` can be very useful to compress values into a smaller space in the database. As an example a ``32bit`` integer can contain ``32`` binary flags and will take up very little space in comparision to 32 indidvidual fields or 32 entries in an array.

$isolated or how I came to love the bomb
----------------------------------------

Let's start right off the bat in the editor, fire it up and enter the code below.

{{ ork.code('code/ex9/ex6.js|pyg') }}

Your output should look like.

.. code-block:: console

    connected to database
    { _id: 2, value: -4, value2: 'hello' }

So as you might have suspected you can make multiple changes on a document in a single update. However by default each operation is atomic by itself but not all of them together as MongoDB will let other update operations on the same document happen at the same time. What does that mean? Well easier said with an example. Say we have to updates executing at the same time.

.. code-block:: console

      initial document state: {value: 5}
     first update operations: $set: {value2: 'hello'} and $inc: {value: -5}
    second update operations: $inc: {value: -1}

    possible ordering of operations:
    -----------------------------------------
        first update: $set: {value2: 'hello'}
       second update: $inc: {value: -1}
        first update: $inc: {value: -5}

MongoDB will interleave the operations. In this particular this might cause a problem. Imagine if the matcher for the document is ``only update document if value > 0``. Since both of them match correctly but get intermixed the end value of ``value`` could potentially be ``-1`` not ``0`` as we expect.

To avoid this in the example above we use the ``$isolated`` operator as part of the update matching. This tells MongoDB to not let anyone else modify the document until the current operation is done and forces the ordering to look like.

.. code-block:: console

      initial document state: {value: 5}
     first update operations: $set: {value2: 'hello'} and $inc: {value: -5}
    second update operations: $inc: {value: -1}

    possible ordering of operations:
    ----------------------------------------------------------
        first update: $set: {value2: 'hello'}
        first update: $inc: {value: -5}
       second update: $inc: {value: -1} (failes as value is 0)

So as we can see ``$isolated`` can be quite useful. With this we are ready to take the tackle the next step of dealing with arrays when performing updates.

.. NOTE::

    You might be tempted to always use ``$isolated`` but you should not fall into this temptation. Only use it where appropriate as you are losing out on the benefit of concurrent writes to MongoDB forcing all updates to be serial. But keep it in mind when doing multiple field updates in a document if you are unsure something else could be changing the field while your application is executing a complex update.