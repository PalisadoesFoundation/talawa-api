const mongoose = require('mongoose');

const Schema = mongoose.Schema;
/**
 * @name groupChatSchema
 * @function
 * @description This is the structure of a group chat
 * @param {String} title Title
 * @param {Schema.Types.ObjectId[]} users Users of the chat
 * @param {Schema.Types.ObjectId[]} messages Message of the chat
 * @param {Schema.Types.ObjectId} creator Creator of the chat
 * @param {Schema.Types.ObjectId} organization Organization
 * @param {String} status Status
 */
const groupChatSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
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
      ref: 'GroupChatMessage',
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

module.exports = mongoose.model('GroupChat', groupChatSchema);
