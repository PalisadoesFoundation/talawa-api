const Plugin = require('../../models/Plugins');
const adminCheck = require('../functions/adminCheck');
const Organization = require('../../models/Organization');

const { NotFoundError } = require('errors');
const requestContext = require('talawa-request-context');

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
