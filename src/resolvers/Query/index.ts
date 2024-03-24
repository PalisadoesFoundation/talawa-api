import type { QueryResolvers } from "../../types/generatedGraphQLTypes";
import { isSampleOrganization } from "../Query/organizationIsSample";
import { actionItemCategoriesByOrganization } from "./actionItemCategoriesByOrganization";
import { advertisementsConnection } from "./advertisementsConnection";
import { actionItemsByEvent } from "./actionItemsByEvent";
import { actionItemsByOrganization } from "./actionItemsByOrganization";
import { checkAuth } from "./checkAuth";
import { getCommunityData } from "./getCommunityData";
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
import { getFundById } from "./getFundById";
import { getPlugins } from "./getPlugins";
import { getlanguage } from "./getlanguage";
import { me } from "./me";
import { myLanguage } from "./myLanguage";
import { organizations } from "./organizations";
import { organizationsConnection } from "./organizationsConnection";
import { organizationsMemberConnection } from "./organizationsMemberConnection";
import { post } from "./post";
import { registeredEventsByUser } from "./registeredEventsByUser";
import { user } from "./user";
import { userLanguage } from "./userLanguage";
import { users } from "./users";
import { usersConnection } from "./usersConnection";
import { agendaCategory } from "./agendaCategory";
import { getAllAgendaItems } from "./getAllAgendaItems";
import { getAgendaItem } from "./agendaItemById";
import { venue } from "./venue";

export const Query: QueryResolvers = {
  actionItemsByEvent,
  agendaCategory,
  getAgendaItem,
  getAllAgendaItems,
  actionItemsByOrganization,
  actionItemCategoriesByOrganization,
  checkAuth,
  getCommunityData,
  customFieldsByOrganization,
  customDataByOrganization,
  directChatsByUserID,
  directChatsMessagesByChatID,
  event,
  eventsByOrganization,
  eventsByOrganizationConnection,
  getDonationById,
  advertisementsConnection,
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
  registeredEventsByUser,
  user,
  userLanguage,
  users,
  usersConnection,
  getFundById,
  venue,
};
