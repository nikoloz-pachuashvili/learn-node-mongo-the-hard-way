// Helper method to make simple getter / setter
var simple_setter_getter = function(object, fields, name) {  
  Object.defineProperty(object, name, { enumerable: true
    , get: function () { return fields[name]; }
    , set: function (value) { fields[name] = value; }
  });
}

// An Author entity
var Author = function(_name, _books) {
  var fields = {
      name: _name
    , books: _books || []
  }

  this.addBook = function(book) {
    fields.books.push(book);
  }

  simple_setter_getter(this, fields, "name");
  simple_setter_getter(this, fields, "books");
}

// A Published entity
var Publisher = function(_name, _books) {
  var fields = {
      name: _name
    , books: _books || []
  }

  this.addBook = function(book) {
    fields.books.push(book);
  }

  simple_setter_getter(this, fields, "name");
  simple_setter_getter(this, fields, "books");
}

// A Book entity
var Book = function(_isbn, _title, _published_date, _authors, _publisher) {  
  var fields = {
      isbn: _isbn
    , title: _title
    , published_date: _published_date
    , authors: _authors || []
    , publisher: _publisher
  }

  this.addAuthor = function(author) {
    fields.authors.push(author);
  }

  simple_setter_getter(this, fields, "title");
  simple_setter_getter(this, fields, "isbn");
  simple_setter_getter(this, fields, "authors");
  simple_setter_getter(this, fields, "publisher");
}

// Create a publisher
var publisher = new Author("Maxwell Books");
// Create the first author and book
var author1 = new Author("James");
var book1 = new Book("1", "Wizard", new Date());

// Add the author to the book
book1.addAuthor(author1);
// Add the book to the author
author1.addBook(book1);
// Add the publisher to the book
book1.publisher = publisher;
// Add the book to the publisher
publisher.addBook(book1);

// Create second author and book
var author2 = new Author("Peter");
var book2 = new Book("2", "Space war", new Date(), [], null);

// Add the author to the book
book2.addAuthor(author2);
// Add the book to the author
author2.addBook(book1);
// Add the publisher to the book
book2.publisher = publisher;
// Add the book to the publisher
publisher.addBook(book2);


