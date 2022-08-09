const User = require('../../models/User');
const Organization = require('../../models/Organization');
const MembershipRequest = require('../../models/MembershipRequest');
const { NotFoundError, UnauthorizedError } = require('errors');
const requestContext = require('talawa-request-context');
const { IN_PRODUCTION, MEMBERSHIP_REQUEST_NOT_FOUND, ORGANIZATION_NOT_FOUND, USER_NOT_FOUND, USER_NOT_AUTHORIZED } = require('../../../constants');

module.exports = async (parent, args, context) => {
  //ensure request exists
  const membershipRequest = await MembershipRequest.findOne({
    _id: args.membershipRequestId,
  });
  if (!membershipRequest) {
    throw new NotFoundError(
      !IN_PRODUCTION
        ? MEMBERSHIP_REQUEST_NOT_FOUND
        : requestContext.translate('membershipRequest.notFound'),
      'membershipRequest.notFound',
      'membershipRequest'
    );
  }

  //ensure org exists
  let org = await Organization.findOne({
    _id: membershipRequest.organization,
  });
  if (!org) {
    throw new NotFoundError(
      !IN_PRODUCTION ? ORGANIZATION_NOT_FOUND :
        requestContext.translate('organization.notFound'),
      'organization.notFound',
      'organization'
    );
  }

  //ensure user exists
  const user = await User.findOne({ _id: context.userId });
  if (!user) {
    throw new NotFoundError(
      !IN_PRODUCTION ? USER_NOT_FOUND :
        requestContext.translate('user.notFound'),
      'user.notFound',
      'user'
    );
  }

  //ensure user in context created membership request
  const owner = user.id === membershipRequest.user.toString();
  if (!owner) {
    throw new UnauthorizedError(
      !IN_PRODUCTION ? USER_NOT_AUTHORIZED :
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
