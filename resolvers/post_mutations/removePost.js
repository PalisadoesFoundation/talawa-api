const User = require('../../models/User');
const Post = require('../../models/Post');

const authCheck = require('../functions/authCheck');
const { NotFound, Unauthorized } = require('../../core/errors');
const requestContext = require('../../core/libs/talawa-request-context');

const removePost = async (parent, args, context) => {
  authCheck(context);
  const user = await User.findOne({ _id: context.userId });
  if (!user) {
    throw new NotFound([
      {
        message: requestContext.translate('user.notFound'),
        code: 'user.notFound',
        param: 'user',
      },
    ]);
  }

  const post = await Post.findOne({ _id: args.id });
  if (!post) {
    throw new NotFound([
      {
        message: requestContext.translate('post.notFound'),
        code: 'post.notFound',
        param: 'post',
      },
    ]);
  }

  if (!(post.creator !== context.userId)) {
    throw new Unauthorized([
      {
        message: requestContext.translate('user.notAuthorized'),
        code: 'user.notAuthorized',
        param: 'userAuthorization',
      },
    ]);
  }

  await Post.deleteOne({ _id: args.id });
  return post;
};

module.exports = removePost;
