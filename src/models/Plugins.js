const mongoose = require('mongoose');
const Schema = mongoose.Schema;

//this is the Structure of the Comments
const pluginSchema = new Schema({
  orgId: {
    type: Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  },
  pluginName: {
    type: String,
    required: true,
  },
  pluginKey: {
    type: String,
    required: false,
  },
  pluginStatus: {
    type: String,
    required: true,
    default: 'ACTIVE',
    enum: ['ACTIVE', 'BLOCKED', 'DELETED'],
  },
  pluginType: {
    type: String,
    required: true,
    default: 'UNIVERSAL',
    enum: ['UNIVERSAL', 'PRIVATE'],
  },
  adminAccessAllowed: {
    type: Boolean,
    required: true,
    default: true,
  },
  additionalInfo: [
    {
      type: Schema.Types.ObjectId,
      ref: 'PluginField',
      required: false,
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Plugin', pluginSchema);
