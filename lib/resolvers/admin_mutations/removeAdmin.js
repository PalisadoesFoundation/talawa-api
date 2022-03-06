const User = require('../../models/User');
const Organization = require('../../models/Organization');
const creatorCheck = require('../functions/creatorCheck');
const { NotFoundError, UnauthorizedError } = require('errors');
const requestContext = require('talawa-request-context');

module.exports = async (parent, args, context) => {
  // ensure organization exists
  const org = await Organization.findOne({ _id: args.data.organizationId });
  if (!org) {
    throw new NotFoundError(
      requestContext.translate('organization.notFound'),
      'organization.notFound',
      'organization'
    );
  }

  // ensure user exists
  const user = await User.findOne({ _id: args.data.userId });
  if (!user) {
    throw new NotFoundError(
      requestContext.translate('user.notFound'),
      'user.notFound',
      'user'
    );
  }

  // ensure user is an admin
  const admin = org._doc.admins.filter((admin) => admin.toString() === user.id);
  if (admin.length === 0) {
    throw new UnauthorizedError(
      requestContext.translate('user.notAuthorized'),
      'user.notAuthorized',
      'userAuthorization'
    );
  }

  // ensure user trying to remove admin is the creator
  creatorCheck(context, org);

  // remove admin from organization
  org.overwrite({
    ...org._doc,
    admins: org._doc.admins.filter((admin) => admin.toString() !== user.id),
  });
  await org.save();

  // remove organization from the user's adminFor field
  user.overwrite({
    ...user._doc,
    adminFor: user._doc.adminFor.filter(
      (organization) => organization.toString() !== org.id
    ),
  });
  await user.save();

  // return user
  return {
    ...user._doc,
    password: null,
  };
};
