const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * @name pluginFieldSchema
 * @description This is the structure of a Plugin Field.
 * @function
 * @param {String} key Plugin key.
 * @param {String} value Value.
 * @param {String} status Status.
 * @param {Date} createdAt Time stamp of data creation.
 */
const pluginFieldSchema = new Schema({
  key: {
    type: String,
    required: true,
  },
  value: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    required: true,
    default: 'ACTIVE',
    enum: ['ACTIVE', 'BLOCKED', 'DELETED'],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('PluginField', pluginFieldSchema);
