import type { QueryResolvers } from "../../types/generatedGraphQLTypes";
import { actionItem } from "./actionItem";
import { actionItemsByEvent } from "./actionItemsByEvent";
import { actionItemCategory } from "./actionItemCategory";
import { actionItemsByOrganization } from "./actionItemsByOrganization";
import { actionItemCategoriesByOrganization } from "./actionItemCategoriesByOrganization";
import { checkAuth } from "./checkAuth";
import { customDataByOrganization } from "./customDataByOrganization";
import { customFieldsByOrganization } from "./customFieldsByOrganization";
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
import { me } from "./me";
import { myLanguage } from "./myLanguage";
import { organizations } from "./organizations";
import { organizationsConnection } from "./organizationsConnection";
import { organizationsMemberConnection } from "./organizationsMemberConnection";
import { isSampleOrganization } from "../Query/organizationIsSample";
import { post } from "./post";
import { postsByOrganization } from "./postsByOrganization";
import { postsByOrganizationConnection } from "./postsByOrganizationConnection";
import { registeredEventsByUser } from "./registeredEventsByUser";
import { user } from "./user";
import { userLanguage } from "./userLanguage";
import { users } from "./users";
import { getAdvertisements } from "./getAdvertisements";
import { usersConnection } from "./usersConnection";
import { agendaCategory } from "./agendaCategory";

export const Query: QueryResolvers = {
  actionItem,
  actionItemsByEvent,
  actionItemCategory,
  agendaCategory,
  actionItemsByOrganization,
  actionItemCategoriesByOrganization,
  checkAuth,
  customFieldsByOrganization,
  customDataByOrganization,
  directChatsByUserID,
  directChatsMessagesByChatID,
  event,
  eventsByOrganization,
  eventsByOrganizationConnection,
  getDonationById,
  getAdvertisements,
  getDonationByOrgId,
  getDonationByOrgIdConnection,
  getlanguage,
  getPlugins,
  isSampleOrganization,
  me,
  myLanguage,
  organizations,
  organizationsConnection,
  organizationsMemberConnection,
  post,
  postsByOrganization,
  postsByOrganizationConnection,
  registeredEventsByUser,
  user,
  userLanguage,
  users,
  usersConnection,
};
