const User = require('../../models/User');
const Post = require('../../models/Post');

const { NotFoundError, UnauthorizedError } = require('errors');
const requestContext = require('talawa-request-context');

const {
  NOT_FOUND_USER_MESSAGE,
  NOT_FOUND_USER_PARAM,
  NOT_FOUND_USER_CODE,
  NOT_FOUND_POST_MESSAGE,
  NOT_FOUND_POST_PARAM,
  NOT_FOUND_POST_CODE,
  NOT_AUTHORIZED_USER_CODE,
  NOT_AUTHORIZED_USER_MESSAGE,
  NOT_AUTHORIZED_USER_PARAM,
} = require('../../../constants');

const removePost = async (parent, args, context) => {
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

  if (!(post.creator !== context.userId)) {
    throw new UnauthorizedError(
      requestContext.translate(NOT_AUTHORIZED_USER_MESSAGE),
      NOT_AUTHORIZED_USER_CODE,
      NOT_AUTHORIZED_USER_PARAM
    );
  }

  await Post.deleteOne({ _id: args.id });
  return post;
};

module.exports = removePost;
