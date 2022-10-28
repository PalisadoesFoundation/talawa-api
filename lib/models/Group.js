const mongoose = require('mongoose');

const Schema = mongoose.Schema;
/**
 * @name groupSchema
 * @function
 * @description This is the structure of a group
 * @param {String} title Title
 * @param {String} description Description
 * @param {Date} createdAt Created at Date
 * @param {String} status Status
 * @param {Schema.Types.ObjectId[]} admins Admins
 */
const groupSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  organization: {
    type: Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  },
  status: {
    type: String,
    required: true,
    default: 'ACTIVE',
    enum: ['ACTIVE', 'BLOCKED', 'DELETED'],
  },
  admins: [
    {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  ],
});

module.exports = mongoose.model('Group', groupSchema);
