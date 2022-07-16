const Plugin = require('../../models/Plugin');
// eslint-disable-next-line no-unused-vars
module.exports = async (parent, args, context) => {
  let plugin = new Plugin({
    pluginName: args.pluginName,
    pluginCreatedBy: args.pluginCreatedBy,
    pluginDesc: args.pluginDesc,
    pluginInstallStatus: args.pluginInstallStatus,
  });

  plugin = await Plugin.save();
  console.log(plugin._doc);
  return {
    ...plugin._doc,
  };
};
