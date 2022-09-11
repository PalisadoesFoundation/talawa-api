# Database Module

This folder is a way of making the database usage inside of the API more modular.

### Prototype :

`Database(url, options)`

Where:

`url` is the connection string of the database that you would like to connect to.

`options` is an object with the following keys:

- `schema`: which is an array that contains a set of strings, each string is the name of the record/table you want to add (based on it's file name).

-- the schema array defaults to all the schema objects that are defined to the system.

-- more options will be added in the future for example different database types.

### Basic usage :

This is mostly how it's going to be used:

```javascript
const url = 'your-db-connection-url';
const db = new Database(url);

// to find all users.
const users = db.User.find();
```

In case of differenct schema in mind here's an example:

```javascript
  const userSchema = require('./schema/userSchema');
  const url = 'your-db-connection-url';
  const db = new Database(url, {
    schema: ['user']
  );

  // to find all users.
  const users = db.User.find();
```

### Goal:

This approach is a way of making the database instantiatable for more functionality such as the multi-tenancy functionality instead of using the static
database object provided by mongoose, we can use the modular opproach or a mix of both modular and static.
