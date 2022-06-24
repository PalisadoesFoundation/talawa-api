const { User, MembershipRequest } = require('../models');
const { NotFoundError } = require('../helper_lib/errors');
const requestContext = require('../helper_lib/request-context');

const Organization = {
  creator: async (parent) => {
    const user = await User.findById(parent.creator._id);
    if (!user) {
      throw new NotFoundError(
        requestContext.translate('user.notFound'),
        'user.notFound',
        'user'
      );
    }
    return user;
  },
  admins: async (parent) => {
    const admins = await User.find({
      _id: {
        $in: [...parent.admins],
      },
    });
    return admins;
  },
  members: async (parent) => {
    const members = await User.find({
      _id: {
        $in: [...parent.members],
      },
    });
    return members;
  },
  membershipRequests: async (parent) => {
    const membershipRequests = await MembershipRequest.find({
      _id: {
        $in: [...parent.membershipRequests],
      },
    });
    return membershipRequests;
  },
  blockedUsers: async (parent) => {
    const users = await User.find({
      _id: {
        $in: [...parent.blockedUsers],
      },
    });
    return users;
  },
};

module.exports = Organization;
