const User = require('../../models/User');
const Organization = require('../../models/Organization');
const { NotFoundError, ConflictError, UnauthorizedError } = require('errors');
const requestContext = require('talawa-request-context');

module.exports = async (parent, args, context) => {
  // ensure organization exists
  const org = await Organization.findOne({ _id: args.organizationId });
  if (!org) {
    throw new NotFoundError(
      requestContext.translate('organization.notFound'),
      'organization.notFound',
      'organization'
    );
  }

  // ensures organization is public
  if (!org._doc.isPublic) {
    throw new UnauthorizedError(
      requestContext.translate('user.notAuthorized'),
      'user.notAuthorized',
      'userAuthorization'
    );
  }

  // ensure user exists
  const user = await User.findOne({ _id: context.userId });
  if (!user) {
    throw new NotFoundError(
      requestContext.translate('user.notFound'),
      'user.notFound',
      'user'
    );
  }

  // check to see if user is already a member
  const members = org._doc.members.filter(
    (member) => member.toString() === user.id
  );
  if (members.length !== 0) {
    throw new ConflictError(
      requestContext.translate('user.alreadyMember'),
      'user.alreadyMember',
      'userAlreadyMember'
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
