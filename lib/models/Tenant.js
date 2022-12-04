const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const tenantSchema = new Schema({
  organization: {
    type: Schema.Types.ObjectId,
    ref: 'Organizaiton',
    required: true,
  },
  url: {
    type: String,
    required: true,
  },
  scheme: {
    type: [String],
    default: [],
  },
  type: {
    type: String,
    enum: ['MONGO', 'POSTGRES'],
    default: 'MONGO',
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

module.exports = mongoose.model('Tenant', tenantSchema);
