const { Plugin } = require('../../models');

/**
 * @name getPlugins a GraphQL Query
 * @description returns list of plugin from database
 */
module.exports = async () => {
  return await Plugin.find();
};
