const { IN_TEST } = require('../../constants');
const MainDB = require('../models/');
const getTenantFromId = require('./getTenantFromId');
const { getTenantConnection } = require('../ConnectionManager');

module.exports = async (req) => {
  const mergedId =
    req.body.variables && req.body.variables.id ? req.body.variables.id : null;
  if (IN_TEST) {
    return {
      db: MainDB,
      id: mergedId,
      tenantId: null,
    };
  }
  const { tenantId, id } = getTenantFromId(mergedId);
  if (!tenantId)
    return {
      db: MainDB,
      id: mergedId,
      tenantId: null,
    };
  else {
    const db = await getTenantConnection(tenantId);
    return { db, id, tenantId };
  }
};
