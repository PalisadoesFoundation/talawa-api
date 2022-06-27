const Query = require('./Query');
const Mutation = require('./Mutation');
const Organization = require('./Organization');
const MembershipRequest = require('./MembershipRequest');
const DirectChat = require('./DirectChat');
const DirectChatMessage = require('./DirectChatMessage');
const GroupChat = require('./GroupChat');
const GroupChatMessage = require('./GroupChatMessage');
const Subscription = require('./Subscription');

const resolvers = {
  Subscription,
  Query,
  Mutation,
  Organization,
  MembershipRequest,
  DirectChat,
  DirectChatMessage,
  GroupChat,
  GroupChatMessage,
};

exports.resolvers = resolvers;
