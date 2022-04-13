const User = require('../../models/User');
const Comment = require('../../models/Comment');
const Post = require('../../models/Post');

const { NotFoundError } = require('errors');
const requestContext = require('talawa-request-context');

const {
  NOT_FOUND_USER_MESSAGE,
  NOT_FOUND_USER_PARAM,
  NOT_FOUND_USER_CODE,
} = require('../../../constants');

module.exports = async (parent, args, context) => {
  // gets user in token - to be used later on
  const user = await User.findOne({ _id: context.userId });
  if (!user) {
    throw new NotFoundError(
      requestContext.translate(NOT_FOUND_USER_MESSAGE),
      NOT_FOUND_USER_CODE,
      NOT_FOUND_USER_PARAM
    );
  }

  let newComment = new Comment({
    ...args.data,
    creator: context.userId,
    post: args.postId,
  });

  await Post.updateOne(
    { _id: args.postId },
    {
      $push: {
        comments: newComment,
      },
      $inc: {
        commentCount: 1,
      },
    }
  );

  newComment = await newComment.save();

  return {
    ...newComment._doc,
  };
};
