Exercise 3: Numbers And Math
============================

Every programming language has some kind of way of doing numbers and
math. Do not worry, programmers lie frequently about being math geniuses
when they really aren't. If they were math geniuses, they would be doing
math, not writing ads and social network games to steal people's money.

This exercise has lots of math symbols. Let's name them right away so
you know what they are called. As you type this one in, say the names.
When saying them feels boring you can stop saying them. Here are the
names:

::

    + plus
    - minus
    / slash
    * asterisk
    % percent
    < less-than
    > greater-than
    <= less-than-equal
    >= greater-than-equal

Notice how the operations are missing? After you type in the code for
this exercise, go back and figure out what each of these does and
complete the table. For example, ``+`` does addition.

.. literalinclude:: ex/ex3.rb
    :language: ruby
    :linenos:

What You Should See
-------------------

.. code-block:: console

    $ ruby ex3.rb 
    I will now count my chickens:
    Hens 
    30
    Roosters 
    97
    Now I will count the eggs: 
    7
    Is it true that 3 + 2 < 5 - 7?
    false
    What is 3 + 2? 
    5
    What is 5 - 7? 
    -2
    Oh, that's why it's false. 
    How about some more.
    Is it greater? 
    true
    Is it greater or equal? 
    true
    Is it less or equal? 
    false
    $

Extra Credit
------------

1. Above each line, use the ``#`` to write a comment to yourself
   explaining what the line does.
2. Remember in Exercise 0 when you started IRB? Start IRB this way again
   and using the above characters and what you know, use Ruby as a
   calculator.
3. Find something you need to calculate and write a new ``.rb`` file
   that does it.
4. Notice the math seems "wrong"? There are no fractions, only whole
   numbers. Find out why by researching what a "floating point" number
   is.
5. Rewrite ``ex3.rb`` to use floating point numbers so it's more
   accurate (hint: 20.0 is floating point).

