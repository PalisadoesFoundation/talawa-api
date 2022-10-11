const MainDB = require('../models/');
const getTenantFromId = require('./getTenantFromId');
const { getTenantConnection } = require('../ConnectionManager');

module.exports = async (mergedId) => {
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
