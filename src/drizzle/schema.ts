// THIS FILE IS ONLY MEANT FOR IMPORTING/EXPORTING MODULES THAT ARE REQUIRED FOR DRIZZLE RELATIONAL QUERY BUILDING AND DRIZZLE DATABASE MIGRATIONS TO WORK.
// MAKE SURE TO NOT MISS ANY OF THE MODULES THAT ARE DIRECTLY CONCERNED WITH DRIZZLE DATABASE MIGRATIONS. FAILING TO DO SO WILL RESULT IN INCORRECT DRIZZLE DATABASE MIGRATIONS BEING GENERATED.

export {
	actionCategoriesTable,
	actionCategoriesTableRelations,
} from "./tables/actionCategories";
export { actionsTable, actionsTableRelations } from "./tables/actions";
export {
	advertisementAttachmentsTable,
	advertisementAttachmentsTableRelations,
} from "./tables/advertisementAttachments";
export {
	advertisementsTable,
	advertisementsTableRelations,
} from "./tables/advertisements";
export {
	agendaItemsTable,
	agendaItemsTableRelations,
} from "./tables/agendaItems";
export {
	agendaFoldersTable,
	agendaFoldersTableRelations,
} from "./tables/agendaFolders";
export {
	chatMembershipsTable,
	chatMembershipsTableRelations,
} from "./tables/chatMemberships";
export {
	chatMessagesTable,
	chatMessagesTableRelations,
} from "./tables/chatMessages";
export { chatsTable, chatsTableRelations } from "./tables/chats";
export {
	commentVotesTable,
	commentVotesTableRelations,
} from "./tables/commentVotes";
export { commentsTable, commentsTableRelations } from "./tables/comments";
export {
	communitiesTable,
	communitiesTableRelations,
} from "./tables/communities";
export {
	eventAttachmentsTable,
	eventAttachmentsTableRelations,
} from "./tables/eventAttachments";
export {
	eventAttendancesTable,
	eventAttendancesTableRelations,
} from "./tables/eventAttendances";
export { eventsTable, eventsTableRelations } from "./tables/events";
export { familiesTable, familiesTableRelations } from "./tables/families";
export {
	familyMembershipsTable,
	familyMembershipsTableRelations,
} from "./tables/familyMemberships";
export {
	fundCampaignsTable,
	fundCampaignsTableRelations,
} from "./tables/fundCampaigns";
export { fundsTable, fundsTableRelations } from "./tables/funds";
export {
	organizationMembershipsTable,
	organizationMembershipsTableRelations,
} from "./tables/organizationMemberships";
export {
	organizationsTable,
	organizationsTableRelations,
} from "./tables/organizations";
export {
	fundCampaignPledgesTable,
	fundCampaignPledgesTableRelations,
} from "./tables/fundCampaignPledges";
export {
	postAttachmentsTable,
	postAttachmentsTableRelations,
} from "./tables/postAttachments";
export { postVotesTable, postVotesTableRelations } from "./tables/postVotes";
export { postsTable, postsTableRelations } from "./tables/posts";
export {
	tagAssignmentsTable,
	tagAssignmentsTableRelations,
} from "./tables/tagAssignments";
export { tagFoldersTable, tagFoldersTableRelations } from "./tables/tagFolders";
export { tagsTable, tagsTableRelations } from "./tables/tags";
export { usersTable, usersTableRelations } from "./tables/users";
export {
	venueAttachmentsTable,
	venueAttachmentsTableRelations,
} from "./tables/venueAttachments";
export {
	venueBookingsTable,
	venueBookingsTableRelations,
} from "./tables/venueBookings";
export { venuesTable, venuesTableRelations } from "./tables/venues";
export {
	volunteerGroupAssignmentsTable,
	volunteerGroupAssignmentsTableRelations,
} from "./tables/volunteerGroupAssignments";
export {
	volunteerGroupsTable,
	volunteerGroupsTableRelations,
} from "./tables/volunteerGroups";
