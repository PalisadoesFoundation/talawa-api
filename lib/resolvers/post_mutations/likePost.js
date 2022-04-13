const User = require('../../models/User');
const Post = require('../../models/Post');

const { NotFoundError } = require('errors');
const requestContext = require('talawa-request-context');
const {
  NOT_FOUND_USER_MESSAGE,
  NOT_FOUND_USER_PARAM,
  NOT_FOUND_USER_CODE,
  NOT_FOUND_POST_MESSAGE,
  NOT_FOUND_POST_PARAM,
  NOT_FOUND_POST_CODE,
} = require('../../../constants');

const likePost = async (parent, args, context) => {
  const user = await User.findOne({ _id: context.userId });
  if (!user) {
    throw new NotFoundError(
      requestContext.translate(NOT_FOUND_USER_MESSAGE),
      NOT_FOUND_USER_CODE,
      NOT_FOUND_USER_PARAM
    );
  }

  const post = await Post.findOne({ _id: args.id });
  if (!post) {
    throw new NotFoundError(
      requestContext.translate(NOT_FOUND_POST_MESSAGE),
      NOT_FOUND_POST_CODE,
      NOT_FOUND_POST_PARAM
    );
  }

  if (!post.likedBy.includes(context.userId)) {
    const newPost = await Post.findOneAndUpdate(
      { _id: args.id },
      {
        $push: {
          likedBy: user,
        },
        $inc: {
          likeCount: 1,
        },
      },
      { new: true }
    );
    return newPost;
  }
  return post;
};

module.exports = likePost;
