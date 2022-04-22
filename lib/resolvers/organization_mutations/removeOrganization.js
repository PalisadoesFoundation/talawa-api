const User = require('../../models/User');
const MembershipRequest = require('../../models/MembershipRequest');
const Comment = require('../../models/Comment');
const Post = require('../../models/Post');
const Organization = require('../../models/Organization');
const creatorCheck = require('../functions/creatorCheck');
const { NotFoundError } = require('errors');
const requestContext = require('talawa-request-context');
const {
  USER_NOT_FOUND,
  USER_NOT_FOUND_MESSAGE,
  USER_NOT_FOUND_CODE,
  USER_NOT_FOUND_PARAM,

  ORGANIZATION_NOT_FOUND,
  ORGANIZATION_NOT_FOUND_MESSAGE,
  ORGANIZATION_NOT_FOUND_CODE,
  ORGANIZATION_NOT_FOUND_PARAM,

  IN_PRODUCTION,
} = require('../../../constants');

const removeOrganizaiton = async (parent, args, context) => {
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

  // checks to see if organization exists
  const org = await Organization.findOne({ _id: args.id });
  if (!org) {
    throw new NotFoundError(
      !IN_PRODUCTION
        ? ORGANIZATION_NOT_FOUND
        : requestContext.translate(ORGANIZATION_NOT_FOUND_MESSAGE),
      ORGANIZATION_NOT_FOUND_CODE,
      ORGANIZATION_NOT_FOUND_PARAM
    );
  }

  // check if the user is the creator
  creatorCheck(context, org);

  //remove posts related to this organization
  org.posts.forEach(async (postId) => {
    await Post.findByIdAndDelete(postId);
    await Comment.deleteMany({ post: postId });
  });

  // remove organization from the user's created organization field
  user.overwrite({
    ...user._doc,
    createdOrganizations: user._doc.createdOrganizations.filter(
      (organizationId) => organizationId.toString() !== org.id
    ),
  });
  await user.save();

  // Remove organization from each member's joined organizations field
  for (let memberId of org.members) {
    const member = await User.findById(memberId);
    member.joinedOrganizations = member.joinedOrganizations.filter(
      (organizationId) => organizationId.toString() !== org.id
    );
    await member.save();
  }

  // Remove organization from all member's adminFor field
  for (let adminId of org.admins) {
    const admin = await User.findById(adminId);
    admin.adminFor = admin.joinedOrganizations.filter(
      (organizationId) => organizationId.toString() !== org.id
    );
    await admin.save();
  }

  // remove membership requests related to this organization
  for (let membershipRequestId of org.membershipRequests) {
    const membershipRequest = await MembershipRequest.findByIdAndDelete(
      membershipRequestId
    );
    const requester = await User.findById(membershipRequest.user);
    requester.membershipRequests = requester.membershipRequests.filter(
      (RequestId) => RequestId.toString() !== membershipRequestId.toString()
    );
    await requester.save();
  }

  // remove organization from all blocked user's organizationsBlockedBy field
  for (let blockedId of org.blockedUsers) {
    const blocked = await User.findById(blockedId);
    blocked.organizationsBlockedBy = blocked.organizationsBlockedBy.filter(
      (organizationId) => organizationId.toString() !== org.id
    );
    await blocked.save();
  }

  // delete organzation
  await Organization.deleteOne({ _id: args.id });

  return {
    ...user._doc,
    password: null,
  };
};

module.exports = removeOrganizaiton;
