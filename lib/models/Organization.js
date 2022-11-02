const mongoose = require('mongoose');

const Schema = mongoose.Schema;

/**
 * @name organizationSchema
 * @description This is the structure of an Organization.
 * @function
 * @param {String} apiUrl API URL.
 * @param {String} image Organization image URL.
 * @param {String} name Organization name.
 * @param {String} description Organization description.
 * @param {String} location Organization location.
 * @param {Boolean} isPublic Organization visibility.
 * @param {Schema.Types.ObjectId} creator Organization creator, referring to `User` model.
 * @param {String} status Status.
 * @param {Schema.Types.ObjectId[]} members Collection of members, each object refer to `User` model.
 * @param {Schema.Types.ObjectId[]} admins Collection of organization admins, each object refer to `User` model.
 * @param {Schema.Types.ObjectId[]} groupChats Collection of group chats, each object refer to `Message` model.
 * @param {Schema.Types.ObjectId[]} posts Collection of Posts in the Organization, each object refer to `Post` model.
 * @param {Schema.Types.ObjectId[]} membershipRequests Collection of membership requests in the Organization, each object refer to `MembershipRequest` model.
 * @param {Schema.Types.ObjectId[]} blockedUsers Collection of Blocked User in the Organization, each object refer to `User` model.
 * @param {Array} tags Collection of tags.
 * @param {Date} createdAt Time stamp of data creation.
 */
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
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Organization', organizationSchema);
