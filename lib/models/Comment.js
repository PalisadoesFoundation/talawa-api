const mongoose = require('mongoose');
const Schema = mongoose.Schema;

//this is the Structure of the Comments
const commentSchema = new Schema({
  text: {
    type: String,
    required: true,
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
  post: {
    type: Schema.Types.ObjectId,
    ref: 'Post',
    required: true,
  },
  likedBy: [
    {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  ],
  likeCount: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    required: true,
    default: 'ACTIVE',
    enum: ['ACTIVE', 'BLOCKED', 'DELETED'],
  },
});

module.exports = mongoose.model('Comment', commentSchema);
