const MongoDB = require('./MongoImplementation/');

function DataBase(url, options) {
  /* options{
    schema: {
      recordName: Mongoose.Schema
    },
    type: "MONGO", "SQL"...
    more options could be added later on.
  } */

  this.schema = !options || !options.schema ? [] : options.schema;
  this.db = new MongoDB(url, this.schema);

  // to know that type of the database used.
  this.dbType = this.db.type;
  this.connect = this.db.connect;
  this.disconnect = this.db.disconnect;
  // gives access to raw queries of any implementation.
  this.NativeDriver = this.db.Native;
  this.schema = this.db.schema;

  for (let key in this.schema) {
    this[key] = this.db[key];
  }
}

module.exports = DataBase;
