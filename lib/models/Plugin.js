const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**MongoDB Schema for plugins **/
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
    default: false
  },
  installedOrgs: [
    { type: Schema.Types.ObjectId, required: false, default: [] },
  ],

});

module.exports = mongoose.model('PluginTemp', pluginSchema);
