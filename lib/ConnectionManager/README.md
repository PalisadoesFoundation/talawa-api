# Connection Manager Module

This is the module that is responsible for connecting/disconnecting to each tenant's database.

### Prototype :

`addTenantConnection(organizationId)`

`getTenantConnection(organizationId)`

`initTenants()`

`destroyConnections()`

`addTenantConnection` is responsible for connecting to the database of a specific organization `organizationId`
and returning a reference to the connection object if the organization is not found it will throw an organization not found error.

`getTenantConnection` is responsible for retrivnig a connection to `organizationId` which already is in memory if it's not the function will throw a connection not found error.

`initTenants` is usually used on the startup of the api which connects to all the available tenants that are stored.

`destoryConnections` is used to close the connections and deleting them from memory.

### Basic usage :

This is mostly how it's going to be used:

```javascript
const connection = getTenantConnection(organizationId);
const Post = connection.Post;

// posts is an array of the posts stored in that specific tenant.
const posts = await Post.find({});
// to close connections:
await destroyConnections();
// would throw an error:
const con = getTenantConnection(organizationId);
```

### This is the main way to manage the databases that are devided into 2 types:

##### main database:

which holds connections, organizations, users, files data (shared data).

##### tenant databases;

which holds organization specific data such as posts, events, comments...
