const User = require('../../models/User');
const Comment = require('../../models/Comment');
const Post = require('../../models/Post');

const { NotFoundError, UnauthorizedError } = require('errors');
const requestContext = require('talawa-request-context');
const {
  NOT_FOUND_USER_MESSAGE,
  NOT_FOUND_USER_PARAM,
  NOT_FOUND_USER_CODE,
  NOT_FOUND_COMMENT_MESSAGE,
  NOT_FOUND_COMMENT_PARAM,
  NOT_FOUND_COMMENT_CODE,
  NOT_AUTHORIZED_USER_CODE,
  NOT_AUTHORIZED_USER_MESSAGE,
  NOT_AUTHORIZED_USER_PARAM,
} = require('../../../constants');

const removeComment = async (parent, args, context) => {
  const user = await User.findOne({ _id: context.userId });
  if (!user) {
    throw new NotFoundError(
      requestContext.translate(NOT_FOUND_USER_MESSAGE),
      NOT_FOUND_USER_CODE,
      NOT_FOUND_USER_PARAM
    );
  }

  const comment = await Comment.findOne({ _id: args.id });
  if (!comment) {
    throw new NotFoundError(
      requestContext.translate(NOT_FOUND_COMMENT_MESSAGE),
      NOT_FOUND_COMMENT_CODE,
      NOT_FOUND_COMMENT_PARAM
    );
  }

  if (!(comment.creator !== context.userId)) {
    throw new UnauthorizedError(
      requestContext.translate(NOT_AUTHORIZED_USER_MESSAGE),
      NOT_AUTHORIZED_USER_CODE,
      NOT_AUTHORIZED_USER_PARAM
    );
  }

  await Post.updateOne(
    { _id: comment.post },
    {
      $pull: {
        comments: args.id,
      },
      $inc: {
        commentCount: -1,
      },
    }
  );

  await Comment.deleteOne({ _id: args.id });
  return comment;
};

module.exports = removeComment;
