const mongoose = require('mongoose');

const { Schema } = mongoose;

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
});

module.exports = mongoose.model('MembershipRequest', membershipRequestSchema);
