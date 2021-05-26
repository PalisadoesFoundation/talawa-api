const User = require('../../models/User');
const Comment = require('../../models/Comment');

const authCheck = require('../functions/authCheck');
const { NotFound } = require('../../core/errors');
const requestContext = require('../../core/libs/talawa-request-context');

const unlikeComment = async (parent, args, context) => {
  authCheck(context);
  const user = await User.findById(context.userId);
  if (!user) {
    throw new NotFound([
      {
        message: requestContext.translate('user.notFound'),
        code: 'user.notFound',
        param: 'user',
      },
    ]);
  }

  let comment = await Comment.findById(args.id);
  if (!comment) {
    throw new NotFound([
      {
        message: requestContext.translate('comment.notFound'),
        code: 'comment.notFound',
        param: 'comment',
      },
    ]);
  }
  if (comment.likedBy.includes(context.userId)) {
    let newComment = await Comment.findByIdAndUpdate(
      args.id,
      { $pull: { likedBy: context.userId }, $inc: { likeCount: -1 } },
      { new: true }
    );
    return newComment;
  }
  return comment;
};

module.exports = unlikeComment;
