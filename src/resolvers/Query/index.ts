import type { QueryResolvers } from "../../types/generatedGraphQLTypes";
import { isSampleOrganization } from "../Query/organizationIsSample";
import { actionItemCategoriesByOrganization } from "./actionItemCategoriesByOrganization";
import { actionItemsByEvent } from "./actionItemsByEvent";
import { actionItemsByOrganization } from "./actionItemsByOrganization";
import { advertisementsConnection } from "./advertisementsConnection";
import { agendaCategory } from "./agendaCategory";
import { agendaItemByEvent } from "./agendaItemByEvent";
import { agendaItemByOrganization } from "./agendaItemByOrganization";
import { agendaItemCategoriesByOrganization } from "./agendaItemCategoriesByOrganization";
import { getAgendaItem } from "./agendaItemById";
import { getAgendaSection } from "./getAgendaSection";
import { checkAuth } from "./checkAuth";
import { customDataByOrganization } from "./customDataByOrganization";
import { customFieldsByOrganization } from "./customFieldsByOrganization";
import { chatById } from "./chatById";
import { chatsByUserId } from "./chatsByUserId";
import { event } from "./event";
import { eventsByOrganization } from "./eventsByOrganization";
import { eventsByOrganizationConnection } from "./eventsByOrganizationConnection";
import { getEventVolunteerGroups } from "./getEventVolunteerGroups";
import { fundsByOrganization } from "./fundsByOrganization";
import { getAllAgendaItems } from "./getAllAgendaItems";
import { getEventInvitesByUserId } from "./getEventInvitesByUserId";
import { getCommunityData } from "./getCommunityData";
import { getDonationById } from "./getDonationById";
import { getDonationByOrgId } from "./getDonationByOrgId";
import { getDonationByOrgIdConnection } from "./getDonationByOrgIdConnection";
import { getFundById } from "./getFundById";
import { getFundraisingCampaigns } from "./getFundraisingCampaigns";
import { getPledgesByUserId } from "./getPledgesByUserId";
import { getPlugins } from "./getPlugins";
import { getlanguage } from "./getlanguage";
import { getUserTag } from "./getUserTag";
import { getUserTagAncestors } from "./getUserTagAncestors";
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
import { venue } from "./venue";
import { getEventAttendee } from "./getEventAttendee";
import { getEventAttendeesByEventId } from "./getEventAttendeesByEventId";
import { getVenueByOrgId } from "./getVenueByOrgId";
import { getAllNotesForAgendaItem } from "./getAllNotesForAgendaItem";
import { getNoteById } from "./getNoteById";
import { eventsAttendedByUser } from "./eventsAttendedByUser";
import { getRecurringEvents } from "./getRecurringEvents";

export const Query: QueryResolvers = {
  actionItemsByEvent,
  agendaCategory,
  getAgendaItem,
  getAgendaSection,
  getAllAgendaItems,
  actionItemsByOrganization,
  actionItemCategoriesByOrganization,
  agendaItemByEvent,
  agendaItemByOrganization,
  agendaItemCategoriesByOrganization,
  checkAuth,
  getCommunityData,
  customFieldsByOrganization,
  customDataByOrganization,
  chatById,
  chatsByUserId,
  event,
  eventsByOrganization,
  eventsByOrganizationConnection,
  getDonationById,
  advertisementsConnection,
  getDonationByOrgId,
  getDonationByOrgIdConnection,
  getEventInvitesByUserId,
  getEventVolunteerGroups,
  getAllNotesForAgendaItem,
  getNoteById,
  getlanguage,
  getPlugins,
  getRecurringEvents,
  getUserTag,
  getUserTagAncestors,
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
  getFundraisingCampaigns,
  venue,
  fundsByOrganization,
  getPledgesByUserId,
  getEventAttendee,
  getEventAttendeesByEventId,
  getVenueByOrgId,
  eventsAttendedByUser,
};
