// A Book entity
var Book = function(_isbn, _title, _published_date, _authors, _publisher, _reviews) {  
  var fields = {
      isbn: _isbn
    , title: _title
    , published_date: _published_date
    , authors: _authors || []
    , publisher: _publisher
    , reviews: _reviews
  }

  this.addAuthor = function(author) {
    fields.authors.push(author);
  }

  this.addReview = function(review) {
    fields.reviews.push(review);
  }

  simple_setter_getter(this, fields, "title");
  simple_setter_getter(this, fields, "isbn");
  simple_setter_getter(this, fields, "authors");
  simple_setter_getter(this, fields, "publisher");
  simple_setter_getter(this, fields, "reviews");
}