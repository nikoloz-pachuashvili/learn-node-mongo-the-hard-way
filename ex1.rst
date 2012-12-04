Exercise 1: The package manager 
===============================

Node.js has and outstanding amount of libraries available for usage
allowing you to reuse a massive collection of code written by other
programmers for your application. This tool is called the ``Node Package Manager``
or ``NPM`` for short. In this exercise we will learn the basics of using
``NPM`` to install some packages.

1.  Open the ``Terminal`` application and type

    .. code-block:: console

        ~ $ npm search mongodb
        mongodb           A node.js driver for MongoDB               =christkv             2012-12-03 17:
        mongodb-async     Thin & clean async wrapper for mongodb     =zir                  2012-10-26 17:
        mongodb-errors    Helper classes to deal with mongodb errors =mwawrusch            2012-11-25 03:

    The ``npm search text`` command lets you search for available modules that you can use 

2.  Go to the directory ``learn-exercises`` we created in ``exercise 0``.
3.  Let's install some packages that we will use in the exercises.

    .. code-block:: console

        ~ $ npm install mongodb
        npm http GET https://registry.npmjs.org/mongodb
        npm http 304 https://registry.npmjs.org/mongodb
        npm http GET https://registry.npmjs.org/bson/0.1.5
        npm http 304 https://registry.npmjs.org/bson/0.1.5

        > bson@0.1.5 install /Users/ck/coding/projects/learnexercises/node_modules/mongodb/node_modules/bson
        > node install.js || (exit 0)

        ================================================================================
        =                                                                              =
        =  Attempting to build bson c++ extension                                      =
        =   Windows: no build will be attempted as binaries are prepackaged            =
        =   Unix: on failure the package will still install without the C++ extension  =
        =                                                                              =
        ================================================================================
        node-gyp clean
        node-gyp configure build
          CXX(target) Release/obj.target/bson/ext/bson.o
          SOLINK_MODULE(target) Release/bson.node
          SOLINK_MODULE(target) Release/bson.node: Finished
        child process exited with code 0
        mongodb@1.2.2 node_modules/mongodb
        └── bson@0.1.5

    You should see something like the text above, if it's slightly different don't worry.
4.  ``NPM`` is has a lot of options for handling ``packages`` you can use ``npm help`` to
    read more about all options available. Also have a look at https://npmjs.org/ for a 
    great web interface to search for available packages.
5.  Notice that there is a new directory under ``learn-exercises`` called ``node_modules``
    this directory contains all the npm packages we install.