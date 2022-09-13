const User = require('../../models/User');
const tenantCtx = require('../../helper_functions/tenantCtx');
const { addTenantId } = require('../../helper_functions/');
// const Post = require('../../models/Post');

const { NotFoundError, UnauthorizedError } = require('errors');
const requestContext = require('talawa-request-context');

const removePost = async (parent, args, context) => {
  const { id, db, tenantId } = await tenantCtx(args.id);
  const user = await User.findOne({ _id: context.userId });
  if (!user) {
    throw new NotFoundError(
      requestContext.translate('user.notFound'),
      'user.notFound',
      'user'
    );
  }

  const { Post } = db;

  const post = await Post.findOne({ _id: id });
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

  await Post.deleteOne({ _id: id });
  post._doc._id = addTenantId(post._id, tenantId);
  return post;
};

module.exports = removePost;
