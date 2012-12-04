Exercise 2: Async programming introduction
==========================================

There are several pitfals that are worth understanding before we get started
exploring the driver and ``MongoDB`` in general. This have to do with the
essential differences between synchronous and asynchronous programming. It's
best served by some examples. For the rest of the exercises we will assume that
you understand how to enter code using the editor for your system.

Lets take a simple application that fetches a twitter feed a couple of thousand
times. But before we start let's install another ``npm package`` that simplifies
the fetching of web pages. This module is called ``request``. Perform the following
tasks to install it and then lets get one with some coding. 

Mac OSX
-------
1.  Start up the ``Terminal`` application.
2.  Go to the directory ``learn-exercises`` we created in ``exercise 0``.
3.  Install the ``request`` package using ``NPM``

    .. code-block:: console

        ~ $ npm install request
        npm http GET https://registry.npmjs.org/request
        npm http 200 https://registry.npmjs.org/request
        npm http GET https://registry.npmjs.org/request/-/request-2.12.0.tgz
        npm http 200 https://registry.npmjs.org/request/-/request-2.12.0.tgz
        request@2.12.0 node_modules/request        

4.  Bring up ``TextWrangler`` and enter the script below

    .. literalinclude:: ex/ex1.js
        :language: javascript
        :linenos:

    Save it as the file ``ex1.js`` in the directory ``learn-exercises``
5.  From the terminal execute the script ``ex1.js``

    .. code-block:: console

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
        (node) warning: possible EventEmitter memory leak detected. 11 listeners added. Use emitter.setMaxListeners() to increase limit.
        Trace
            at Socket.EventEmitter.addListener (events.js:175:15)
            at Socket.EventEmitter.once (events.js:196:8)
            at ClientRequest.<anonymous> (/Users/ck/coding/projects/learnexercises/node_modules/request/main.js:521:27)
            at ClientRequest.g (events.js:192:14)
            at ClientRequest.EventEmitter.emit (events.js:96:17)
            at HTTPParser.parserOnIncomingClient [as onIncoming] (http.js:1462:7)
            at HTTPParser.parserOnHeadersComplete [as onHeadersComplete] (http.js:111:23)
            at Socket.socketOnData [as ondata] (http.js:1367:20)
            at TCP.onread (net.js:403:27)
        (node) warning: possible EventEmitter memory leak detected. 11 listeners added. Use emitter.setMaxListeners() to increase limit.
        
        Looking at the output from our little program notice that the first line ``DONE``
        was the last line in our program. This shows one of the main pitfals most developers
        fall into when they start using ``Node.js`` and merits a more profound explanation
        and then an example on how to avoid this.

Asynchronous Programming
------------------------

The traditional way a programming language works is by stopping when we do an operation
that requires the program to talk to things like your hard disk or a server on a network
until they answer. If you wrote the example above in ``ruby`` or ``python`` it would
process each fetch one after the other and once it had finished it would print ``DONE``.

But in ``Node.JS`` any operation that wants to communicate with a hard disk or server
returns at once and the results are then returned to the program in an callback. So 
when the program runs all the requests to fetch the google homepage starts at the same
time and as each is finished the function containing the ``console.log`` statement is
triggered. Since they all get started at the same time ``Node.js`` complains that we
might have a memory leak. If we start enough of these requests it will schedule retrivals
of the google homepage until our program runs out of memory and crashes.

But this can be easily fixed. Let's enter it. Write the code and save it as ``ex2.js``

.. literalinclude:: ex/ex2.js
    :language: javascript
    :linenos:



