const User = require('../../models/User');
const Organization = require('../../models/Organization');
const { NotFoundError, ConflictError, UnauthorizedError } = require('errors');
const requestContext = require('talawa-request-context');
const {
  NOT_FOUND_ORGANIZATION_MESSAGE,
  NOT_FOUND_ORGANIZATION_CODE,
  NOT_FOUND_ORGANIZATION_PARAM,
  NOT_FOUND_USER_MESSAGE,
  NOT_FOUND_USER_CODE,
  NOT_FOUND_USER_PARAM,

  CONFLICT_ALREADY_MEMBER_CODE,
  CONFLICT_ALREADY_MEMBER_MESSAGE,
  CONFLICT_ALREADY_MEMBER_PARAM,
  NOT_AUTHORIZED_USER_CODE,
  NOT_AUTHORIZED_USER_MESSAGE,
  NOT_AUTHORIZED_USER_PARAM,
} = require('../../../constants');

module.exports = async (parent, args, context) => {
  // ensure organization exists
  const org = await Organization.findOne({ _id: args.organizationId });
  if (!org) {
    throw new NotFoundError(
      requestContext.translate(NOT_FOUND_ORGANIZATION_MESSAGE),
      NOT_FOUND_ORGANIZATION_CODE,
      NOT_FOUND_ORGANIZATION_PARAM
    );
  }

  // ensures organization is public
  if (!org._doc.isPublic) {
    throw new UnauthorizedError(
      requestContext.translate(NOT_AUTHORIZED_USER_MESSAGE),
      NOT_AUTHORIZED_USER_CODE,
      NOT_AUTHORIZED_USER_PARAM
    );
  }

  // ensure user exists
  const user = await User.findOne({ _id: context.userId });
  if (!user) {
    throw new NotFoundError(
      requestContext.translate(NOT_FOUND_USER_MESSAGE),
      NOT_FOUND_USER_CODE,
      NOT_FOUND_USER_PARAM
    );
  }

  // check to see if user is already a member
  const members = org._doc.members.filter(
    (member) => member.toString() === user.id
  );
  if (members.length !== 0) {
    throw new ConflictError(
      requestContext.translate(CONFLICT_ALREADY_MEMBER_MESSAGE),
      CONFLICT_ALREADY_MEMBER_CODE,
      CONFLICT_ALREADY_MEMBER_PARAM
    );
  }

  // add user to organization's members field
  org.overwrite({
    ...org._doc,
    members: [...org._doc.members, user],
  });
  await org.save();

  // add organization to user's joined organization field
  user.overwrite({
    ...user._doc,
    joinedOrganizations: [...user._doc.joinedOrganizations, org],
  });
  await user.save();

  // return user
  return {
    ...user._doc,
    password: null,
  };
};
