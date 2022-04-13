const Plugin = require('../../models/Plugins');
const adminCheck = require('../functions/adminCheck');
const Organization = require('../../models/Organization');

const { NotFoundError } = require('errors');
const requestContext = require('talawa-request-context');
const {
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

  adminCheck(context, organizationFound);
  const pluginFound = await Plugin.find({
    orgId: args.orgId,
    pluginStatus: 'ACTIVE',
    adminAccessAllowed: true,
  });

  return pluginFound;
};
