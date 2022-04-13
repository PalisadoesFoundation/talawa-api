const User = require('../../models/User');
const Comment = require('../../models/Comment');

const { NotFoundError } = require('errors');
const requestContext = require('talawa-request-context');

const {
  NOT_FOUND_USER_MESSAGE,
  NOT_FOUND_USER_PARAM,
  NOT_FOUND_USER_CODE,
  NOT_FOUND_COMMENT_MESSAGE,
  NOT_FOUND_COMMENT_PARAM,
  NOT_FOUND_COMMENT_CODE,
} = require('../../../constants');

const unlikeComment = async (parent, args, context) => {
  const user = await User.findById(context.userId);
  if (!user) {
    throw new NotFoundError(
      requestContext.translate(NOT_FOUND_USER_MESSAGE),
      NOT_FOUND_USER_CODE,
      NOT_FOUND_USER_PARAM
    );
  }

  let comment = await Comment.findById(args.id);
  if (!comment) {
    throw new NotFoundError(
      requestContext.translate(NOT_FOUND_COMMENT_MESSAGE),
      NOT_FOUND_COMMENT_CODE,
      NOT_FOUND_COMMENT_PARAM
    );
  }
  if (comment.likedBy.includes(context.userId)) {
    let newComment = await Comment.findByIdAndUpdate(
      args.id,
      { $pull: { likedBy: context.userId }, $inc: { likeCount: -1 } },
      { new: true }
    );
    return newComment;
  }
  return comment;
};

module.exports = unlikeComment;
