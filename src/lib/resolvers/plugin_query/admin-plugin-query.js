const { Plugin, Organization } = require('../../models');
const adminCheck = require('../functions/adminCheck');

const { NotFoundError } = require('../../libraries/errors');
const requestContext = require('../../libraries/request-context');

module.exports = async (parent, args, context) => {
  const organizationFound = await Organization.findOne({
    _id: args.orgId,
  });

  if (!organizationFound) {
    throw new NotFoundError(
      requestContext.translate('organization.notFound'),
      'organization.notFound',
      'organization'
    );
  }

  adminCheck(context, organizationFound);
  const pluginFound = await Plugin.find({
    orgId: args.orgId,
    pluginStatus: 'ACTIVE',
    adminAccessAllowed: true,
  });

  return pluginFound;
};
