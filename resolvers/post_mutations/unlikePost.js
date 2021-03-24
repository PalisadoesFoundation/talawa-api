const User = require('../../models/User');
const Post = require('../../models/Post');

const authCheck = require('../functions/authCheck');

const unlikePost = async (parent, args, context) => {
  authCheck(context);
  const user = await User.findOne({ _id: context.userId });
  if (!user) throw new Error('User does not exist');

  const post = await Post.findOne({ _id: args.id });
  if (!post) {
    throw new Error('Post not found');
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
