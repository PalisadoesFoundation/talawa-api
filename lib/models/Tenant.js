const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const tenantSchema = new Schema({
  organization: {
    type: Schema.Types.ObjectId,
    ref: 'Organizaiton',
  },
  url: {
    type: String,
    required: true,
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
