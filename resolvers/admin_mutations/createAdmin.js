const User = require('../../models/User');
const Organization = require('../../models/Organization');
const authCheck = require('../functions/authCheck');
const creatorCheck = require('../functions/creatorCheck');
const { NotFound } = require('../../core/errors');
const requestContext = require('../../core/libs/talawa-request-context');

module.exports = async (parent, args, context) => {
  authCheck(context);
  // checks to see if organization exists
  const org = await Organization.findOne({ _id: args.data.organizationId });
  if (!org) {
    throw new NotFound(
      requestContext.translate('organization.notFound'),
      'organization.notFound',
      'organization'
    );
  }

  // check if the user adding the admin is the creator of the organization
  creatorCheck(context, org);

  // ensures user to be made admin exists
  const user = await User.findOne({ _id: args.data.userId });
  if (!user) {
    throw new NotFound(
      requestContext.translate('user.notFound'),
      'user.notFound',
      'user'
    );
  }

  // ensures user is a member of the organization
  const member = org._doc.members.filter((member) => member === user.id);
  if (member.length === 0) {
    throw new NotFound(
      requestContext.translate('organization.member.notFound'),
      'organization.member.notFound',
      'organizationMember'
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
