import { QueryResolvers } from '../../../generated/graphQLTypescriptTypes';
import { checkAuth } from './checkAuth';
import { comments } from './comments';
import { commentsByPost } from './commentsByPost';
import { directChatMessages } from './directChatMessages';
import { directChats } from './directChats';
import { directChatsByUserID } from './directChatsByUserID';
import { directChatsMessagesByChatID } from './directChatsMessagesByChatID';
import { event } from './event';
import { events } from './events';
import { eventsByOrganization } from './eventsByOrganization';
import { getlanguage } from './getlanguage';
import { getPlugins } from './getPlugins';
import { groupChatMessages } from './groupChatMessages';
import { groupChats } from './groupChats';
import { groups } from './groups';
import { isUserRegister } from './isUserRegister';
import { me } from './me';
import { myLanguage } from './myLanguage';
import { organizations } from './organizations';
import { organizationsConnection } from './organizationsConnection';
import { organizationsMemberConnection } from './organizationsMemberConnection';
import { post } from './post';
import { posts } from './posts';
import { postsByOrganization } from './postsByOrganization';
import { postsByOrganizationConnection } from './postsByOrganizationConnection';
import { registeredEventsByUser } from './registeredEventsByUser';
import { registrantsByEvent } from './registrantsByEvent';
import { tasksByEvent } from './tasksByEvent';
import { tasksByUser } from './tasksByUser';
import { user } from './user';
import { userLanguage } from './userLanguage';
import { users } from './users';
import { usersConnection } from './usersConnection';

export const Query: QueryResolvers = {
  checkAuth,
  comments,
  commentsByPost,
  directChatMessages,
  directChats,
  directChatsByUserID,
  directChatsMessagesByChatID,
  event,
  events,
  eventsByOrganization,
  getlanguage,
  getPlugins,
  groupChatMessages,
  groupChats,
  groups,
  isUserRegister,
  me,
  myLanguage,
  organizations,
  organizationsConnection,
  organizationsMemberConnection,
  post,
  posts,
  postsByOrganization,
  postsByOrganizationConnection,
  registeredEventsByUser,
  registrantsByEvent,
  tasksByEvent,
  tasksByUser,
  user,
  userLanguage,
  users,
  usersConnection,
};
