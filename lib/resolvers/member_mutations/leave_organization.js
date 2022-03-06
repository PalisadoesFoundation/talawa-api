const User = require('../../models/User');
const Organization = require('../../models/Organization');
const { NotFoundError, UnauthorizedError, ConflictError } = require('errors');
const requestContext = require('talawa-request-context');

module.exports = async (parent, args, context) => {
  //ensure organization exists
  let org = await Organization.findOne({ _id: args.organizationId });
  if (!org) {
    throw new NotFoundError(
      requestContext.translate('organization.notFound'),
      'organization.notFound',
      'organization'
    );
  }

  //ensure user exists
  const user = await User.findOne({ _id: context.userId });
  if (!user) {
    throw new NotFoundError(
      requestContext.translate('user.notFound'),
      'user.notFound',
      'user'
    );
  }

  //checks to see if the user trying to leave is the owner of the organization
  if (user.id === org._doc.creator) {
    throw new UnauthorizedError(
      requestContext.translate('user.notAuthorized'),
      'user.notAuthorized',
      'userAuthorization'
    );
  }

  //check to see if user is already a member
  const members = org._doc.members.filter(
    (member) => member.toString() === user.id
  );
  console.log(members);
  if (members.length === 0) {
    throw new ConflictError(
      requestContext.translate('member.notFound'),
      'member.notFound',
      'member.notFound'
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
