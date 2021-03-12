const mongoose = require('mongoose');

const { Schema } = mongoose;


//this is the Structure of the Comments
const commentSchema = new Schema({
  text: {
    type: String,
    required: true,
  },
  createdAt: { type: Date, default: Date.now },
  creator: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  post: {
    type: Schema.Types.ObjectId,
    ref: 'Post',
    required: true,
  },
});

module.exports = mongoose.model('Comment', commentSchema);
