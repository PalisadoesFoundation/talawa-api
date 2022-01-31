const User = require('../../models/User');
const Comment = require('../../models/Comment');
const Post = require('../../models/Post');

const { NotFoundError } = require('errors');
const requestContext = require('talawa-request-context');

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
    }
  );

  newComment = await newComment.save();

  return {
    ...newComment._doc,
  };
};
