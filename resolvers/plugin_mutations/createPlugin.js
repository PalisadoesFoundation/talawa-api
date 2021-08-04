const Plugin = require('../../models/Plugins');
const PluginField = require('../../models/PluginsField');
const User = require('../../models/User');

const { NotFoundError } = require('errors');
const requestContext = require('talawa-request-context');

module.exports = async (parent, args, context) => {
  // gets user in token - to be used later on
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
