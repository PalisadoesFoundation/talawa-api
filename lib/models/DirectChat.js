const mongoose = require('mongoose');

const Schema = mongoose.Schema;

/**
 * @name directChatSchema
 * @function
 * @description This is the Structure of the direct chat.
 * @param {Schema.Types.ObjectId} users Users of the chat
 * @param {Schema.Types.ObjectId} messages Messages
 * @param {Schema.Types.ObjectId} creator Creator of the chat
 * @param {Schema.Types.ObjectId} organization Organization
 * @param {String} status whether the chat is active, blocked or deleted.
 */
const directChatSchema = new Schema({
  users: [
    {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  ],
  messages: [
    {
      type: Schema.Types.ObjectId,
      ref: 'DirectChatMessage',
    },
  ],
  creator: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
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
});

module.exports = mongoose.model('DirectChat', directChatSchema);
