const User = require('../../models/User');
const { addTenantId, tenantCtx } = require('../../helper_functions');

const { NotFoundError } = require('errors');
const requestContext = require('talawa-request-context');

const unlikeComment = async (parent, args, context) => {
  const { db, id, tenantId } = await tenantCtx(args.id);
  const user = await User.findById(context.userId);
  if (!user) {
    throw new NotFoundError(
      requestContext.translate('user.notFound'),
      'user.notFound',
      'user'
    );
  }
  const { Comment } = db;
  let comment = await Comment.findById(id);
  if (!comment) {
    throw new NotFoundError(
      requestContext.translate('comment.notFound'),
      'comment.notFound',
      'comment'
    );
  }
  if (comment.likedBy.includes(context.userId)) {
    let newComment = await Comment.findByIdAndUpdate(
      id,
      { $pull: { likedBy: context.userId }, $inc: { likeCount: -1 } },
      { new: true }
    );
    newComment._doc._id = addTenantId(newComment._id, tenantId);
    return newComment;
  }
  comment._doc._id = addTenantId(comment._id, tenantId);
  return comment;
};

module.exports = unlikeComment;
