const User = require('../../models/User');
const Post = require('../../models/Post');

const authCheck = require('../functions/authCheck');
const { NotFound, Unauthorized } = require('../../core/errors');
const requestContext = require('../../core/libs/talawa-request-context');

const removePost = async (parent, args, context) => {
  authCheck(context);
  const user = await User.findOne({ _id: context.userId });
  if (!user) {
    throw new NotFound(
      requestContext.translate('user.notFound'),
      'user.notFound',
      'user'
    );
  }

  const post = await Post.findOne({ _id: args.id });
  if (!post) {
    throw new NotFound(
      requestContext.translate('post.notFound'),
      'post.notFound',
      'post'
    );
  }

  if (!(post.creator !== context.userId)) {
    throw new Unauthorized(
      requestContext.translate('user.notAuthorized'),
      'user.notAuthorized',
      'userAuthorization'
    );
  }

  await Post.deleteOne({ _id: args.id });
  return post;
};

module.exports = removePost;
