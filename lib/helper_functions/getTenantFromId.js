module.exports = (fullId, del = ' ') => {
  if (!fullId) return { id: null, tenantId: null };
  const finalId = '' + fullId;
  const [id, tenantId] = finalId.split(del);
  return { tenantId, id };
};
