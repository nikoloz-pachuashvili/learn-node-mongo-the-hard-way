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
  dbInstance.collection('authors').remove({_id: new ObjectID(req.params.id)}, function(err, deleted) {
    if(err) 
      return writeError(res, 500, 'Failed to delete document from database for id ' + req.params.id);
    
    if(deleted == 0)
      return writeError(res, 404, 'No document with id ' + req.params.id + ' found in database');

    res.end(JSON.stringify({_id: req.params.id}));
  });
}
