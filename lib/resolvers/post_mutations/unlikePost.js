const User = require('../../models/User');
const { addTenantId, tenantCtx } = require('../../helper_functions');

const { NotFoundError } = require('errors');
const requestContext = require('talawa-request-context');

const unlikePost = async (parent, args, context) => {
  const { db, id, tenantId } = await tenantCtx(args.id);
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
  if (post.likedBy.includes(context.userId)) {
    const newPost = await Post.findOneAndUpdate(
      { _id: id },
      {
        $pull: {
          likedBy: context.userId,
        },
        $inc: {
          likeCount: -1,
        },
      },
      { new: true }
    );
    newPost._doc._id = addTenantId(newPost._id, tenantId);
    return newPost;
  }
  post._doc._id = addTenantId(post._id, tenantId);
  return post;
};

module.exports = unlikePost;
