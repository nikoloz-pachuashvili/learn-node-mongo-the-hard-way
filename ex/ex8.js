var mongodb = require('mongodb')
  , Long = mongodb.Long
  , Binary = mongodb.Binary
  , Code = mongodb.Code
  , ObjectID = mongodb.ObjectID
  , serialize = mongodb.BSONPure.BSON.serialize;

var buffer = new Buffer('hello world');

var document = {
    '64bitvalue': Long.fromNumber(45000000)
  , 'array of values': [1, 2, 3, 'hello', {'a': 1}]
  , 'binary': new Binary(buffer)
  , 'code': new Code(function test() {
      return "hello world";
    })
  , 'date': new Date()
  , 'regexp': /^hello/
  , '_id': new ObjectID()
}

serialize(document);