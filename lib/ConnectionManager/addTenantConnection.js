const Tenant = require('../models/Tenant');
const Database = require('../Database/index');
const { setConnection } = require('./connections');
const { NotFoundError } = require('errors');
const requestContext = require('talawa-request-context');
const {
  ORGANIZATION_NOT_FOUND,
  ORGANIZATION_NOT_FOUND_MESSAGE,
  ORGANIZATION_NOT_FOUND_PARAM,
  ORGANIZATION_NOT_FOUND_CODE,
  IN_PRODUCTION,
} = require('../../constants');

module.exports = async (organizationId) => {
  const [tenant] = await Tenant.find({ organization: organizationId });
  if (!tenant || !tenant.url) {
    throw new NotFoundError(
      !IN_PRODUCTION
        ? ORGANIZATION_NOT_FOUND
        : requestContext.translate(ORGANIZATION_NOT_FOUND_MESSAGE),
      ORGANIZATION_NOT_FOUND_CODE,
      ORGANIZATION_NOT_FOUND_PARAM
    );
  }
  let connection = new Database(tenant.url);
  await connection.connect();
  setConnection(tenant.organization, connection);
  return connection;
};
