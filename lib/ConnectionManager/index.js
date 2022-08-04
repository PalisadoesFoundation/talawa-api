const addTenantConnection = require('./addTenantConnection');
const getTenantConnection = require('./getTenantConnection');
const initTenants = require('./initTenants');
const destroyConnections = require('./destroyConnections');

module.exports = {
  addTenantConnection,
  getTenantConnection,
  initTenants,
  destroyConnections,
};
