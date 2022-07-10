const { User, Post } = require('../../models');
const { NotFoundError, UnauthorizedError } = require('../../libraries/errors');
const requestContext = require('../../libraries/request-context');

const removePost = async (parent, args, context) => {
  const user = await User.findOne({ _id: context.userId });
  if (!user) {
    throw new NotFoundError(
      requestContext.translate('user.notFound'),
      'user.notFound',
      'user'
    );
  }

  const post = await Post.findOne({ _id: args.id });
  if (!post) {
    throw new NotFoundError(
      requestContext.translate('post.notFound'),
      'post.notFound',
      'post'
    );
  }

  if (!(post.creator !== context.userId)) {
    throw new UnauthorizedError(
      requestContext.translate('user.notAuthorized'),
      'user.notAuthorized',
      'userAuthorization'
    );
  }

  await Post.deleteOne({ _id: args.id });
  return post;
};

module.exports = removePost;
