Exercise 12: FindAndModify
==========================

In exercise 10 we introduced the **$pop** command that removes an element from the start or the end of an array in a document. Unfortunately it does not return the actual element. What if we need to modify and retrieve a document in one go ? Thankfully we have a command called **findAndModify** that allows you to do exactly that. 

The findAndModify Command
-------------------------
The definition of the method looks like **findAndModify (query, sort, doc, options, callback)**. Let's have a look at what the different parameters mean.

Parameter       | Description
----------------|------------
query           | The query matching to the document we wish to change
sort            | The sort order of the documents returned from the query
doc             | The update statements for the first document returned from the query and sort
options         | A set of options that allow us to define how the operation will behave

Let's look at the options that we use to define how our **findAndModify** command will operate.

Parameter       | Description
----------------|------------
remove          | Will remove the document from the collection and return it
upsert          | Will create a new document if none is found to modify
new             | Will return the modified document (if false will return the original document before changes. This is ignored if you set remove to true)

Let's start with the simplest example. We will insert four documents into a collection we call work and then retrieve the highest priority document where work has not been started.

```js{"file":"/code/ex12/ex1.js","indent":4}
```

Execute the code and you should see the following results.

```console
    connected to database
    changed document
    { _id: 3,
      done: false,
      endTime: null,
      priority: 1000,
      startTime: Thu Jan 24 2013 11:47:22 GMT+0100 (CET),
      started: true,
      title: 'Play DOOM' }
    all documents
    [ { _id: 1,
        title: 'Buy milk',
        priority: 5,
        started: false,
        done: false,
        startTime: null,
        endTime: null },
      { _id: 2,
        title: 'Become a Billionaire',
        priority: 1,
        started: false,
        done: false,
        startTime: null,
        endTime: null },
      { _id: 3,
        done: false,
        endTime: null,
        priority: 1000,
        startTime: Thu Jan 24 2013 11:47:22 GMT+0100 (CET),
        started: true,
        title: 'Play DOOM' } ]
```

Let's look at the code we just entered, more specifically the line.

```console
      collection.findAndModify(
          {started:false}
        , {priority:-1}
        , {$set: {started:true, startTime:new Date()}}
        , {new:true}, function(err, doc) {
      });    
```

Let's break down the **findAndModify** operation we did above.

Parameter  | Statement                                     | Description
-----------|-----------------------------------------------|------------
query      | {started:false}                               | Locate all the documents where the field started equals false
sort       | {priority:-1}                                 | Sort the documents in descending order (highest priority ones first, meaning the first one will be the one with the biggest priority)
doc        | {$set: {started:true, startTime:new Date()}}  | If we find a document set started to true and assign a start time
options    | {new:true}                                    | Return the changed document

From the breakdown we can see that we will modify the document with the highest priority where work has not started. Since **findAndModify** is an **atomic** command it means that nobody else can modify the document while it's executing on the server. We are using this property in this example to model a queue of work where only one **worker** works on a given task at a time. In a later exercise we will leverage this property to build a work queue and also a shopping cart.

Now let's assume we've finished performing the work and need to remove the document from the list of work (maybe to insert into a history collection of work done). Let's modify the code a little bit to do this. Notice that when using the **remove** option we are not able to modify the document so this has to happen be done in code.

```js{"file":"/code/ex12/ex2.js","indent":4}
```

The results should look like this.

```console
    connected to database
    changed document
    { _id: 3,
      done: false,
      endTime: null,
      priority: 1000,
      startTime: Thu Jan 24 2013 12:32:50 GMT+0100 (CET),
      started: true,
      title: 'Play DOOM' }
    all documents
    [ { _id: 1,
        title: 'Buy milk',
        priority: 5,
        started: false,
        done: false,
        startTime: null,
        endTime: null },
      { _id: 2,
        title: 'Become a Billionaire',
        priority: 1,
        started: false,
        done: false,
        startTime: null,
        endTime: null },
      { _id: 3,
        done: false,
        endTime: null,
        priority: 1000,
        startTime: Thu Jan 24 2013 12:32:50 GMT+0100 (CET),
        started: true,
        title: 'Play DOOM' } ]
    removed document
    { _id: 3,
      done: false,
      endTime: null,
      priority: 1000,
      startTime: Thu Jan 24 2013 12:32:50 GMT+0100 (CET),
      started: true,
      title: 'Play DOOM' }
    all documents
    [ { _id: 1,
        title: 'Buy milk',
        priority: 5,
        started: false,
        done: false,
        startTime: null,
        endTime: null },
      { _id: 2,
        title: 'Become a Billionaire',
        priority: 1,
        started: false,
        done: false,
        startTime: null,
        endTime: null } ]    
```

For the remove option of **findAndModify** you can use a special version of it on the **collection** called **findAndRemove** that just removes the **update** section of the **findAndModify** command. If you do want to perform removes I recommend using this method to avoid the confusion of **remove** not allowing modifications of the document.

You might have noticed that there is an **upsert** option for the **findAndModify** command. This works exactly as the **upsert** for the **update** command but of course let's you return the document. Let's take a look at a simple example using it.

```js{"file":"/code/ex12/ex3.js","indent":4}
```

You should see the following when executing the code.

```console
    connected to database
    added document
    { _id: 51011f910ac025483df1af06,
      startTime: Thu Jan 24 2013 12:48:33 GMT+0100 (CET),
      started: true }
    all documents
    [ { _id: 51011f910ac025483df1af06,
        startTime: Thu Jan 24 2013 12:48:33 GMT+0100 (CET),
        started: true } ]
```

This pretty much covers the **findAndModify** and **findAndRemove** commands.

<div class="note">
    <div class="note_title">Note</div>
    <div class="note_body">
	    It might be tempting to use <strong>findAndModify</strong> everywhere you would typically use an update. You should avoid this temptation and use it only when appropriate as it takes out a write lock for the duration of the operation potentially slowing down all the other write operations in the affected database. Most of the time you might discover that you do not in fact need the returned the document and that the operation can be better described as a query and update operation. 
	    <p/>
	    Use <strong>findAndModify</strong> when you have to ensure that only a single operation can modify the document in question. The example above with the work queue is a good candidate for the usage of <strong>findAndModify</strong> and in later exercises we will look at some more concrete examples that are good fits.
    </div>
</div>




