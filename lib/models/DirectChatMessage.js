const mongoose = require('mongoose');

const Schema = mongoose.Schema;

/**
 * @name directChatMessageSchema
 * @function
 * @description This is the Structure of the Direct chats
 * @param {Schema.Types.ObjectId} directChatMessageBelongsTo To whom the direct chat messages belong
 * @param {Schema.Types.ObjectId} sender Sender
 * @param {Schema.Types.ObjectId} receiver Receiver
 * @param {Date} createdAt Date when the message was created
 * @param {String} messageContent Message content
 * @param {status} status whether the message is active, blocked or deleted
 */
const directChatMessageSchema = new Schema({
  directChatMessageBelongsTo: {
    type: Schema.Types.ObjectId,
    ref: 'DirectChat',
    required: true,
  },
  sender: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  receiver: {
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

module.exports = mongoose.model('DirectChatMessage', directChatMessageSchema);
