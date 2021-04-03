const User = require('../../models/User');
const Post = require('../../models/Post');

const authCheck = require('../functions/authCheck');

const savePost = async (parent, args, context) => {
  authCheck(context);
  const user = await User.findOne({ _id: context.userId });
  if (!user) throw new Error('User does not exist');

  const post = await Post.findOne({ _id: args.id });
  if (!post) {
    throw new Error('Post not found');
  }

  if (user.savedPosts.includes(post._id)) {
    return 'Post Already Saved';
  }

  user.savedPosts.push(post);

  await user.save();

  return 'Post Saved';
};

module.exports = savePost;
