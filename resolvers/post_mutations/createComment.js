const User = require('../../models/User');
const Comment = require('../../models/Comment');
const Post = require('../../models/Post');

const authCheck = require('../functions/authCheck');
const { NotFound } = require('../../core/errors');
const requestContext = require('../../core/libs/talawa-request-context');

module.exports = async (parent, args, context) => {
  // ensure user is authenticated
  authCheck(context);
  // gets user in token - to be used later on
  const user = await User.findOne({ _id: context.userId });
  if (!user) {
    throw new NotFound([
      {
        message: requestContext.translate('user.notFound'),
        code: 'user.notFound',
        param: 'user',
      },
    ]);
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
