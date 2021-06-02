const User = require('../../models/User');
const Post = require('../../models/Post');
const { NotFoundError } = require('errors');
const requestContext = require('talawa-request-context');

module.exports = async (parent, args, context) => {
  const { org } = context;

  //gets user in token - to be used later on
  let user = await User.findOne({ _id: context.userId });
  if (!user) {
    throw new NotFoundError(
      requestContext.translate('user.notFound'),
      'user.notFound',
      'user'
    );
  }

  //find post
  let post = await Post.findOne({ _id: args.postId });
  if (!post) {
    throw new NotFoundError(
      requestContext.translate('post.notFound'),
      'post.notFound',
      'post'
    );
  }

  //remove post from organization
  org.overwrite({
    ...org._doc,
    posts: org._doc.posts.filter((post) => post !== args.postId),
  });
  await org.save();

  // //remove post from user
  // user.overwrite({
  //   ...user._doc,
  //   posts: user._doc.posts.filter((post) => post != args.postId),
  // });
  // await user.save();

  //delete post
  await Post.deleteOne({ _id: args.postId });

  //return user
  return {
    ...post._doc,
  };
};
