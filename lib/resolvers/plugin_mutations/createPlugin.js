const Plugin = require('../../models/Plugin');
module.exports = async (parent, args, context) => {
  let plugin = new Plugin({
    pluginName: args.pluginName,
    pluginCreatedBy: args.pluginCreatedBy,
    pluginDesc: args.pluginDesc,
    pluginInstallStatus: args.pluginInstallStatus,
  });

  plugin = await Plugin.save();
  console.log(plugin._doc)
  return {
    ...plugin._doc,
  };

};

