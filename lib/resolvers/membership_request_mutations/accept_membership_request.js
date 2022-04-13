const adminCheck = require('../functions/adminCheck');
const MembershipRequest = require('../../models/MembershipRequest');
const userExists = require('../../helper_functions/userExists');
const organizationExists = require('../../helper_functions/organizationExists');
const { NotFoundError, ConflictError } = require('errors');
const requestContext = require('talawa-request-context');

const {
  NOT_FOUND_MEMBERSHIP_REQUEST_MESSAGE,
  NOT_FOUND_MEMBERSHIP_REQUEST_CODE,
  NOT_FOUND_MEMBERSHIP_REQUEST_PARAM,
  CONFLICT_ALREADY_MEMBER_CODE,
  CONFLICT_ALREADY_MEMBER_MESSAGE,
  CONFLICT_ALREADY_MEMBER_PARAM,
} = require('../../../constants');

module.exports = async (parent, args, context) => {
  //ensure membership request exists
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
  let org = await organizationExists(membershipRequest.organization);

  //ensure user exists
  let user = await userExists(membershipRequest.user);

  //ensure user is admin
  adminCheck(context, org);

  //check to see if user is already a member
  org._doc.members.forEach((member) => {
    if (member._id === user.id) {
      throw new ConflictError(
        requestContext.translate(CONFLICT_ALREADY_MEMBER_MESSAGE),
        CONFLICT_ALREADY_MEMBER_CODE,
        CONFLICT_ALREADY_MEMBER_PARAM
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
      (request) => request._id !== membershipRequest.id
    ),
  });

  await org.save();

  //remove membership request from user
  user.overwrite({
    ...user._doc,
    joinedOrganizations: [...user._doc.joinedOrganizations, org],
    membershipRequests: user._doc.membershipRequests.filter(
      (request) => request._id !== membershipRequest.id
    ),
  });

  await user.save();

  //return membershipship request
  return membershipRequest._doc;
};
