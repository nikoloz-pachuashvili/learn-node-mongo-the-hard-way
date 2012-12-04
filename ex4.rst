Exercise 4: Variables And Names
===============================

Now you can print things with ``puts`` and you can do math. The next
step is to learn about variables. In programming a variable is nothing
more than a name for something so you can use the name rather than the
something as you code. Programmers use these variable names to make
their code read more like English, and because they have lousy memories.
If they didn't use good names for things in their software, they'd get
lost when they tried to read their code again.

If you get stuck with this exercise, remember the tricks you have been
taught so far of finding differences and focusing on details:

1. Write a comment above each line explaining to yourself what it does
   in English.
2. Read your ``.rb`` file backwards.
3. Read your ``.rb`` file out loud saying even the characters.

.. literalinclude:: ex/ex4.rb
    :language: ruby
    :linenos:


.. note::

    The ``_`` in ``space_in_a_car`` is called an underscore
    character. Find out how to type it if you do not already know. We
    use this character a lot to put an imaginary space between words in
    variable names.

What You Should See
-------------------

.. code-block:: console

    $ ruby ex4.rb
    There are 100 cars available.
    There are only 30 drivers available.
    There will be 70 empty cars today.
    We can transport 120.0 people today.
    We have 90 passengers to carpool today.
    We need to put about 3 in each car.
    $

Extra Credit
------------

When I wrote this program the first time I had a mistake, and Ruby told
me about it like this:

::

    ex4.rb:8:in `<main>': undefined local variable or method `car_pool_capacity' for main:Object (NameError)

Explain this error in your own words. Make sure you use line numbers and
explain why.

Here's more extra credit:
-------------------------

1. I used 4.0 for ``space_in_a_car``, but is that necessary? What happens if it's
   just 4?
2. Remember that 4.0 is a "floating point" number. Find out what that
   means.
3. Write comments above each of the variable assignments.
4. Make sure you know what ``=`` is called (equals) and that it's making
   names for things.
5. Remember ``_`` is an underscore character.
6. Try running IRB as a calculator like you did before and use variable
   names to do your calculations. Popular variable names are also ``i``,
   ``x``, and ``j``.

