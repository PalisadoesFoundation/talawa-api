const User = require('../../models/User');
const Post = require('../../models/Post');

const authCheck = require('../functions/authCheck');
const { NotFound } = require('../../core/errors');
const requestContext = require('../../core/libs/talawa-request-context');

const unlikePost = async (parent, args, context) => {
  authCheck(context);
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

  const post = await Post.findOne({ _id: args.id });
  if (!post) {
    throw new NotFound([
      {
        message: requestContext.translate('post.notFound'),
        code: 'post.notFound',
        param: 'post',
      },
    ]);
  }
  if (post.likedBy.includes(context.userId)) {
    const newPost = await Post.findOneAndUpdate(
      { _id: args.id },
      {
        $pull: {
          likedBy: context.userId,
        },
      },
      { new: true }
    );

    return newPost;
  }
  return post;
};

module.exports = unlikePost;
