module.exports = function(db) {
  var Gamer = function() {}

  //
  // Locate a gamer by his session id
  //
  Gamer.findGamerBySid = function(sid, callback) {
    db.collection('gamers').findOne({sid: sid}, callback);
  }

  //
  // Update a gamers current activity time and session id
  // when they come back after some time away
  //
  Gamer.updateGamer = function(user_name, sid, callback) {
    db.collection('gamers').update({user_name: user_name}
      , {$set: {updated_on: new Date(), sid:sid}}
      , {upsert:true}, callback);
  }

  //
  // Initialize the gamer collection, by adding indexes etc
  //
  Gamer.init = function(callback) {
    db.collection('gamers').ensureIndex({updated_on: 1}
      , {expireAfterSeconds: (60 * 60)}, callback);
  }

  return Gamer;
}