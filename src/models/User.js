const mongoose = require('mongoose');
const { isEmail } = require('validator');
const mongoosePaginate = require('mongoose-paginate-v2');
const Schema = mongoose.Schema;

const userSchema = new Schema({
  image: {
    type: String,
  },
  tokenVersion: {
    type: Number,
    default: 0,
  },
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    validate: [isEmail, 'invalid email'],
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  appLanguageCode: {
    type: String,
    default: 'en',
    required: true,
  },
  createdOrganizations: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
    },
  ],
  createdEvents: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Event',
    },
  ],
  userType: {
    type: String,
    enum: ['USER', 'ADMIN', 'SUPERADMIN'],
    default: 'USER',
    required: true,
  },
  joinedOrganizations: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
    },
  ],
  registeredEvents: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Event',
    },
  ],
  eventAdmin: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Event',
    },
  ],
  adminFor: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
    },
  ],
  membershipRequests: [
    {
      type: Schema.Types.ObjectId,
      ref: 'MembershipRequest',
    },
  ],
  organizationsBlockedBy: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
    },
  ],
  status: {
    type: String,
    required: true,
    default: 'ACTIVE',
    enum: ['ACTIVE', 'BLOCKED', 'DELETED'],
  },
  organizationUserBelongsTo: {
    type: Schema.Types.ObjectId,
    ref: 'Organization',
  },
  pluginCreationAllowed: {
    type: Boolean,
    required: true,
    default: true,
  },
});

userSchema.plugin(mongoosePaginate);
module.exports = mongoose.model('User', userSchema);
