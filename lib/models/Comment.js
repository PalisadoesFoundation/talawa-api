const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * @name commentSchema
 * @function
 * @description This is the Structure of the Comments
 * @param {string} text Text
 * @param {Date} createdAt Date when the comment was created
 * @param {Schema.Types.ObjectId} creator Creator of the comment
 * @param {Schema.Types.ObjectId} post Post to which the comment has been made
 * @param {Schema.Types.ObjectId} likedBy Liked by whom
 * @param {Number} likeCount No of likes
 * @param {string} status whether the comment is active, blocked or deleted.
 */
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
