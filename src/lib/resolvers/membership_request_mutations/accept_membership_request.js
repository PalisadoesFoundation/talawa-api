const adminCheck = require('../functions/adminCheck');
const MembershipRequest = require('../../models/MembershipRequest');
const { userExists } = require('../../helper_functions/userExists');
const {
  organizationExists,
} = require('../../helper_functions/organizationExists');
const { NotFoundError, ConflictError } = require('../../helper_lib/errors');
const requestContext = require('../../helper_lib/request-context');

const {
  MEMBERSHIP_REQUEST_NOT_FOUND,
  MEMBERSHIP_REQUEST_NOT_FOUND_CODE,
  MEMBERSHIP_REQUEST_NOT_FOUND_MESSAGE,
  MEMBERSHIP_REQUEST_NOT_FOUND_PARAM,

  USER_ALREADY_MEMBER,
  USER_ALREADY_MEMBER_CODE,
  USER_ALREADY_MEMBER_MESSAGE,
  USER_ALREADY_MEMBER_PARAM,

  IN_PRODUCTION,
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
        : requestContext.translate(MEMBERSHIP_REQUEST_NOT_FOUND_MESSAGE),
      MEMBERSHIP_REQUEST_NOT_FOUND_CODE,
      MEMBERSHIP_REQUEST_NOT_FOUND_PARAM
    );
  }

  //ensure org exists
  let org = await organizationExists(membershipRequest.organization);

  //ensure user exists
  let user = await userExists(membershipRequest.user);

  //ensure user is admin
  adminCheck(context, org);

  //check to see if user is already a member
  org._doc.members.forEach((member) => {
    if (member._id.toString() === user._id.toString()) {
      throw new ConflictError(
        !IN_PRODUCTION
          ? USER_ALREADY_MEMBER
          : requestContext.translate(USER_ALREADY_MEMBER_MESSAGE),
        USER_ALREADY_MEMBER_CODE,
        USER_ALREADY_MEMBER_PARAM
      );
    }
  });

  //add user in membership request as a member to the organization
  org.overwrite({
    ...org._doc,
    members: [...org._doc.members, user],
  });

  //delete membership request
  await MembershipRequest.deleteOne({ _id: args.membershipRequestId });

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
    joinedOrganizations: [...user._doc.joinedOrganizations, org._id],
    membershipRequests: user._doc.membershipRequests.filter(
      (request) => request._id.toString() !== membershipRequest._id.toString()
    ),
  });

  await user.save();

  //return membershipship request
  return membershipRequest._doc;
};
