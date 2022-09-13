const { NotFoundError } = require('errors');
const requestContext = require('talawa-request-context');
const { addTenantId, tenantCtx } = require('../../helper_functions');

const User = require('../../models/User');
const Organization = require('../../models/Organization');

module.exports = async (parent, args) => {
  const { id, db, tenantId } = await tenantCtx(args.id);
  const { Post } = db;
  const postFound = await Post.findOne({
    _id: id,
  })
    .populate('creator', '-password', User)
    .populate({
      path: 'comments',
      populate: {
        path: 'creator',
        model: User,
      },
    })
    .populate('likedBy', '', User)
    .populate('organization', '', Organization);

  if (!postFound) {
    throw new NotFoundError(
      process.env.NODE_ENV !== 'production'
        ? 'Post not found'
        : requestContext.translate('post.notFound'),
      'post.notFound',
      'post'
    );
  }
  postFound.likeCount = postFound.likedBy.length || 0;
  postFound.commentCount = postFound.comments.length || 0;
  postFound._doc._id = addTenantId(postFound._id, tenantId);
  console.log('post: ', postFound);
  return postFound;
};
