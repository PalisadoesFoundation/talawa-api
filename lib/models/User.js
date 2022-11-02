const mongoose = require('mongoose');
const { isEmail } = require('validator');
const mongoosePaginate = require('mongoose-paginate-v2');
const Schema = mongoose.Schema;

/**
 * @name userSchema
 * @description This is the structure of an User Object.
 * @function
 * @param {String} image User Image URL.
 * @param {Number} tokenVersion Token version.
 * @param {String} firstName User First Name.
 * @param {String} token Access token.
 * @param {String} lastName User Last Name.
 * @param {String} email User email id.
 * @param {String} password User hashed password.
 * @param {String} appLanguageCode User's app language code.
 * @param {Schema.Types.ObjectId[]} createdOrganizations Collection of all organization created by the user, each object refer to `Organization` model.
 * @param {Schema.Types.ObjectId[]} createdEvents Collection of all events created by the user, each object refer to `Event` model.
 * @param {String} userType User type.
 * @param {Schema.Types.ObjectId[]} joinedOrganizations Collection of the organization where user is the member, each object refer to `Organization` model.
 * @param {Schema.Types.ObjectId[]} registeredEvents Collection of user registered Events, each object refer to `Event` model.
 * @param {Schema.Types.ObjectId[]} eventAdmin Collection of the event admins, each object refer to `Event` model.
 * @param {Schema.Types.ObjectId[]} adminFor Collection of organization where user is admin, each object refer to `Organization` model.
 * @param {Schema.Types.ObjectId[]} membershipRequests Collections of the membership request, each object refer to `MembershipRequest` model.
 * @param {Schema.Types.ObjectId[]} organizationsBlockedBy Collections of organizations where user is blocked, each object refer to `Organization` model.
 * @param {String} status Status
 * @param {Schema.Types.ObjectId} organizationUserBelongsTo Organization where user belongs to currently.
 * @param {Boolean} pluginCreationAllowed Wheather user is allowed to create plugins.
 * @param {Boolean} adminApproved Wheather user is admin approved.
 * @param {Date} createdAt Time stamp of data creation.
 * 
 */
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
  token: {
    type: String,
    required: false,
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
  adminApproved: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

userSchema.plugin(mongoosePaginate);
module.exports = mongoose.model('User', userSchema);
