const Plugin = require('../../models/Plugin');
/**
 * @name getPlugins a GraphQL Query
 * @description returns list of plugin from database
 */
module.exports = async () => {
  return await Plugin.find();
};
