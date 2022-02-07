const Organization = require('../models/Organization');
const MembershipRequest = require('../models/MembershipRequest');

const User = {
  createdOrganizations: async (parent) =>
    await Organization.find({ creator: parent._id }),
  adminFor: async (parent) =>
    await Organization.find({
      _id: {
        $in: [...parent.adminFor],
      },
    }),
  joinedOrganizations: async (parent) =>
    await Organization.find({
      _id: {
        $in: [...parent.joinedOrganizations],
      },
    }),
  membershipRequests: async (parent) => {
    const membershipRequests = await MembershipRequest.find({
      _id: {
        $in: [...parent.membershipRequests],
      },
    });
    return membershipRequests;
  },
  organizationsBlockedBy: async (parent) => {
    const orgs = await Organization.find({
      _id: {
        $in: [...parent.organizationsBlockedBy],
      },
    });
    return orgs;
  },
};

module.exports = User;
