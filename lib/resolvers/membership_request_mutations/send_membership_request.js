const User = require('../../models/User');
const Organization = require('../../models/Organization');
const MembershipRequest = require('../../models/MembershipRequest');
const { NotFoundError } = require('errors');
const requestContext = require('talawa-request-context');
const {
  MEMBERSHIP_REQUEST_NOT_FOUND,
  MEMBERSHIP_REQUEST_NOT_FOUND_CODE,
  MEMBERSHIP_REQUEST_NOT_FOUND_MESSAGE,
  MEMBERSHIP_REQUEST_NOT_FOUND_PARAM,
  IN_PRODUCTION,
  USER_NOT_FOUND,
  USER_NOT_FOUND_MESSAGE,
  USER_NOT_FOUND_CODE,
  USER_NOT_FOUND_PARAM,
  ORGANIZATION_NOT_FOUND,
  ORGANIZATION_NOT_FOUND_PARAM,
  ORGANIZATION_NOT_FOUND_MESSAGE,
  ORGANIZATION_NOT_FOUND_CODE,
} = require('../../../constants');

module.exports = async (parent, args) => {
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

  // create membership request
  let newMembershipRequest = new MembershipRequest({
    organization: org._id,
    user: user._id,
  });
  newMembershipRequest = await newMembershipRequest.save();
  // add membership request to organization
  await Organization.updateOne(
    { _id: org._id },
    {
      $set: {
        membershipRequests: [
          // ...org._doc.membershipRequests,
          newMembershipRequest._id,
        ],
      },
    }
  );

  // add membership request to user
  await User.updateOne(
    { _id: user._id },
    {
      $set: {
        membershipRequests: [
          // ...user._doc.membershipRequests,
          newMembershipRequest._id,
        ],
      },
    }
  );

  return newMembershipRequest._doc;
};
