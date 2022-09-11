module.exports = (id, tenantId = '', del = ' ') => {
  if (!tenantId) return id;
  return id + del + tenantId;
};
