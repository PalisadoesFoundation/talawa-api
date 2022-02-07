const Plugin = require('../../models/Plugins');
const User = require('../../models/User');
const superAdminCheck = require('../functions/superAdminCheck');
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

  const user = await User.findOne({
    _id: context.userId,
  });

  if (!user) {
    throw new NotFoundError(
      requestContext.translate('user.notFound'),
      'user.notFound',
      'user'
    );
  }

  superAdminCheck(context, user);

  const pluginFound = await Plugin.find({
    orgId: args.orgId,
    pluginStatus: 'ACTIVE',
  });

  return pluginFound;
};
