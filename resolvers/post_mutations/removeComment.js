const User = require('../../models/User');
const Comment = require('../../models/Comment');
const Post = require('../../models/Post');

const authCheck = require('../functions/authCheck');

const removeComment = async (parent, args, context) => {
  authCheck(context);
  const user = await User.findOne({ _id: context.userId });
  if (!user) throw new Error('User does not exist');

  const comment = await Comment.findOne({ _id: args.id });
  if (!comment) throw new Error('Comment not found');

  if (!(comment.creator !== context.userId)) {
    throw new Error("User cannot delete comment they didn't create");
  }

  await Post.updateOne(
    { _id: comment.post },
    {
      $pull: {
        comments: args.id,
      },
    }
  );

  await Comment.deleteOne({ _id: args.id });
  return comment;
};

module.exports = removeComment;
