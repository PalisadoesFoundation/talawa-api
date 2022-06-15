const User = require('../../models/User');
const Comment = require('../../models/Comment');

const { NotFoundError } = require('../../helper_lib/errors');
const requestContext = require('../../helper_lib/request-context');

const likeComment = async (parent, args, context) => {
  const user = await User.findById(context.userId);
  if (!user) {
    throw new NotFoundError(
      requestContext.translate('user.notFound'),
      'user.notFound',
      'user'
    );
  }

  let comment = await Comment.findById(args.id);
  if (!comment) {
    throw new NotFoundError(
      requestContext.translate('comment.notFound'),
      'comment.notFound',
      'comment'
    );
  }
  if (!comment.likedBy.includes(context.userId)) {
    let newComment = await Comment.findByIdAndUpdate(
      args.id,
      { $push: { likedBy: user }, $inc: { likeCount: 1 } },
      { new: true }
    );
    return newComment;
  }
  return comment;
};

module.exports = likeComment;
