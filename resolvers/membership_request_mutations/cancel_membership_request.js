const User = require('../../models/User');
const Organization = require('../../models/Organization');
const MembershipRequest = require('../../models/MembershipRequest');
const authCheck = require('../functions/authCheck');
const { NotFound, Unauthorized } = require('../../core/errors');
const requestContext = require('../../core/libs/talawa-request-context');

module.exports = async (parent, args, context) => {
  authCheck(context);

  //ensure request exists
  const membershipRequest = await MembershipRequest.findOne({
    _id: args.membershipRequestId,
  });
  if (!membershipRequest) {
    throw new NotFound(
      requestContext.translate('membershipRequest.notFound'),
      'membershipRequest.notFound',
      'membershipRequest'
    );
  }

  //ensure org exists
  let org = await Organization.findOne({
    _id: membershipRequest.organization,
  });
  if (!org) {
    throw new NotFound(
      requestContext.translate('organization.notFound'),
      'organization.notFound',
      'organization'
    );
  }

  //ensure user exists
  const user = await User.findOne({ _id: context.userId });
  if (!user) {
    throw new NotFound(
      requestContext.translate('user.notFound'),
      'user.notFound',
      'user'
    );
  }

  //ensure user in context created membership request
  const owner = user.id === membershipRequest.user;
  if (!owner) {
    throw new Unauthorized(
      requestContext.translate('user.notAuthorized'),
      'user.notAuthorized',
      'userAuthorization'
    );
  }

  //delete membership request
  await MembershipRequest.deleteOne({ _id: args.membershipRequestId });

  //remove membership request from organization
  org.overwrite({
    ...org._doc,
    membershipRequests: org._doc.membershipRequests.filter(
      (request) => request._id !== membershipRequest.id
    ),
  });

  await org.save();

  //remove membership request from user
  user.overwrite({
    ...user._doc,
    membershipRequests: user._doc.membershipRequests.filter(
      (request) => request._id !== membershipRequest.id
    ),
  });

  await user.save();

  //return membershipship request
  return membershipRequest._doc;
};
