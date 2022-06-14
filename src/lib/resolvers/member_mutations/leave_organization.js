const User = require('../../models/User');
const Organization = require('../../models/Organization');
const { NotFoundError, UnauthorizedError, ConflictError } = require('errors');
const requestContext = require('talawa-request-context');
const {
  USER_NOT_FOUND_MESSAGE,
  USER_NOT_FOUND_CODE,
  USER_NOT_FOUND_PARAM,
  MEMBER_NOT_FOUND_MESSAGE,
  MEMBER_NOT_FOUND_PARAM,
  ORGANIZATION_NOT_FOUND_MESSAGE,
  ORGANIZATION_NOT_FOUND_CODE,
  ORGANIZATION_NOT_FOUND_PARAM,
  USER_NOT_AUTHORIZED_PARAM,
  MEMBER_NOT_FOUND_CODE,
  USER_NOT_AUTHORIZED,
  USER_NOT_AUTHORIZED_CODE,
} = require('../../../constants');

module.exports = async (parent, args, context) => {
  //ensure organization exists
  let org = await Organization.findOne({ _id: args.organizationId });
  if (!org) {
    throw new NotFoundError(
      requestContext.translate(ORGANIZATION_NOT_FOUND_MESSAGE),
      ORGANIZATION_NOT_FOUND_CODE,
      ORGANIZATION_NOT_FOUND_PARAM
    );
  }

  //ensure user exists
  const user = await User.findOne({ _id: context.userId });
  if (!user) {
    throw new NotFoundError(
      requestContext.translate(USER_NOT_FOUND_MESSAGE),
      USER_NOT_FOUND_CODE,
      USER_NOT_FOUND_PARAM
    );
  }

  //checks to see if the user trying to leave is the owner of the organization
  if (user.id === org._doc.creator) {
    throw new UnauthorizedError(
      requestContext.translate(USER_NOT_AUTHORIZED),
      USER_NOT_AUTHORIZED_CODE,
      USER_NOT_AUTHORIZED_PARAM
    );
  }

  //check to see if user is already a member
  const members = org._doc.members.filter(
    (member) => member.toString() === user.id
  );
  console.log(members);
  if (members.length === 0) {
    throw new ConflictError(
      requestContext.translate(MEMBER_NOT_FOUND_MESSAGE),
      MEMBER_NOT_FOUND_CODE,
      MEMBER_NOT_FOUND_PARAM
    );
  }

  //if the user is an admin he is removed from the organization's admin field
  org.overwrite({
    ...org._doc,
    admins: org._doc.admins.filter((admin) => admin.toString() !== user.id),
  });
  await org.save();

  //remove user from the organization's members field
  org.overwrite({
    ...org._doc,
    members: org._doc.members.filter((member) => member.toString() !== user.id),
  });
  await org.save();

  //remove organization from user's joined organization field
  user.overwrite({
    ...user._doc,
    joinedOrganizations: user._doc.joinedOrganizations.filter(
      (organization) => organization.toString() !== org.id
    ),
  });
  await user.save();

  //return user
  return {
    ...user._doc,
    password: null,
  };
};
