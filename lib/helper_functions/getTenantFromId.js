module.exports = (fullId) => {
  const [tenantId, id] = fullId.split(' ');
  return { tenantId, id };
};
