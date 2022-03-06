const User = require('../../models/User');
const Post = require('../../models/Post');

const { NotFoundError } = require('errors');
const requestContext = require('talawa-request-context');

const unlikePost = async (parent, args, context) => {
  const user = await User.findOne({ _id: context.userId });
  if (!user) {
    throw new NotFoundError(
      requestContext.translate('user.notFound'),
      'user.notFound',
      'user'
    );
  }

  const post = await Post.findOne({ _id: args.id });
  if (!post) {
    throw new NotFoundError(
      requestContext.translate('post.notFound'),
      'post.notFound',
      'post'
    );
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
