const groupChats = require('./group_chat_query/groupChats');
const groupChatMessages = require('./group_chat_query/groupChatMessages');
const directChats = require('./direct_chat_query/directChats');
const directChatMessages = require('./direct_chat_query/directChatMessages');
const organizations = require('./organization_query/organizations');
const event = require('./event_query/event');
const registrantsByEvent = require('./event_query/registrantsByEvent');
const events = require('./event_query/events');
const isUserRegister = require('./event_query/isUserRegister');
const eventsByOrganization = require('./event_query/eventsByOrganization');
const registeredEventsByUser = require('./event_query/registeredEventsByUser');
const tasksByEvent = require('./event_query/tasksByEvent');
const tasksByUser = require('./user_query/tasksByUser');
const comments = require('./post_query/comments');
const commentsByPost = require('./post_query/commentsByPost');
const post = require('./post_query/post');
const posts = require('./post_query/posts');
const postsByOrganization = require('./post_query/postsByOrganization');
const groups = require('./group_query/groups');
const organizationsConnection = require('./organization_query/organizations_pagination');
const postsByOrganizationConnection = require('../resolvers/post_organization_query/organization_post_pagination');
const {
  users,
  user,
  me,
  usersConnection,
  organizationsMemberConnection,
} = require('./user_query/users');

const Query = {
  me,
  user,
  users,
  usersConnection,

  organizations,
  organizationsConnection,
  organizationsMemberConnection,

  isUserRegister,
  event,
  events,
  registrantsByEvent,
  eventsByOrganization,
  registeredEventsByUser,

  groupChats,
  groupChatMessages,
  directChats,
  directChatMessages,
  tasksByEvent,
  tasksByUser,
  comments,
  commentsByPost,
  post,
  posts,
  postsByOrganization,
  postsByOrganizationConnection,
  groups,
};

module.exports = Query;
