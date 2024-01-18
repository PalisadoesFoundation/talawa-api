import type { QueryResolvers } from "../../types/generatedGraphQLTypes";
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
import { getAgendaItem } from "./AgendaItemById";
import { getAllAgendaItems } from "./AgendaItems";
import { getAgendaSection } from "./getAgendaSectionById";
import { getAllAgendaSections } from "./getAllAgendaSections";
import { agendaCategory } from "./getAgendaCategoryById";
import { agendaCategories } from "./getAllAgendaCategories";
export const Query: QueryResolvers = {
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
  agendaCategory,
  agendaCategories,
  getAgendaItem,
  getAllAgendaItems,
  getAgendaSection,
  getAllAgendaSections,
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
