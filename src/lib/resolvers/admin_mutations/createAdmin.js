const { User, Organization } = require('../../models');
const creatorCheck = require('../functions/creatorCheck');
const { NotFoundError, UnauthorizedError } = require('../../libraries/errors');
const requestContext = require('../../libraries/request-context');
const {
  IN_PRODUCTION,
  USER_NOT_FOUND,
  USER_NOT_FOUND_MESSAGE,
  USER_NOT_FOUND_CODE,
  USER_NOT_FOUND_PARAM,
  ORGANIZATION_NOT_FOUND,
  ORGANIZATION_NOT_FOUND_MESSAGE,
  ORGANIZATION_NOT_FOUND_CODE,
  ORGANIZATION_NOT_FOUND_PARAM,
  USER_NOT_AUTHORIZED,
  USER_NOT_AUTHORIZED_MESSAGE,
  USER_NOT_AUTHORIZED_CODE,
  USER_NOT_AUTHORIZED_PARAM,
  ORGANIZATION_MEMBER_NOT_FOUND,
  ORGANIZATION_MEMBER_NOT_FOUND_MESSAGE,
  ORGANIZATION_MEMBER_NOT_FOUND_CODE,
  ORGANIZATION_MEMBER_NOT_FOUND_PARAM,
} = require('../../../constants');

module.exports = async (parent, args, context) => {
  // checks to see if organization exists
  const org = await Organization.findOne({ _id: args.data.organizationId });
  if (!org) {
    throw new NotFoundError(
      !IN_PRODUCTION
        ? ORGANIZATION_NOT_FOUND
        : requestContext.translate(ORGANIZATION_NOT_FOUND_MESSAGE),
      ORGANIZATION_NOT_FOUND_CODE,
      ORGANIZATION_NOT_FOUND_PARAM
    );
  }

  // check if the user adding the admin is the creator of the organization
  creatorCheck(context, org);

  // ensures user to be made admin exists
  const user = await User.findOne({ _id: args.data.userId });
  if (!user) {
    throw new NotFoundError(
      !IN_PRODUCTION
        ? USER_NOT_FOUND
        : requestContext.translate(USER_NOT_FOUND_MESSAGE),
      USER_NOT_FOUND_CODE,
      USER_NOT_FOUND_PARAM
    );
  }

  // ensures user is a member of the organization
  const member = org._doc.members.filter(
    (member) => member.toString() === user.id
  );
  if (member.length === 0) {
    throw new NotFoundError(
      !IN_PRODUCTION
        ? ORGANIZATION_MEMBER_NOT_FOUND
        : requestContext.translate(ORGANIZATION_MEMBER_NOT_FOUND_MESSAGE),
      ORGANIZATION_MEMBER_NOT_FOUND_CODE,
      ORGANIZATION_MEMBER_NOT_FOUND_PARAM
    );
  }

  // checks if user is already admin of the organization
  const admin = org._doc.admins.filter((admin) => admin.toString() === user.id);
  if (admin.length === 1) {
    throw new UnauthorizedError(
      !IN_PRODUCTION
        ? USER_NOT_AUTHORIZED
        : requestContext.translate(USER_NOT_AUTHORIZED_MESSAGE),
      USER_NOT_AUTHORIZED_CODE,
      USER_NOT_AUTHORIZED_PARAM
    );
  }

  // ADDS ADMIN TO ORGANIZATION
  org.overwrite({
    ...org._doc,
    admins: [...org._doc.admins, user],
  });
  await org.save();

  // Adds organization to the user's admin for field
  user.overwrite({
    ...user._doc,
    adminFor: [...user._doc.adminFor, org],
  });
  await user.save();

  return {
    ...user.toObject(),
    password: null,
  };
};
