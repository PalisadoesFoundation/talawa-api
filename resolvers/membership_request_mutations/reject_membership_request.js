const User = require('../../models/User');
const Organization = require('../../models/Organization');
const MembershipRequest = require('../../models/MembershipRequest');
const adminCheck = require('../functions/adminCheck');
const authCheck = require('../functions/authCheck');

module.exports = async (parent, args, context) => {
  authCheck(context);
  //ensure membership request exists
  const membershipRequest = await MembershipRequest.findOne({
    _id: args.membershipRequestId,
  });
  if (!membershipRequest) throw new Error('Membership request not found');

  //ensure org exists
  let org = await Organization.findOne({
    _id: membershipRequest.organization,
  });
  if (!org) throw new Error('Organization not found');

  //ensure user exists
  const user = await User.findOne({ _id: membershipRequest.user });
  if (!user) throw new Error('User does not exist');

  //ensure user is admin
  adminCheck(context, org);

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
