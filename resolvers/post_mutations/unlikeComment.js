const User = require('../../models/User');
const Comment = require('../../models/Comment');

const authCheck = require('../functions/authCheck');

const unlikeComment = async (parent, args, context) => {
  authCheck(context);
  const user = await User.findById(context.userId);
  if (!user) throw new Error('User does not exist');

  let comment = await Comment.findById(args.id);
  if (!comment) {
    throw new Error('Comment not found');
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
