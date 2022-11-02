const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * @name messageSchema
 * @description This is the structure of a message.
 * @function
 * @param {String} text Message content.
 * @param {String} imageUrl Image URL attached in the message.
 * @param {String} videoUrl Video URL attached in the message.
 * @param {Date} createdAt Time stamp of data creation.
 * @param {Schema.Types.ObjectId} creator Message Sender(User), referring to `User` model.
 * @param {Schema.Types.ObjectId} group group data, referring to `Group` model.
 * @param {String} status Status.
 */
const messageSchema = new Schema({
  text: {
    type: String,
    required: true,
  },
  imageUrl: {
    type: String,
    required: false,
  },
  videoUrl: {
    type: String,
    required: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  creator: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  group: {
    type: Schema.Types.ObjectId,
    ref: 'Group',
    required: true,
  },
  status: {
    type: String,
    required: true,
    default: 'ACTIVE',
    enum: ['ACTIVE', 'BLOCKED', 'DELETED'],
  },
});

module.exports = mongoose.model('Message', messageSchema);
