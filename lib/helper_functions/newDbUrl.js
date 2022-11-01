module.exports = (orgId) => {
  // assuming local dbs for now.
  // to do add docker and hosted dbs.
  return `mongodb://localhost:27017/${orgId}?retryWrites=true&w=majority`;
};
