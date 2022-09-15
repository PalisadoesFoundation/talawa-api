const addTenantConnection = require('./addTenantConnection');
const getTenantConnection = require('./getTenantConnection');
const initTenants = require('./initTenants');
const destroyConnections = require('./destroyConnections');
const destroyOneConnection = require('./destroyOneConnection');

module.exports = {
  addTenantConnection,
  getTenantConnection,
  initTenants,
  destroyConnections,
  destroyOneConnection,
};
