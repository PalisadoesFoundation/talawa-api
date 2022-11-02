/* eslint-disable prettier/prettier */
const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const Schema = mongoose.Schema;

/**
 * @name postSchema
 * @description This is the structure of a Post.
 * @function
 * @param {String} text Post description.
 * @param {String} title Post title.
 * @param {String} status Status.
 * @param {Date} createdAt Time stamp of data creation.
 * @param {String} imageUrl Post attached image URL(if attached).
 * @param {String} videoUrl Post attached video URL(if attached).
 * @param {Schema.Types.ObjectId} creator Post creator, refer to `User` model.
 * @param {Schema.Types.ObjectId} organization Organization data where the post is uploaded, refer to `Organization` model.
 * @param {Schema.Types.ObjectId[]} likedBy Collection of user liked the post, each object refer to `User` model.
 * @param {Schema.Types.ObjectId[]} comments Collection of user commented on the post, each object refer to `Comment` model.
 * @param {Number} likeCount Post likes count.
 * @param {Number} commentCount Post comments count.
 */
const postSchema = new Schema({
  text: {
    type: String,
    required: true,
  },
  title: {
    type: String,
  },
  status: {
    type: String,
    required: true,
    default: 'ACTIVE',
    enum: ['ACTIVE', 'BLOCKED', 'DELETED'],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  imageUrl: {
    type: String,
    required: false,
  },
  videoUrl: {
    type: String,
    required: false,
  },
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
  likedBy: [
    {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  ],
  comments: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Comment',
    },
  ],
  likeCount: {
    type: Number,
    default: 0,
  },
  commentCount: {
    type: Number,
    default: 0,
  },
});

postSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Post', postSchema);
