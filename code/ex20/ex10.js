var http = require('http')
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

// Methods
var searchByBook = function(req, res) { res.end('searchByBook'); }
var getLoansByUser = function(req, res) { res.end('getLoansByUser'); }

// Publisher API's
var borrowABook = function(req, res) { res.end('borrowABook'); }
var returnAABook = function(req, res) { res.end('returnAABook'); }
var modifyLoan = function(req, res) { res.end('modifyLoan'); }
var overdueLoans = function(req, res) { res.end('overdueLoans'); }
var overdueLoansByDays = function(req, res) { res.end('overdueLoansByDays'); }

var writeError = function(res, code, message) {
  res.writeHead(code, message, {'content-type': 'text/plain'});
  res.end(message);
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

// GET /author/search?query=?
var searchByAuthor = function(req, res) {   
  res.end('searchByAuthor'); 
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

var searchByPublisher = function(req, res) { res.end('searchByPublisher'); 
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
router.get("/user/:id/loans", getLoansByUser);
router.post("/user/:id/loan", borrowABook);
router.delete("/user/:id/loan", returnAABook);
router.put("/user/:id/loan", modifyLoan);
router.get("/user/:id", getUser);
router.post("/user", createUser);
router.delete("/user/:id", deleteUser);

// Routes for handling loans
router.get("/loan/overdue", overdueLoans);
router.get("/loan/overdue/:days", overdueLoansByDays);

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

  server.listen(9090, function() {
    console.log("listening on ", 9090);
  });  
});