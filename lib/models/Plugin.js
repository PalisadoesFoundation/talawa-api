const mongoose = require('mongoose');
const Schema = mongoose.Schema;
/**
 * @name pluginSchema
 * @description Schema for MongoDB database
 * @function
 * @param  {string} pluginName Name of the plugin preferred having underscores "_"
 * @param {string} pluginCreatedBy name of the plugin creator ex.John Doe
 * @param {string} pluginDesc brief description of the plugin and it's features
 * @param {Boolean} pluginInstallStatus shows if the plugin is enabled or not
 * @param {String[]} installedOrgs list of orgIDs on which the plugin is enabled
 */
const pluginSchema = new Schema({
  pluginName: {
    type: String,
    required: true,
  },
  pluginCreatedBy: {
    type: String,
    required: true,
  },
  pluginDesc: {
    type: String,
    required: true,
  },
  pluginInstallStatus: {
    type: Boolean,
    required: true,
    default: false,
  },
  installedOrgs: [
    { type: Schema.Types.ObjectId, required: false, default: [] },
  ],
});

module.exports = mongoose.model('PluginTemp', pluginSchema);
