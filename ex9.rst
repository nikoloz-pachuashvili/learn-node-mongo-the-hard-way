Exercise 9: Update Basics
=========================

In the previous exercises we learned how to insert document into MongoDB and what a write concern is. We also learned why ``.save()`` is not a good way of saving your documents and how bulk inserts work. We've managed to get all those documents into MongoDB but now we find we need to update some of the fields. In this exercise we will focus on the basic operations to change your documents in MongoDB and in the next exercise on the more advanced ways to modify your existing documents.

Lets start with a simple insert and full document update and explain why this in general is a bad idea. Fire up the editor and type in the following code.

.. literalinclude:: ex/ex22.js
    :language: javascript
    :linenos:

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



