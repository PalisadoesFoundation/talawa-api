const mongoose = require('mongoose');
const Schema = mongoose.Schema;
/**
 * @name chatSchema
 * @function
 * @description This the structure of a chat
 * @param {string} message Chat message
 * @param {boolean} languageBarrier
 * @param {Schema.Types.ObjectId} sender Sender
 * @param {Schema.Types.ObjectId} receiver Receiver
 * @param {Date} createdAt Date when the chat was created
 */
const chatSchema = new Schema({
  message: {
    type: String,
    required: true,
  },
  languageBarrier: {
    type: Boolean,
    required: false,
    default: false,
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
    default: Date.now,
  },
});

module.exports = mongoose.model('MessageChat', chatSchema);
