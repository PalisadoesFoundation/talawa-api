import { QueryResolvers } from "../../types/generatedGraphQLTypes";
import { checkAuth } from "./checkAuth";
import { directChatsByUserID } from "./directChatsByUserID";
import { directChatsMessagesByChatID } from "./directChatsMessagesByChatID";
import { event } from "./event";
import { eventsByOrganization } from "./eventsByOrganization";
import { eventsByOrganizationConnection } from "./eventsByOrganizationConnection";
import { getDonationById } from "./getDonationById";
import { getDonationByOrgId } from "./getDonationByOrgId";
import { getDonationByOrgIdConnection } from "./getDonationByOrgIdConnection";
import { getlanguage } from "./getlanguage";
import { getPlugins } from "./getPlugins";
import { isUserRegister } from "./isUserRegister";
import { me } from "./me";
import { myLanguage } from "./myLanguage";
import { organizations } from "./organizations";
import { organizationsConnection } from "./organizationsConnection";
import { organizationsMemberConnection } from "./organizationsMemberConnection";
import { post } from "./post";
import { postsByOrganization } from "./postsByOrganization";
import { postsByOrganizationConnection } from "./postsByOrganizationConnection";
import { registeredEventsByUser } from "./registeredEventsByUser";
import { registrantsByEvent } from "./registrantsByEvent";
import { tasksByEvent } from "./tasksByEvent";
import { tasksByUser } from "./tasksByUser";
import { user } from "./user";
import { userLanguage } from "./userLanguage";
import { users } from "./users";
import { usersConnection } from "./usersConnection";

export const Query: QueryResolvers = {
  checkAuth,
  directChatsByUserID,
  directChatsMessagesByChatID,
  event,
  eventsByOrganization,
  eventsByOrganizationConnection,
  getDonationById,
  getDonationByOrgId,
  getDonationByOrgIdConnection,
  getlanguage,
  getPlugins,
  isUserRegister,
  me,
  myLanguage,
  organizations,
  organizationsConnection,
  organizationsMemberConnection,
  post,
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
