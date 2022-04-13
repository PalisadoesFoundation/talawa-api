const User = require('../../models/User');
const Organization = require('../../models/Organization');
const MembershipRequest = require('../../models/MembershipRequest');
const { NotFoundError, UnauthorizedError } = require('errors');
const requestContext = require('talawa-request-context');
const {
  NOT_FOUND_MEMBERSHIP_REQUEST_MESSAGE,
  NOT_FOUND_MEMBERSHIP_REQUEST_CODE,
  NOT_FOUND_MEMBERSHIP_REQUEST_PARAM,
  NOT_FOUND_ORGANIZATION_MESSAGE,
  NOT_FOUND_ORGANIZATION_CODE,
  NOT_FOUND_ORGANIZATION_PARAM,
  NOT_FOUND_USER_MESSAGE,
  NOT_FOUND_USER_CODE,
  NOT_FOUND_USER_PARAM,
  NOT_AUTHORIZED_USER_CODE,
  NOT_AUTHORIZED_USER_MESSAGE,
  NOT_AUTHORIZED_USER_PARAM,
} = require('../../../constants');

module.exports = async (parent, args, context) => {
  //ensure request exists
  const membershipRequest = await MembershipRequest.findOne({
    _id: args.membershipRequestId,
  });
  if (!membershipRequest) {
    throw new NotFoundError(
      requestContext.translate(NOT_FOUND_MEMBERSHIP_REQUEST_MESSAGE),
      NOT_FOUND_MEMBERSHIP_REQUEST_CODE,
      NOT_FOUND_MEMBERSHIP_REQUEST_PARAM
    );
  }

  //ensure org exists
  let org = await Organization.findOne({
    _id: membershipRequest.organization,
  });
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

  //ensure user in context created membership request
  const owner = user.id === membershipRequest.user.toString();
  if (!owner) {
    throw new UnauthorizedError(
      requestContext.translate(NOT_AUTHORIZED_USER_MESSAGE),
      NOT_AUTHORIZED_USER_CODE,
      NOT_AUTHORIZED_USER_PARAM
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
