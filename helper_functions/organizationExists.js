const Organization = require('../models/Organization');
const { NotFound } = require('../core/errors');
const requestContext = require('../core/libs/talawa-request-context');

module.exports = async (id) => {
  const organization = await Organization.findOne({
    _id: id,
  });
  if (!organization) {
    throw new NotFound([
      {
        message: requestContext.translate('organization.notFound'),
        code: 'organization.notFound',
        param: 'organization',
      },
    ]);
  }
  return organization;
};
