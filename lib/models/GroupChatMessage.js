const mongoose = require('mongoose');

const Schema = mongoose.Schema;

/**
 * @name groupChatMessageSchema
 * @function
 * @description This is the structure of a group chat message.
 * @param {Schema.Types.ObjectId} groupChatMessageBelongsTo This is the association referring to the `GroupChat` model.
 * @param {Schema.Types.ObjectId} sender Sender of the message.
 * @param {Date} createdAt Time stamp of data creation.
 * @param {String} messageContent Content of the message.
 * @param {String} status Status.
 */
const groupChatMessageSchema = new Schema({
  groupChatMessageBelongsTo: {
    type: Schema.Types.ObjectId,
    ref: 'GroupChat',
    required: true,
  },
  sender: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  createdAt: {
    type: Date,
    required: true,
  },
  messageContent: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    required: true,
    default: 'ACTIVE',
    enum: ['ACTIVE', 'BLOCKED', 'DELETED'],
  },
});

module.exports = mongoose.model('GroupChatMessage', groupChatMessageSchema);
