const { Plugin } = require('../../models');
/**
 * @name updatePluginStatus
 * @description toggles the installStatus of the plugin
 * @param  {any} parent parent of current request
 * @param  {object} args payload provided with the request
 * @param  {any} context context of entire application
 */
// eslint-disable-next-line no-unused-vars
module.exports = async (parent, args, context) => {
  console.log('Argment s ', args);
  // eslint-disable-next-line no-unused-vars
  const result = await Plugin.findByIdAndUpdate(
    args.id,
    { pluginInstallStatus: args.status },
    { new: true },
    (err, res) => {
      if (err) {
        console.log(err);
      } else {
        console.log('Updated Plugin : ', res);
      }
    }
  );
  const plugin = await Plugin.findById(args.id);
  return plugin;
};
