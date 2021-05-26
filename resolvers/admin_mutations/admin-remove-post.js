const User = require('../../models/User');
const Organization = require('../../models/Organization');
const authCheck = require('../functions/authCheck');
const adminCheck = require('../functions/adminCheck');
const Post = require('../../models/Post');
const { NotFound } = require('../../core/errors');
const requestContext = require('../../core/libs/talawa-request-context');

module.exports = async (parent, args, context) => {
  authCheck(context);
  //ensure organization exists
  let org = await Organization.findOne({ _id: args.organizationId });
  if (!org) {
    throw new NotFound([
      {
        message: requestContext.translate('organization.notFound'),
        code: 'organization.notFound',
        param: 'organization',
      },
    ]);
  }

  //ensure user is an admin
  adminCheck(context, org);

  //gets user in token - to be used later on
  let user = await User.findOne({ _id: context.userId });
  if (!user) {
    throw new NotFound([
      {
        message: requestContext.translate('user.notFound'),
        code: 'user.notFound',
        param: 'user',
      },
    ]);
  }

  //find post
  let post = await Post.findOne({ _id: args.postId });
  if (!post) {
    throw new NotFound([
      {
        message: requestContext.translate('post.notFound'),
        code: 'post.notFound',
        param: 'post',
      },
    ]);
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
