const User = require('../../models/User');
const Organization = require('../../models/Organization');
const authCheck = require('../functions/authCheck');
const adminCheck = require('../functions/adminCheck');
const Post = require('../../models/Post');

module.exports = async (parent, args, context) => {
  authCheck(context);
  // ensure organization exists
  const org = await Organization.findOne({ _id: args.organizationId });
  if (!org) throw new Error('Organization not found');

  // ensure user is an admin
  adminCheck(context, org);

  // gets user in token - to be used later on
  const user = await User.findOne({ _id: context.userId });
  if (!user) {
    throw new Error('User does not exist');
  }

  // find post
  const post = await Post.findOne({ _id: args.postId });
  if (!post) throw new Error('Post does not exist');

  // remove post from organization
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

  // delete post
  await Post.deleteOne({ _id: args.postId });

  // return user
  return {
    ...post._doc,
  };
};
