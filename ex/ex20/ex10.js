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
var createBook = function(req, res) { res.end('createBook'); }
var getBook = function(req, res) { res.end('getBook'); }
var deleteBook = function(req, res) { res.end('deleteBook'); }
var searchByBook = function(req, res) { res.end('searchByBook'); }
var searchByAuthor = function(req, res) { res.end('searchByAuthor'); }
var getBooksByAuthor = function(req, res) { res.end('getBooksByAuthor'); }
var searchByPublisher = function(req, res) { res.end('searchByPublisher'); }
var getBooksByPublisher = function(req, res) { res.end('getBooksByPublisher'); }
var getLoansByUser = function(req, res) { res.end('getLoansByUser'); }
var borrowABook = function(req, res) { res.end('borrowABook'); }
var returnAABook = function(req, res) { res.end('returnAABook'); }
var modifyLoan = function(req, res) { res.end('modifyLoan'); }
var overdueLoans = function(req, res) { res.end('overdueLoans'); }
var overdueLoansByDays = function(req, res) { res.end('overdueLoansByDays'); }
var getPublisher = function(req, res) { res.end('getPublisher'); }
var createPublisher = function(req, res) { res.end('createPublisher'); }
var deletePublisher  = function(req, res) { res.end('deletePublisher'); }

// Routes for the book
router.post("/book", createBook);
router.get("/book/:id", getBook);
router.delete("/book/:id", deleteBook);
router.get("/book/search", searchByBook);

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

// Routes for handling loans
router.get("/loan/overdue", overdueLoans);
router.get("/loan/overdue/:days", overdueLoansByDays);

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