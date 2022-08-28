const User = require('../../models/User');
const Organization = require('../../models/Organization');
const MembershipRequest = require('../../models/MembershipRequest');
const adminCheck = require('../functions/adminCheck');
const { NotFoundError } = require('errors');

const {
  MEMBERSHIP_REQUEST_NOT_FOUND,
  MEMBERSHIP_REQUEST_NOT_FOUND_CODE,
  MEMBERSHIP_REQUEST_NOT_FOUND_MESSAGE,
  MEMBERSHIP_REQUEST_NOT_FOUND_PARAM,
  IN_PRODUCTION,
  ORGANIZATION_NOT_FOUND,
  ORGANIZATION_NOT_FOUND_PARAM,
  ORGANIZATION_NOT_FOUND_MESSAGE,
  ORGANIZATION_NOT_FOUND_CODE,
  USER_NOT_FOUND,
  USER_NOT_FOUND_MESSAGE,
  USER_NOT_FOUND_CODE,
  USER_NOT_FOUND_PARAM,
} = require('../../../constants');

const requestContext = require('talawa-request-context');

module.exports = async (parent, args, context) => {
  //ensure membership request exists
  const membershipRequest = await MembershipRequest.findOne({
    _id: args.membershipRequestId,
  });
  if (!membershipRequest) {
    throw new NotFoundError(
      !IN_PRODUCTION
        ? MEMBERSHIP_REQUEST_NOT_FOUND
        : requestContext.translate(MEMBERSHIP_REQUEST_NOT_FOUND_MESSAGE),
      MEMBERSHIP_REQUEST_NOT_FOUND_CODE,
      MEMBERSHIP_REQUEST_NOT_FOUND_PARAM
    );
  }

  //ensure org exists
  let org = await Organization.findOne({
    _id: membershipRequest.organization,
  });
  if (!org) {
    throw new NotFoundError(
      !IN_PRODUCTION
        ? ORGANIZATION_NOT_FOUND
        : requestContext.translate(ORGANIZATION_NOT_FOUND_MESSAGE),
      ORGANIZATION_NOT_FOUND_CODE,
      ORGANIZATION_NOT_FOUND_PARAM
    );
  }

  const user = await User.findOne({
    _id: membershipRequest.user,
  });
  if (!user) {
    throw new NotFoundError(
      !IN_PRODUCTION
        ? USER_NOT_FOUND
        : requestContext.translate(USER_NOT_FOUND_MESSAGE),
      USER_NOT_FOUND_CODE,
      USER_NOT_FOUND_PARAM
    );
  }

  //ensure user is admin
  adminCheck(context, org);

  //delete membership request
  await MembershipRequest.deleteOne({
    _id: args.membershipRequestId,
  });

  //remove membership request from organization
  org.overwrite({
    ...org._doc,
    membershipRequests: org._doc.membershipRequests.filter(
      (request) => request._id.toString() !== membershipRequest._id.toString()
    ),
  });

  await org.save();

  //remove membership request from user
  user.overwrite({
    ...user._doc,
    membershipRequests: user._doc.membershipRequests.filter(
      (request) => request._id.toString() !== membershipRequest._id.toString()
    ),
  });

  await user.save();

  //return membershipship request
  return membershipRequest._doc;
};
