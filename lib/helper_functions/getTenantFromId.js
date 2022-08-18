module.exports = (fullId, del = ' ') => {
  const [tenantId, id] = fullId.split(del);
  return { tenantId, id };
};
