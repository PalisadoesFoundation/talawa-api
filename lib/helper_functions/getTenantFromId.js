module.exports = (fullId, del = ' ') => {
  if (!fullId) return { id: null, tenantId: null };
  const [id, tenantId] = fullId.split(del);
  return { tenantId, id };
};
