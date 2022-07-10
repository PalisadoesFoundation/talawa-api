const { User, Post, Comment } = require('../../models');
const { NotFoundError } = require('../../libraries/errors');
const requestContext = require('../../libraries/request-context');

module.exports = async (parent, args, context) => {
  // gets user in token - to be used later on
  const user = await User.findOne({ _id: context.userId });
  if (!user) {
    throw new NotFoundError(
      requestContext.translate('user.notFound'),
      'user.notFound',
      'user'
    );
  }

  let newComment = new Comment({
    ...args.data,
    creator: context.userId,
    post: args.postId,
  });

  await Post.updateOne(
    { _id: args.postId },
    {
      $push: {
        comments: newComment,
      },
      $inc: {
        commentCount: 1,
      },
    }
  );

  newComment = await newComment.save();

  return {
    ...newComment._doc,
  };
};
