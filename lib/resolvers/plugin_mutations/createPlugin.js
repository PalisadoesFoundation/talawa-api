const Plugin = require('../../models/Plugin');
/**
 * @name createPlugin creates a Plugin and return the same
 * @description creates a document of Plugin type and stores it in database
 * @param  {any} parent parent of current request
 * @param  {object} args payload provided with the request
 * @param  {any} context context of entire application
 */
// eslint-disable-next-line no-unused-vars
module.exports = async (parent, args, context) => {
  //create MongoDB document
  let plugin = new Plugin({
    pluginName: args.pluginName,
    pluginCreatedBy: args.pluginCreatedBy,
    pluginDesc: args.pluginDesc,
    pluginInstallStatus: args.pluginInstallStatus,
    installedOrgs: args.installedOrgs,
  });
  //store the plugin
  plugin = await Plugin.save();
  return {
    ...plugin._doc,
  };
};
