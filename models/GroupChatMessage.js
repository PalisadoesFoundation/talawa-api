const mongoose = require('mongoose');

const { Schema } = mongoose;

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
    type: String,
    required: true,
  },
  messageContent: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model('GroupChatMessage', groupChatMessageSchema);
