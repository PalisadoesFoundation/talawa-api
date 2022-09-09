const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const organizationSchema = new Schema({
  apiUrl: {
    type: String,
  },
  image: {
    type: String,
  },
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  location: {
    type: String,
  },
  isPublic: {
    type: Boolean,
    required: true,
  },
  creator: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  status: {
    type: String,
    required: true,
    default: 'ACTIVE',
    enum: ['ACTIVE', 'BLOCKED', 'DELETED'],
  },
  members: [
    {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  ],
  admins: [
    {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  ],
  groupChats: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Message',
    },
  ],
  posts: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Post',
    },
  ],
  membershipRequests: [
    {
      type: Schema.Types.ObjectId,
      ref: 'MembershipRequest',
    },
  ],
  blockedUsers: [
    {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  ],
  visibleInSearch: Boolean,
  tags: [],
  functionality: {
    type: [String],
    required: true,
    default: ['DirectChat', 'Posts', 'Events', 'Groups', 'GroupChats'],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Organization', organizationSchema);
