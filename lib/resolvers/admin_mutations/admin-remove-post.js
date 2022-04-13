const User = require('../../models/User');
const Organization = require('../../models/Organization');
const Post = require('../../models/Post');
const adminCheck = require('../functions/adminCheck');
const { NotFoundError } = require('errors');
const requestContext = require('talawa-request-context');
const {
  NOT_FOUND_ORGANIZATION_CODE,
  NOT_FOUND_ORGANIZATION_PARAM,
  NOT_FOUND_ORGANIZATION_MESSAGE,
  NOT_FOUND_POST_CODE,
  NOT_FOUND_POST_PARAM,
  NOT_FOUND_POST_MESSAGE,
  NOT_FOUND_USER_CODE,
  NOT_FOUND_USER_PARAM,
  NOT_FOUND_USER_MESSAGE,
} = require('../../../constants');

module.exports = async (parent, args, context) => {
  //ensure organization exists
  let org = await Organization.findOne({ _id: args.organizationId });
  if (!org) {
    throw new NotFoundError(
      requestContext.translate(NOT_FOUND_ORGANIZATION_MESSAGE),
      NOT_FOUND_ORGANIZATION_CODE,
      NOT_FOUND_ORGANIZATION_PARAM
    );
  }

  //ensure user is an admin
  adminCheck(context, org);

  //gets user in token - to be used later on
  let user = await User.findOne({ _id: context.userId });
  if (!user) {
    throw new NotFoundError(
      requestContext.translate(NOT_FOUND_USER_MESSAGE),
      NOT_FOUND_USER_CODE,
      NOT_FOUND_USER_PARAM
    );
  }

  //find post
  let post = await Post.findOne({ _id: args.postId });
  if (!post) {
    throw new NotFoundError(
      requestContext.translate(NOT_FOUND_POST_MESSAGE),
      NOT_FOUND_POST_CODE,
      NOT_FOUND_POST_PARAM
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
