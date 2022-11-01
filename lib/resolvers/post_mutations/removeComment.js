const User = require('../../models/User');
const tenantCtx = require('../../helper_functions/tenantCtx');
const { addTenantId } = require('../../helper_functions/');

const { NotFoundError, UnauthorizedError } = require('errors');
const requestContext = require('talawa-request-context');

const removeComment = async (parent, args, context) => {
  const { db, id, tenantId } = await tenantCtx(args.id);
  const user = await User.findOne({ _id: context.userId });
  if (!user) {
    throw new NotFoundError(
      requestContext.translate('user.notFound'),
      'user.notFound',
      'user'
    );
  }
  const { Comment, Post } = db;
  const comment = await Comment.findOne({ _id: id });
  if (!comment) {
    throw new NotFoundError(
      requestContext.translate('comment.notFound'),
      'comment.notFound',
      'comment'
    );
  }

  if (!(comment.creator !== context.userId)) {
    throw new UnauthorizedError(
      requestContext.translate('user.notAuthorized'),
      'user.notAuthorized',
      'userAuthorization'
    );
  }

  await Post.updateOne(
    { _id: comment.post },
    {
      $pull: {
        comments: id,
      },
      $inc: {
        commentCount: -1,
      },
    }
  );

  await Comment.deleteOne({ _id: id });
  comment._doc._id = addTenantId(comment._id, tenantId);
  return comment;
};

module.exports = removeComment;
