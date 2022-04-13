const User = require('../../models/User');
const Organization = require('../../models/Organization');
const adminCheck = require('../functions/adminCheck');
const { NotFoundError } = require('errors');
const requestContext = require('talawa-request-context');

const Group = require('../../models/Group');

const {
  NOT_FOUND_ORGANIZATION_CODE,
  NOT_FOUND_ORGANIZATION_PARAM,
  NOT_FOUND_ORGANIZATION_MESSAGE,
  NOT_FOUND_GROUP_CODE,
  NOT_FOUND_GROUP_PARAM,
  NOT_FOUND_GROUP_MESSAGE,
  NOT_FOUND_USER_CODE,
  NOT_FOUND_USER_PARAM,
  NOT_FOUND_USER_MESSAGE,
} = require('../../../constants');

module.exports = async (parent, args, context) => {
  //find message
  let group = await Group.findOne({ _id: args.groupId });
  if (!group) {
    throw new NotFoundError(
      requestContext.translate(NOT_FOUND_GROUP_MESSAGE),
      NOT_FOUND_GROUP_CODE,
      NOT_FOUND_GROUP_PARAM
    );
  }

  //ensure organization exists
  let org = await Organization.findOne({ _id: group._doc.organization._id });
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

  //remove message from organization
  // org.overwrite({
  //   ...org._doc,
  //   messages: org._doc.posts.filter((message) => message != args.messageId),
  // });
  // await org.save();

  // //remove post from user
  // user.overwrite({
  //   ...user._doc,
  //   messages: user._doc.posts.filter((message) => message != args.messageId),
  // });
  // await user.save();

  //delete post
  await Group.deleteOne({ _id: args.groupId });

  //return user
  return {
    ...group._doc,
  };
};
