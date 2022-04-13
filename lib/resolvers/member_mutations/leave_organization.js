const User = require('../../models/User');
const Organization = require('../../models/Organization');
const { NotFoundError, UnauthorizedError, ConflictError } = require('errors');
const requestContext = require('talawa-request-context');
const {
  NOT_FOUND_ORGANIZATION_MESSAGE,
  NOT_FOUND_ORGANIZATION_CODE,
  NOT_FOUND_ORGANIZATION_PARAM,
  NOT_FOUND_USER_MESSAGE,
  NOT_FOUND_USER_CODE,
  NOT_FOUND_USER_PARAM,

  NOT_FOUND_MEMBER_MESSAGE,
  NOT_FOUND_MEMBER_CODE,
  NOT_FOUND_MEMBER_PARAM,

  NOT_AUTHORIZED_USER_CODE,
  NOT_AUTHORIZED_USER_MESSAGE,
  NOT_AUTHORIZED_USER_PARAM,
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

  //ensure user exists
  const user = await User.findOne({ _id: context.userId });
  if (!user) {
    throw new NotFoundError(
      requestContext.translate(NOT_FOUND_USER_MESSAGE),
      NOT_FOUND_USER_CODE,
      NOT_FOUND_USER_PARAM
    );
  }

  //checks to see if the user trying to leave is the owner of the organization
  if (user.id === org._doc.creator) {
    throw new UnauthorizedError(
      requestContext.translate(NOT_AUTHORIZED_USER_MESSAGE),
      NOT_AUTHORIZED_USER_CODE,
      NOT_AUTHORIZED_USER_PARAM
    );
  }

  //check to see if user is not a member
  const members = org._doc.members.filter(
    (member) => member.toString() === user.id
  );
  console.log(members);
  if (members.length === 0) {
    throw new ConflictError(
      requestContext.translate(NOT_FOUND_MEMBER_MESSAGE),
      NOT_FOUND_MEMBER_CODE,
      NOT_FOUND_MEMBER_PARAM
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
