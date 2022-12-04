const User = require('../../models/User');
const Organization = require('../../models/Organization');
const MembershipRequest = require('../../models/MembershipRequest');
const { NotFoundError, ConflictError } = require('errors');
const requestContext = require('talawa-request-context');

const {
  ORGANIZATION_NOT_FOUND,
  ORGANIZATION_NOT_FOUND_PARAM,
  ORGANIZATION_NOT_FOUND_MESSAGE,
  ORGANIZATION_NOT_FOUND_CODE,
  USER_NOT_FOUND,
  USER_NOT_FOUND_MESSAGE,
  USER_NOT_FOUND_CODE,
  USER_NOT_FOUND_PARAM,
  MEMBERSHIP_REQUEST_ALREADY_EXIST,
  MEMBERSHIP_REQUEST_ALREADY_EXIST_CODE,
  MEMBERSHIP_REQUEST_ALREADY_EXIST_MESSAGE,
  MEMBERSHIP_REQUEST_ALREADY_EXIST_PARAM,
  IN_PRODUCTION,
} = require('../../../constants');

module.exports = async (parent, args, context) => {
  // ensure user exists
  const user = await User.findOne({ _id: context.userId });
  if (!user) {
    throw new NotFoundError(
      !IN_PRODUCTION
        ? USER_NOT_FOUND
        : requestContext.translate(USER_NOT_FOUND_MESSAGE),
      USER_NOT_FOUND_CODE,
      USER_NOT_FOUND_PARAM
    );
  }

  // ensure organization exists
  const org = await Organization.findOne({ _id: args.organizationId });
  if (!org) {
    throw new NotFoundError(
      !IN_PRODUCTION
        ? ORGANIZATION_NOT_FOUND
        : requestContext.translate(ORGANIZATION_NOT_FOUND_MESSAGE),
      ORGANIZATION_NOT_FOUND_CODE,
      ORGANIZATION_NOT_FOUND_PARAM
    );
  }
  // create membership request
  const exists = await MembershipRequest.find({
    user: user.id,
    organization: org.id,
  });
  console.log({ exists });
  if (exists.length > 0) {
    throw new ConflictError(
      !IN_PRODUCTION
        ? MEMBERSHIP_REQUEST_ALREADY_EXIST
        : requestContext.translate(MEMBERSHIP_REQUEST_ALREADY_EXIST_MESSAGE),
      MEMBERSHIP_REQUEST_ALREADY_EXIST_CODE,
      MEMBERSHIP_REQUEST_ALREADY_EXIST_PARAM
    );
  }

  let newMembershipRequest = new MembershipRequest({
    user,
    organization: org,
  });
  newMembershipRequest = await newMembershipRequest.save();

  // add membership request to organization
  await Organization.findOneAndUpdate(
    { _id: org._doc._id },
    {
      $set: {
        membershipRequests: [
          ...org._doc.membershipRequests,
          newMembershipRequest,
        ],
      },
    }
  );

  // add membership request to user
  await User.findOneAndUpdate(
    { _id: user._doc._id },
    {
      $set: {
        membershipRequests: [
          ...user._doc.membershipRequests,
          newMembershipRequest,
        ],
      },
    }
  );

  return newMembershipRequest._doc;
};
