const User = require('../../models/User');
const Plugin = require('../../models/Plugins');
const PluginField = require('../../models/PluginsField');
const Organization = require('../../models/Organization');

const { UnauthorizedError } = require('errors');
const { NotFoundError } = require('errors');
const requestContext = require('talawa-request-context');

const {
  NOT_FOUND_USER_MESSAGE,
  NOT_FOUND_USER_CODE,
  NOT_FOUND_USER_PARAM,
  NOT_FOUND_ORGANIZATION_MESSAGE,
  NOT_FOUND_ORGANIZATION_CODE,
  NOT_FOUND_ORGANIZATION_PARAM,
  NOT_AUTHORIZED_USER_MESSAGE,
  NOT_AUTHORIZED_USER_CODE,
  NOT_AUTHORIZED_USER_PARAM,
} = require('../../../constants');

module.exports = async (parent, args, context) => {
  let org = await Organization.findOne({
    _id: args.plugin.orgId,
  });

  if (!org) {
    throw new NotFoundError(
      requestContext.translate(NOT_FOUND_ORGANIZATION_MESSAGE),
      NOT_FOUND_ORGANIZATION_CODE,
      NOT_FOUND_ORGANIZATION_PARAM
    );
  }

  const user = await User.findOne({
    _id: context.userId,
    pluginCreationAllowed: true,
  });

  if (!user) {
    throw new NotFoundError(
      requestContext.translate(NOT_FOUND_USER_MESSAGE),
      NOT_FOUND_USER_CODE,
      NOT_FOUND_USER_PARAM
    );
  }

  const isSuperAdmin = user.userType === 'SUPERADMIN';
  if (!isSuperAdmin) {
    const isAdmin = org.admins.includes(user.id);
    if (!isAdmin) {
      throw new UnauthorizedError(
        requestContext.translate(NOT_AUTHORIZED_USER_MESSAGE),
        NOT_AUTHORIZED_USER_CODE,
        NOT_AUTHORIZED_USER_PARAM
      );
    }
  }

  let pluginAddnFields = [];
  if (args.plugin.fields.length > 0) {
    for (let i = 0; i < args.plugin.fields.length; i++) {
      let pluginField = new PluginField({
        key: args.plugin.fields[i].key,
        value: args.plugin.fields[i].value,
      });

      pluginAddnFields.push(pluginField);
    }
  }

  let plugin = new Plugin({
    orgId: args.plugin.orgId,
    pluginName: args.plugin.pluginName,
    pluginKey: args.plugin.pluginKey,
    additionalInfo: pluginAddnFields,
  });

  plugin = await plugin.save();

  return {
    ...plugin._doc,
  };
};
