Exercise 3: Async programming introduction
==========================================
There are several pitfalls that are worth understanding before we get started
exploring the driver and **MongoDB** in general. This have to do with the
essential differences between synchronous and asynchronous programming. It's
best served by some examples. For the rest of the exercises we will assume that
you understand how to enter code using the editor for your system.

Lets take a simple application that fetches a twitter feed a couple of thousand
times. But before we start let's install another **npm package** that simplifies
the fetching of web pages. This module is called **request**. Perform the following
tasks to install it and then lets get one with some coding. 

Mac OSX
-------
1.  Start up the **Terminal** application.
2.  Go to the directory **learn-exercises** we created in **exercise 0**.
3.  Install the **request** package using **NPM**

    ```console
        ~ $ npm install request
        npm http GET https://registry.npmjs.org/request
        npm http 200 https://registry.npmjs.org/request
        npm http GET https://registry.npmjs.org/request/-/request-2.12.0.tgz
        npm http 200 https://registry.npmjs.org/request/-/request-2.12.0.tgz
        request@2.12.0 node_modules/request        
    ```

4.  Bring up **TextWrangler** and enter the script below

    ```js{"file":"/code/ex3/ex1.js","indent":4}
    ```

    Save it as the file **ex1.js** in the directory **learn-exercises**

5.  From the terminal execute the script **ex1.js**

    ```console
        ~ $ node ex1.js
        DONE
        Retrieved the web page
        Retrieved the web page
        Retrieved the web page
        Retrieved the web page
        Retrieved the web page
        Retrieved the web page
        Retrieved the web page
        Retrieved the web page
        (node) warning: possible EventEmitter memory leak detected. 11 listeners added. 
        Use emitter.setMaxListeners() to increase limit.
        Trace
            at Socket.EventEmitter.addListener (events.js:175:15)
            at Socket.EventEmitter.once (events.js:196:8)
            at ClientRequest.<anonymous> 
            (/Users/ck/coding/projects/learnexercises/node_modules/request/main.js:521:27)
            at ClientRequest.g (events.js:192:14)
            at ClientRequest.EventEmitter.emit (events.js:96:17)
            at HTTPParser.parserOnIncomingClient [as onIncoming] (http.js:1462:7)
            at HTTPParser.parserOnHeadersComplete [as onHeadersComplete] (http.js:111:23)
            at Socket.socketOnData [as ondata] (http.js:1367:20)
            at TCP.onread (net.js:403:27)
        (node) warning: possible EventEmitter memory leak detected. 11 listeners added. 
        Use emitter.setMaxListeners() to increase limit.
        
        Looking at the output from our little program notice that the first line **DONE**
        was the last line in our program. This shows one of the main pitfals most developers
        fall into when they start using **Node.js** and merits a more profound explanation
        and then an example on how to avoid this.
    ```

Asynchronous Programming
------------------------

The traditional way a programming language works is by stopping when we do an operation that requires the program to talk to things like your hard disk or a server on a network until they answer. If you wrote the example above in **ruby** or **python** it would process each fetch one after the other and once it had finished it would print **DONE**.

But in **Node.JS** any operation that wants to communicate with a hard disk or server
returns at once and the results are then returned to the program in an callback. So 
when the program runs all the requests to fetch the google homepage starts at the same
time and as each is finished the function containing the **console.log** statement is
triggered. Since they all get started at the same time **Node.js** complains that we
might have a memory leak. If we start enough of these requests it will schedule retrivals
of the google homepage until our program runs out of memory and crashes.

But this can be easily fixed. Let's enter it. Write the code and save it as **ex2.js**

```js{"file":"code/ex3/ex2.js"}
```

Did I say easily. Hmm maybe not easily. Let's do a review of the code and look at what it
means. The function **load10AtATime** has a **callback** function. This function will only be
called once the 10 requests have completed. To ensure that all the requests have completed
we have a count down variable called **counter** that is only decremented once the result
is returned from the request. Once **counter** reaches **0** we call the function **callback**
signaling that we have finished fetching the 10 copies of the google homepage. This function
thus takes care of loading 10 pages at a time in parallel.

Calling **load10AtATime** is the function **loadBatches**. This function is a recursive function that calls itself 10 times until **numberOfBatches** is 0 and for each time it calls the **load10AtATime** function and waits for it to return before executing the next batch. Once **numberOfBatches** reaches **0** it calls the callback function to return to the original caller.

Finally the last part of the code just starts the batch loading by calling it **loadBatches` with a start value of **10** and waits for it to finish before printing it out to the console.

One problem with this code is that if the number of batches is to high you can run out of stack meaning the application will crash. A better way to handle this recurssion is to use a method called **process.nextTick**. Below is an example of the code will look when using **process.nextTick**.

```js{"file":"code/ex3/ex3.js"}
```
 
**process.nextTick** schedules the function call for the next tick in the eventloop of Node.js. This happens with a new stack allowing us to avoid running out of stack and crashing if we have are loading to many batches in one go. There is another technique called a **trampolining** that can do the same but this is left to you to investigate. The main issue is the lack of tail recurrsion. You can read more about it at http://en.wikipedia org/wiki/Tail_call including **trampolining**. That said I prefer to use **process.nextTick** because it schedules the function call in the eventloop of Node.js letting other code run inbetween.

I also recommend using some of the excellent libraries for asynchronous programming for Node.js. Let's see how we can accomplish the same using the **async** npm module. First install the npm module doing

    ```console
    npm install async
    ```

Then fire up the text editor of your choice and enter the following example.

```js{"file":"code/ex3/ex4.js"}
```

Let's have a quick look at the code. The **async.whilst** method takes three functions. The first function is the **while** statement that tells **whilst** to keep running until the returned value from the first function is **false**. The second function is the actual work being done in each pass through the **while**. Once the program is done with it's work it calls the callback and the loop repeats. When the first function returns false **whilst** calls the last function with the final result. The second function is the same as the previous code example.

<div class="note">
    <div class="note_title">Note</div>
    <div class="note_body">
        Grasping the fundamentals about asynchronous programming is important to the correct behaviour of you applications and also to leverage the high concurrency available in Node.js. Don't worry if you don't grasp it the first time around it can take a while to get used to it especially if you come from another programming platform that is synchronous like ruby, python, perl or php.
        <p/>
        It's worth spending some time practicing it or understanding how the <strong>async</strong> library works.
    </div>
</div>

