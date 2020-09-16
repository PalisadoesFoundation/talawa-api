const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const groupChatSchema = new Schema({
  users: [
    {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  ],
  messages: [
    {
      type: Schema.Types.ObjectId,
      ref: "GroupChatMessage",
    },
  ],
  creator: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  organization: {
    type: Schema.Types.ObjectId,
    ref: "Organization",
    required: true
  }
});

module.exports = mongoose.model("GroupChat", groupChatSchema);
