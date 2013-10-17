var http = require('http')
  , mongodb = require('mongodb')
  , parse = require('url').parse
  , MongoClient = mongodb.MongoClient;

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
var getAuthor = function(req, res) { res.end('getAuthor'); }
var createAuthor = function(req, res) { res.end('createAuthor'); }
var deleteAuthor = function(req, res) { res.end('deleteAuthor'); }
var getPublisher = function(req, res) { res.end('getPublisher'); }
var createPublisher = function(req, res) { res.end('createPublisher'); }
var deletePublisher  = function(req, res) { res.end('deletePublisher'); }

// Routes for the book
router.post("/book", createBook);
router.get("/book/:id", getBook);
router.delete("/book/:id", deleteBook);
router.get("/book/search", searchByBook);

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