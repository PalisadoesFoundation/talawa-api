const Organization = require('../models/Organization');
const { NotFoundError } = require('errors');
const requestContext = require('talawa-request-context');

module.exports = async (id) => {
  const organization = await Organization.findOne({
    _id: id,
  });
  if (!organization) {
    throw new NotFoundError(
      process.env.NODE_ENV !== 'production'
        ? 'Organization not found'
        : requestContext.translate('organization.notFound'),
      'organization.notFound',
      'organization'
    );
  }
  return organization;
};
