const Plugin = require('../../models/Plugins');
const User = require('../../models/User');
const superAdminCheck = require('../functions/superAdminCheck');
const Organization = require('../../models/Organization');

const { NotFoundError } = require('errors');
const requestContext = require('talawa-request-context');
const {
  NOT_FOUND_USER_MESSAGE,
  NOT_FOUND_USER_CODE,
  NOT_FOUND_USER_PARAM,
  NOT_FOUND_ORGANIZATION_MESSAGE,
  NOT_FOUND_ORGANIZATION_CODE,
  NOT_FOUND_ORGANIZATION_PARAM,
} = require('../../../constants');

module.exports = async (parent, args, context) => {
  const organizationFound = await Organization.findOne({
    _id: args.orgId,
  });

  if (!organizationFound) {
    throw new NotFoundError(
      requestContext.translate(NOT_FOUND_ORGANIZATION_MESSAGE),
      NOT_FOUND_ORGANIZATION_CODE,
      NOT_FOUND_ORGANIZATION_PARAM
    );
  }

  const user = await User.findOne({
    _id: context.userId,
  });

  if (!user) {
    throw new NotFoundError(
      requestContext.translate(NOT_FOUND_USER_MESSAGE),
      NOT_FOUND_USER_CODE,
      NOT_FOUND_USER_PARAM
    );
  }

  superAdminCheck(context, user);

  const pluginFound = await Plugin.find({
    orgId: args.orgId,
    pluginStatus: 'ACTIVE',
  });

  return pluginFound;
};
