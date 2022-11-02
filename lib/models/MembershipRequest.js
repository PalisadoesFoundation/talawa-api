const mongoose = require('mongoose');

const { Schema } = mongoose;

/**
 * @name membershipRequestSchema
 * @function
 * @description This is the structure of a Membership Request.
 * @param {Schema.Types.ObjectId} organization Organization data for which membership request is added.
 * @param {Schema.Types.ObjectId} user User data who requested membership for an organization.
 * @param {String} status Status.
 */
const membershipRequestSchema = new Schema({
  organization: {
    type: Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  status: {
    type: String,
    required: true,
    default: 'ACTIVE',
    enum: ['ACTIVE', 'BLOCKED', 'DELETED'],
  },
});

module.exports = mongoose.model('MembershipRequest', membershipRequestSchema);
