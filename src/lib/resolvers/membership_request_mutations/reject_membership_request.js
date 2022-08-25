const { User, Organization, MembershipRequest } = require('../../models');
const adminCheck = require('../functions/adminCheck');
const { NotFoundError } = require('../../libraries/errors');
const requestContext = require('../../libraries/request-context');
const {
  MEMBERSHIP_REQUEST_NOT_FOUND,
  IN_PRODUCTION,
  ORGANIZATION_NOT_FOUND,
  USER_NOT_FOUND,
  MEMBERSHIP_REQUEST_NOT_FOUND_CODE,
  MEMBERSHIP_REQUEST_NOT_FOUND_PARAM,
  ORGANIZATION_NOT_FOUND_CODE,
  ORGANIZATION_NOT_FOUND_PARAM,
  USER_NOT_FOUND_CODE,
  USER_NOT_FOUND_PARAM,
} = require('../../../constants');

module.exports = async (parent, args, context) => {
  //ensure membership request exists
  const membershipRequest = await MembershipRequest.findOne({
    _id: args.membershipRequestId,
  });
  if (!membershipRequest) {
    throw new NotFoundError(
      !IN_PRODUCTION
        ? MEMBERSHIP_REQUEST_NOT_FOUND
        : requestContext.translate('membershipRequest.notFound'),
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
        : requestContext.translate('organization.notFound'),
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
        : requestContext.translate('user.notFound'),
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
