const MembershipRequest = require('../../models/MembershipRequest');
const userExists = require('../../helper_functions/userExists');
const { NotFoundError, ConflictError } = require('errors');
const requestContext = require('talawa-request-context');

module.exports = async (parent, args, context) => {
  const { org } = context;
  //ensure membership request exists
  const membershipRequest = await MembershipRequest.findOne({
    _id: args.membershipRequestId,
  });
  if (!membershipRequest) {
    throw new NotFoundError(
      requestContext.translate('membershipRequest.notFound'),
      'membershipRequest.notFound',
      'membershipRequest'
    );
  }

  //ensure user exists
  let user = await userExists(membershipRequest.user);

  //check to see if user is already a member
  org._doc.members.forEach((member) => {
    if (member._id === user.id) {
      throw new ConflictError(
        requestContext.translate('user.alreadyMember'),
        'user.alreadyMember',
        'userAlreadyMember'
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
