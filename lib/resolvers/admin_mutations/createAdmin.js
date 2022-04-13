const User = require('../../models/User');
const Organization = require('../../models/Organization');
const creatorCheck = require('../functions/creatorCheck');
const { NotFoundError, UnauthorizedError } = require('errors');
const requestContext = require('talawa-request-context');
const {
  NOT_FOUND_ORGANIZATION_CODE,
  NOT_FOUND_ORGANIZATION_PARAM,
  NOT_FOUND_ORGANIZATION_MESSAGE,
  NOT_FOUND_ORGANIZATION_MEMBER_CODE,
  NOT_FOUND_ORGANIZATION_MEMEBR_MESSAGE,
  NOT_FOUND_ORGANIZATION_MEMBER_PARAM,
  NOT_FOUND_USER_CODE,
  NOT_FOUND_USER_PARAM,
  NOT_FOUND_USER_MESSAGE,
  NOT_AUTHORIZED_USER_CODE,
  NOT_AUTHORIZED_USER_MESSAGE,
  NOT_AUTHORIZED_USER_PARAM,
} = require('../../../constants');

module.exports = async (parent, args, context) => {
  // checks to see if organization exists
  const org = await Organization.findOne({ _id: args.data.organizationId });
  if (!org) {
    throw new NotFoundError(
      requestContext.translate(NOT_FOUND_ORGANIZATION_MESSAGE),
      NOT_FOUND_ORGANIZATION_CODE,
      NOT_FOUND_ORGANIZATION_PARAM
    );
  }

  // check if the user adding the admin is the creator of the organization
  creatorCheck(context, org);

  // ensures user to be made admin exists
  const user = await User.findOne({ _id: args.data.userId });
  if (!user) {
    throw new NotFoundError(
      requestContext.translate(NOT_FOUND_USER_MESSAGE),
      NOT_FOUND_USER_CODE,
      NOT_FOUND_USER_PARAM
    );
  }

  // ensures user is a member of the organization
  const member = org._doc.members.filter(
    (member) => member.toString() === user.id
  );
  if (member.length === 0) {
    throw new NotFoundError(
      requestContext.translate(NOT_FOUND_ORGANIZATION_MEMEBR_MESSAGE),
      NOT_FOUND_ORGANIZATION_MEMBER_CODE,
      NOT_FOUND_ORGANIZATION_MEMBER_PARAM
    );
  }

  // checks if user is already admin of the organization
  const admin = org._doc.admins.filter((admin) => admin.toString() === user.id);
  if (admin.length === 1) {
    throw new UnauthorizedError(
      requestContext.translate(NOT_AUTHORIZED_USER_MESSAGE),
      NOT_AUTHORIZED_USER_CODE,
      NOT_AUTHORIZED_USER_PARAM
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
    ...user._doc,
    password: null,
  };
};
