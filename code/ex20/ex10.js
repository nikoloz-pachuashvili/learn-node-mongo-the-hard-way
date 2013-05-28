var http = require('http')
  , url = require('url')
  , mongodb = require('mongodb')
  , parse = require('url').parse
  , MongoClient = mongodb.MongoClient
  , ObjectID = mongodb.ObjectID;

var dbInstance = null;
var router = {
  routes: {
    get: [], post: [], delete: [], put: []
  },

  get: function(route, fn) {
    this.compile(this.routes.get, route, fn);
  },

  post: function(route, fn) {
    this.compile(this.routes.post, route, fn);
  },

  put: function(route, fn) {
    this.compile(this.routes.put, route, fn);
  },

  delete: function(route, fn) {    
    this.compile(this.routes.delete, route, fn);
  },

  compile: function(routes, route, fn) {
    // Rewrite the route as regular expression
    var urlParts = route.split(/\//);
    var params = [];
    var regexp = "^" + urlParts.map(function(part) {
      if(part.indexOf(":") == 0) {
        params.push(part.substr(1));
        return "([0-9|a-z|A-Z|_]+)";
      } else {
        return part;
      }
    }).join("/") + "$";
    // Final object
    var object = {route: {regexp: regexp, params: params}, fn:fn};
    // If we have no params we put it at the start
    if(params.length == 0) {
      routes.splice(0, 0, object)
      // routes.push(object);
    } else {
      routes.push(object);
    }
  },

  route: function(req, res) {
    var method = req.method;
    var url = parse(req.url);
    var routes = this.routes[method.toLowerCase()]
    // Holds the route we match
    var matching = null;
    var regexpMatch = null;
    
    // Locate the matching function
    for(var i = 0; i < routes.length; i++) {
      regexpMatch = url.pathname.match(routes[i].route.regexp);
    
      // We have a match
      if(regexpMatch != null) {
        matching = routes[i];
        break;
      }
    }

    // No route found just write to browser
    if(matching == null) return res.end('no route found');
    
    // Build params result
    var params = {};
    // For each param let's setup the result
    for(var i = 0; i < matching.route.params.length; i++) {
      params[matching.route.params[i]] = regexpMatch[i + 1];
    }

    // Add to the request
    req.params = params;

    // Let's execute the function
    matching.fn(req, res);
  }
}

var writeError = function(res, code, message) {
  res.writeHead(code, message, {'content-type': 'text/plain'});
  res.end(message);
}

var queryHelper = function(req) {
  var url_parts = url.parse(req.url, true);
  return url_parts.query;  
}

var postJSONHelper = function(req, callback) {  
  var data = '';
  
  req.on('data', function(chunk) {
    data += chunk;
  })

  req.on('end', function() {
    try {
      var obj = JSON.parse(data);
      callback(null, obj);
    } catch(err) {
      callback(err);      
    }
  })
}

// Methods for the author
// POST /author
var createAuthor = function(req, res) { 
  postJSONHelper(req, function(err, object) {
    if(err) 
      return writeError(res, 406, 'Illegal JSON');

    // Insert the user
    dbInstance.collection('authors').insert(object, function(err, doc) {
      if(err) 
        return writeError(res, 500, 'Failed to insert document');

      res.end(JSON.stringify(doc[0]));
    });
  });
}

// GET /author/:id
var getAuthor = function(req, res) { 
  dbInstance.collection('authors').findOne({_id: new ObjectID(req.params.id)}, function(err, doc) {
    if(err || doc == null) 
      return writeError(res, 404, 'Failed to retrieve document from database for id ' + req.params.id);
   
    res.end(JSON.stringify(doc));
  });
}

// DELETE /author/:id
var deleteAuthor = function(req, res) { 
  dbInstance.collection('books').count({"authors.id": new ObjectID(req.params.id)}, function(err, count) {
    if(err) 
      return writeError(res, 500, 'Failed to delete document from database for id ' + req.params.id);

    if(count > 0)
      return writeError(res, 406, 'Author with ' + req.params.id + " cannot be deleted as it's associated with existing books");

    dbInstance.collection('authors').remove({_id: new ObjectID(req.params.id)}, function(err, deleted) {
      if(err) 
        return writeError(res, 500, 'Failed to delete document from database for id ' + req.params.id);
      
      if(deleted == 0)
        return writeError(res, 404, 'No document with id ' + req.params.id + ' found in database');

      res.end(JSON.stringify({_id: req.params.id}));
    });
  });
}

// POST /publisher
var createPublisher = function(req, res) {
  postJSONHelper(req, function(err, object) {
    if(err) 
      return writeError(res, 406, 'Illegal JSON');

    // Insert the user
    dbInstance.collection('publishers').insert(object, function(err, doc) {
      if(err) 
        return writeError(res, 500, 'Failed to insert document');

      res.end(JSON.stringify(doc[0]));
    });
  });
}

// GET /publisher/:id
var getPublisher = function(req, res) {
  dbInstance.collection('publishers').findOne({_id: new ObjectID(req.params.id)}, function(err, doc) {
    if(err || doc == null) 
      return writeError(res, 404, 'Failed to retrieve document from database for id ' + req.params.id);
   
    res.end(JSON.stringify(doc));
  });
}

// DELETE /publisher/:id
var deletePublisher  = function(req, res) {
  dbInstance.collection('books').count({"publisher_id": new ObjectID(req.params.id)}, function(err, count) {
    if(err) 
      return writeError(res, 500, 'Failed to delete document from database for id ' + req.params.id);

    if(count > 0)
      return writeError(res, 406, 'Publisher with ' + req.params.id + " cannot be deleted as it's associated with existing books");

    dbInstance.collection('publishers').remove({_id: new ObjectID(req.params.id)}, function(err, deleted) {
      if(err) 
        return writeError(res, 500, 'Failed to delete document from database for id ' + req.params.id);
      
      if(deleted == 0)
        return writeError(res, 404, 'No document with id ' + req.params.id + ' found in database');

      res.end(JSON.stringify({_id: req.params.id}));
    });
  });
}

// POST /user
var createUser = function(req, res) {
  postJSONHelper(req, function(err, object) {
    if(err) 
      return writeError(res, 406, 'Illegal JSON');

    // Insert the user
    dbInstance.collection('users').insert(object, function(err, doc) {
      if(err) 
        return writeError(res, 500, 'Failed to insert document');

      res.end(JSON.stringify(doc[0]));
    });
  });
}

// GET /user/:id
var getUser = function(req, res) {
  dbInstance.collection('users').findOne({_id: new ObjectID(req.params.id)}, function(err, doc) {
    if(err || doc == null) 
      return writeError(res, 404, 'Failed to retrieve document from database for id ' + req.params.id);
   
    res.end(JSON.stringify(doc));
  });
}

// DELETE /user/:id
var deleteUser  = function(req, res) {
  dbInstance.collection('books').count({"loaned_out_to.user_id": new ObjectID(req.params.id)}, function(err, count) {
    if(err) 
      return writeError(res, 500, 'Failed to delete document from database for id ' + req.params.id);

    if(count > 0)
      return writeError(res, 406, 'User with ' + req.params.id + " cannot be deleted as it's associated with existing books");

    dbInstance.collection('users').remove({_id: new ObjectID(req.params.id)}, function(err, deleted) {
      if(err) 
        return writeError(res, 500, 'Failed to delete document from database for id ' + req.params.id);
      
      if(deleted == 0)
        return writeError(res, 404, 'No document with id ' + req.params.id + ' found in database');

      res.end(JSON.stringify({_id: req.params.id}));
    });
  });
}

// POST /book
var createBook = function(req, res) {
  postJSONHelper(req, function(err, object) {
    if(err) 
      return writeError(res, 406, 'Illegal JSON');

    // Insert the user
    dbInstance.collection('books').insert(object, function(err, doc) {
      if(err) 
        return writeError(res, 500, 'Failed to insert document');

      res.end(JSON.stringify(doc[0]));
    });
  });
}

// GET /book/:id
var getBook = function(req, res) {
  dbInstance.collection('books').findOne({_id: new ObjectID(req.params.id)}, function(err, doc) {
    if(err || doc == null) 
      return writeError(res, 404, 'Failed to retrieve document from database for id ' + req.params.id);
   
    res.end(JSON.stringify(doc));
  });
}

// DELETE /book/:id
var deleteBook  = function(req, res) {
  dbInstance.collection('books').findOne({_id: new ObjectID(req.params.id)}, function(err, book) {
    if(err) 
      return writeError(res, 500, 'Failed to delete document from database for id ' + req.params.id);

    if(!book)
      return writeError(res, 406, 'Book with ' + req.params.id + " was not found");

    if(book.loaned_out_to && book.loaned_out_to.length > 0)
      return writeError(res, 500, 'Book with ' + req.params.id + " was not deleted as copies are currently loaned out");

    dbInstance.collection('books').remove({_id: new ObjectID(req.params.id)}, function(err, deleted) {
      if(err) 
        return writeError(res, 500, 'Failed to delete document from database for id ' + req.params.id);
      
      if(deleted == 0)
        return writeError(res, 404, 'No document with id ' + req.params.id + ' found in database');

      res.end(JSON.stringify({_id: req.params.id}));
    });
  });
}

// PUT /book/:id/publisher/:publisher_id
var associatePublisher = function(req, res) {
  dbInstance.collection('books').findOne({_id: new ObjectID(req.params.id)}, function(err, book) {
    if(err)
      return writeError(res, 500, 'Failed to retrieve book with id ' + req.params.id);

    if(!book)
      return writeError(res, 406, 'Book with ' + req.params.id + " was not found");

    dbInstance.collection('publishers').findOne({_id: new ObjectID(req.params.publisher_id)}, function(err, publisher) {
      if(err)
        return writeError(res, 500, 'Failed to retrieve publisher with id ' + req.params.publisher_id);

      if(!publisher)
        return writeError(res, 406, 'Publisher with ' + req.params.publisher_id + " was not found");

      dbInstance.collection('books').update({_id: new ObjectID(req.params.id)}
          , {$set: {"publisher.publisher_id": new ObjectID(req.params.publisher_id)}}, function(err, updated) {

        if(err)
          return writeError(res, 500, 'Failed to update publisher for book with id ' + req.params.id);

        res.end(JSON.stringify({_id: req.params.id}));
      });
    });
  });
}

// PUT /book/:id/author/:publisher_id
var associateAuthor = function(req, res) {  
  dbInstance.collection('books').findOne({_id: new ObjectID(req.params.id)}, function(err, book) {
    if(err)
      return writeError(res, 500, 'Failed to retrieve book with id ' + req.params.id);

    if(!book)
      return writeError(res, 406, 'Book with ' + req.params.id + " was not found");

    dbInstance.collection('authors').findOne({_id: new ObjectID(req.params.author_id)}, function(err, author) {
      if(err)
        return writeError(res, 500, 'Failed to retrieve publisher with id ' + req.params.author_id);

      if(!author)
        return writeError(res, 406, 'Author with ' + req.params.author_id + " was not found");

      var author = {
          id: new ObjectID(req.params.author_id)
        , name: author.name
      }

      dbInstance.collection('books').update({_id: new ObjectID(req.params.id)}
          , {$addToSet: {"authors": author}}, function(err, updated) {

        if(err)
          return writeError(res, 500, 'Failed to update publisher for book with id ' + req.params.id);

        if(updated == 0) 
          return writeError(res, 500, 'Author already associated with the book with id ' + req.params.id);

        res.end(JSON.stringify({_id: req.params.id}));
      });
    });
  });
}

// GET /publisher/:id/books
var getBooksByPublisher = function(req, res) { 
  dbInstance.collection('publishers').findOne({_id: new ObjectID(req.params.id)}, function(err, publisher) {
    if(err)
      return writeError(res, 500, 'Failed to retrieve publisher with id ' + req.params.id);

    if(!publisher)
      return writeError(res, 406, 'Publisher with ' + req.params.id + " was not found");

    dbInstance.collection('books').find({"publisher.publisher_id": publisher._id}, {loaned_out_to: 0}).toArray(function(err, books) {
      if(err)
        return writeError(res, 500, 'Failed to retrieve books for publisher with id ' + req.params.id);

      res.end(JSON.stringify(books));
    });
  });
}

// GET /author/:id/books
var getBooksByAuthor = function(req, res) { 
  dbInstance.collection('authors').findOne({_id: new ObjectID(req.params.id)}, function(err, author) {
    if(err)
      return writeError(res, 500, 'Failed to retrieve author with id ' + req.params.id);

    if(!author)
      return writeError(res, 406, 'Author with ' + req.params.id + " was not found");

    dbInstance.collection('books').find({"authors.id": author._id}, {loaned_out_to: 0}).toArray(function(err, books) {
      if(err)
        return writeError(res, 500, 'Failed to retrieve books for author with id ' + req.params.id);

      res.end(JSON.stringify(books));
    });
  });
}

// GET /author/search?query=?
var searchByAuthor = function(req, res) {
  var queryStringParams = queryHelper(req);
  var query = queryStringParams.query || '';

  dbInstance.command({text: "authors", search: query}, function(err, results) {
    if(err)
      return writeError(res, 500, 'Failed to search by author with search ' + query);

    res.end(JSON.stringify(results.results));
  });
}

// GET /publisher/search?query=?
var searchByPublisher = function(req, res) { 
  var queryStringParams = queryHelper(req);
  var query = queryStringParams.query || '';

  dbInstance.command({text: "publishers", search: query}, function(err, results) {
    if(err)
      return writeError(res, 500, 'Failed to search by author with search ' + query);

    res.end(JSON.stringify(results.results));
  });
}

// GET /book/search?query=?
var searchByBook = function(req, res) { 
  var queryStringParams = queryHelper(req);
  var query = queryStringParams.query || '';

  dbInstance.command({text: "books", search: query, project: {loaned_out_to: 0}}, function(err, results) {
    if(err)
      return writeError(res, 500, 'Failed to search by author with search ' + query);

    res.end(JSON.stringify(results.results));
  });
}

// POST /user/:id/loan/:book_id
var borrowABook = function(req, res) { 
  dbInstance.collection('books').findOne({_id: new ObjectID(req.params.book_id)}, function(err, book) {
    if(err)
      return writeError(res, 500, 'Failed to retrieve Book for id ' + req.params.id);

    if(!book)
      return writeError(res, 406, 'Book with ' + req.params.book_id + " was not found");

    dbInstance.collection('users').findOne({_id: new ObjectID(req.params.id)}, function(err, user) {
      if(err)
        return writeError(res, 500, 'Failed to retrieve User for id ' + req.params.id);

      if(!user)
        return writeError(res, 406, 'User with ' + req.params.id + " was not found");

      if(book.loaned_out_to)
        return writeError(res, 406, 'Book with ' + req.params.book_id + " already loaned out");

      var currentDate = new Date();
      var dueOn = currentDate;
      var dueOnTime = currentDate.getTime() + (14 * 24 * 60 * 60 * 1000);
      dueOn.setTime(dueOnTime);

      var loanedOutTo = {
          user_id: user._id
        , loaned_on: new Date()
        , due_on: dueOn
      }

      var loanedBook = {
          id: book._id 
        , title: book.title
        , loaned_out: loanedOutTo.loaned_on
        , due_on: loanedOutTo.due_on
      }

      dbInstance.collection('books').update({_id: new ObjectID(req.params.book_id), loaned_out_to: {$exists: false}}
        , {$set: { loaned_out:true, loaned_out_to: loanedOutTo }}, function(err, updated) {

        if(err || updated == 0)
          return writeError(res, 500, 'Failed to loan Book with id ' + req.params.book_id);

        dbInstance.collection('users').update({_id: new ObjectID(req.params.id)}
          , {$push: { loaned_books: loanedBook }}, function(err, updated) {

          if(err || updated == 0)
            return writeError(res, 500, 'Failed to update User with id ' + req.params.id);

          res.end(JSON.stringify(loanedBook));
        });
      });
    });
  });
}

// DELETE  /user/:id/loan/:book_id
var returnAABook = function(req, res) { 
  dbInstance.collection('books').findOne({_id: new ObjectID(req.params.book_id)}, function(err, book) {
    if(err)
      return writeError(res, 500, 'Failed to retrieve Book for id ' + req.params.id);

    if(!book)
      return writeError(res, 406, 'Book with ' + req.params.book_id + " was not found");

    dbInstance.collection('users').findOne({_id: new ObjectID(req.params.id)}, function(err, user) {
      if(err)
        return writeError(res, 500, 'Failed to retrieve User for id ' + req.params.id);

      if(!user)
        return writeError(res, 406, 'User with ' + req.params.id + " was not found");

      dbInstance.collection('books').update({_id: new ObjectID(req.params.book_id), loaned_out: true}
        , {$set: { loaned_out:false}, $unset: {loaned_out_to: null} }, function(err, updated) {

        if(err || updated == 0)
          return writeError(res, 500, 'Failed to return Book with id ' + req.params.book_id);

        dbInstance.collection('users').update({_id: new ObjectID(req.params.id)}
          , {$pop: { loaned_books: {id: new ObjectID(req.params.book_id) }}}, function(err, updated) {

          if(err || updated == 0)
            return writeError(res, 500, 'Failed to update User with id ' + req.params.id);

          res.end(JSON.stringify(book.loaned_out_to));
        });
      });
    });
  });
}

// GET /user/:id/loans
var getLoansByUser = function(req, res) { 
  dbInstance.collection('users').findOne({_id: new ObjectID(req.params.id)}, function(err, user) {
    if(err)
      return writeError(res, 500, 'Failed to retrieve User for id ' + req.params.id);

    if(!user)
      return writeError(res, 406, 'User with ' + req.params.id + " was not found");

    var loaned_books = user.loaned_books || [];
    res.end(JSON.stringify(loaned_books));
  });
}

// PUT /user/:id/loan/:book_id
var modifyLoan = function(req, res) { 
  dbInstance.collection('books').findOne({_id: new ObjectID(req.params.book_id)}, function(err, book) {
    if(err)
      return writeError(res, 500, 'Failed to retrieve Book for id ' + req.params.id);

    if(!book)
      return writeError(res, 406, 'Book with ' + req.params.book_id + " was not found");

    dbInstance.collection('users').findOne({_id: new ObjectID(req.params.id)}, function(err, user) {
      if(err)
        return writeError(res, 500, 'Failed to retrieve User for id ' + req.params.id);

      if(!user)
        return writeError(res, 406, 'User with ' + req.params.id + " was not found");

      if(!user.loaned_books) 
        return writeError(res, 406, 'User with ' + req.params.id + " has not borrowed any books");

      // Let's locate the book
      var loaned_book;
      
      for(var i = 0; user.loaned_books.length; i++) {
        if(user.loaned_books[i].id.toString() == req.params.book_id) {
          loaned_book = user.loaned_books[i];
          break;
        }
      }

      if(loaned_book == null)
        return writeError(res, 406, 'User with ' + req.params.id + " has not borrowed the book with id " + req.params.book_id);

      var currentDate = loaned_book.due_on;
      var dueOn = currentDate;
      var dueOnTime = currentDate.getTime() + (14 * 24 * 60 * 60 * 1000);
      dueOn.setTime(dueOnTime);

      dbInstance.collection('users')
        .update({_id: new ObjectID(req.params.id), "loaned_books.id": new ObjectID(req.params.book_id)}
            , {$set: {"loaned_books.$.due_on": dueOn}}, function(err, updated) {

          if(err || updated == 0)
            return writeError(res, 500, 'Failed to update User with id ' + req.params.id);

          loaned_book.due_on = dueOn;
          res.end(JSON.stringify(loaned_book));
        });
    });
  });
}

// GET /loan/overdue
var overdueLoans = function(req, res) { 
  dbInstance.collection('users').aggregate(
    [
        { $match: {"loaned_books.due_on": { $lte: new Date() } } }
      , { $unwind: "$loaned_books" }
      , { $project: {
              _id: "$loaned_books.id"
            , user_id: "$_id"
            , title: "$loaned_books.title"
            , loaned_out: "$loaned_books.loaned_out"
            , due_on: "$loaned_books.due_on"
          }
        }
    ], function(err, results) {
      if(err)
        return writeError(res, 500, 'Failed to locate overdue books');

      res.end(JSON.stringify(results));
  });
}

// GET /loan/overdue/:days
var overdueLoansByDays = function(req, res) { 
  var days = parseInt(req.params.days, 10);
  var currentDate = new Date();
  var time = currentDate.getTime() + (days * 24 * 60 * 60 * 1000);
  currentDate.setTime(time);

  dbInstance.collection('users').aggregate(
    [
        { $match: {"loaned_books.due_on": { $lte: currentDate } } }
      , { $unwind: "$loaned_books" }
      , { $project: {
              _id: "$loaned_books.id"
            , user_id: "$_id"
            , title: "$loaned_books.title"
            , loaned_out: "$loaned_books.loaned_out"
            , due_on: "$loaned_books.due_on"
          }
        }
    ], function(err, results) {
      if(err)
        return writeError(res, 500, 'Failed to locate overdue books');

      res.end(JSON.stringify(results));
  });
}

// Routes for the author
router.get("/author/search", searchByAuthor);
router.get("/author/:id/books", getBooksByAuthor);
router.get("/author/:id", getAuthor);
router.post("/author", createAuthor);
router.delete("/author/:id", deleteAuthor);

// Routes for the publisher
router.get("/publisher/search", searchByPublisher);
router.get("/publisher/:id/books", getBooksByPublisher);
router.get("/publisher/:id", getPublisher);
router.post("/publisher", createPublisher);
router.delete("/publisher/:id", deletePublisher);

// Routes for the user
router.get("/user/:id", getUser);
router.post("/user", createUser);
router.delete("/user/:id", deleteUser);

// Routes for handling loans
router.get("/loan/overdue", overdueLoans);
router.get("/loan/overdue/:days", overdueLoansByDays);
router.get("/user/:id/loans", getLoansByUser);
router.post("/user/:id/loan/:book_id", borrowABook);
router.delete("/user/:id/loan/:book_id", returnAABook);
router.put("/user/:id/loan/:book_id", modifyLoan);

// Routes for the book
router.post("/book", createBook);
router.get("/book/:id", getBook);
router.delete("/book/:id", deleteBook);
router.get("/book/search", searchByBook);
router.put("/book/:id/publisher/:publisher_id", associatePublisher);
router.put("/book/:id/author/:author_id", associateAuthor);

// Start a server instance
var server = http.createServer(function(req, res) {
  router.route(req, res);
});

// Connect to MongoDB
MongoClient.connect("mongodb://localhost:27017/library", function(err, db) {
  if(err) throw err;
  dbInstance = db;
  console.log("connected to mongodb")

  db.admin().command({ setParameter : 1, textSearchEnabled : true }, function(err, result) {

    db.collection('books').ensureIndex({title:"text"}, {w:0});
    db.collection('authors').ensureIndex({name:"text"}, {w:0});
    db.collection('publishers').ensureIndex({name:"text"}, {w:0});

    server.listen(9090, function() {
      console.log("listening on ", 9090);
    });  
  });
});