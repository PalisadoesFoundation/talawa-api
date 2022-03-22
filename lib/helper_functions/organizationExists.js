const Organization = require('../models/Organization');
const { NotFoundError } = require('errors');
const requestContext = require('talawa-request-context');

module.exports = async (id) => {
  try {
    const organization = await Organization.findOne({
      _id: id,
    });
    if (!organization) {
      throw new NotFoundError(
        requestContext.translate('organization.notFound'),
        'organization.notFound',
        'organization'
      );
    }
    return organization;
  } catch (err) {
    throw new NotFoundError(
      requestContext.translate('organization.notFound'),
      'organization.notFound',
      'organization'
    );
  }
};
