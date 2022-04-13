const User = require('../models/User');
const MembershipRequest = require('../models/MembershipRequest');
const { NotFoundError } = require('errors');
const requestContext = require('talawa-request-context');

const {
  NOT_FOUND_USER_MESSAGE,
  NOT_FOUND_USER_CODE,
  NOT_FOUND_USER_PARAM,
} = require('../../constants');

const Organization = {
  creator: async (parent) => {
    const user = await User.findById(parent.creator._id);
    if (!user) {
      throw new NotFoundError(
        requestContext.translate(NOT_FOUND_USER_MESSAGE),
        NOT_FOUND_USER_CODE,
        NOT_FOUND_USER_PARAM
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
