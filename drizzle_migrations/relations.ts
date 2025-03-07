import { relations } from "drizzle-orm/relations";
import {
	events,
	actionCategories,
	actions,
	advertisementAttachments,
	advertisements,
	agendaFolders,
	agendaItems,
	chatMemberships,
	chatMessages,
	chats,
	commentVotes,
	comments,
	communities,
	eventAttachments,
	eventAttendances,
	families,
	familyMemberships,
	fundCampaignPledges,
	fundCampaigns,
	funds,
	membershipRequests,
	organizationMemberships,
	organizations,
	postAttachments,
	postVotes,
	posts,
	tagAssignments,
	tagFolders,
	tags,
	users,
	venueAttachments,
	venueBookings,
	venues,
	volunteerGroupAssignments,
	volunteerGroups,
} from "./schema";

export const organizationsRelations = relations(
	organizations,
	({ one, many }) => ({
		user_creatorId: one(users, {
			fields: [organizations.creatorId],
			references: [users.id],
			relationName: "organizations_creatorId_users_id",
		}),
		user_updaterId: one(users, {
			fields: [organizations.updaterId],
			references: [users.id],
			relationName: "organizations_updaterId_users_id",
		}),
		actionCategories: many(actionCategories),
		actions: many(actions),
		events: many(events),
		advertisements: many(advertisements),
		chats: many(chats),
		posts: many(posts),
		families: many(families),
		funds: many(funds),
		tags: many(tags),
		tagFolders: many(tagFolders),
		venues: many(venues),
		organizationMemberships: many(organizationMemberships),
		membershipRequests: many(membershipRequests),
	}),
);

export const usersRelations = relations(users, ({ one, many }) => ({
	organizations_creatorId: many(organizations, {
		relationName: "organizations_creatorId_users_id",
	}),
	organizations_updaterId: many(organizations, {
		relationName: "organizations_updaterId_users_id",
	}),
	user_creatorId: one(users, {
		fields: [users.creatorId],
		references: [users.id],
		relationName: "users_creatorId_users_id",
	}),
	users_creatorId: many(users, {
		relationName: "users_creatorId_users_id",
	}),
	user_updaterId: one(users, {
		fields: [users.updaterId],
		references: [users.id],
		relationName: "users_updaterId_users_id",
	}),
	users_updaterId: many(users, {
		relationName: "users_updaterId_users_id",
	}),
	actionCategories_creatorId: many(actionCategories, {
		relationName: "actionCategories_creatorId_users_id",
	}),
	actionCategories_updaterId: many(actionCategories, {
		relationName: "actionCategories_updaterId_users_id",
	}),
	actions_actorId: many(actions, {
		relationName: "actions_actorId_users_id",
	}),
	actions_creatorId: many(actions, {
		relationName: "actions_creatorId_users_id",
	}),
	actions_updaterId: many(actions, {
		relationName: "actions_updaterId_users_id",
	}),
	events_creatorId: many(events, {
		relationName: "events_creatorId_users_id",
	}),
	events_updaterId: many(events, {
		relationName: "events_updaterId_users_id",
	}),
	advertisements_creatorId: many(advertisements, {
		relationName: "advertisements_creatorId_users_id",
	}),
	advertisements_updaterId: many(advertisements, {
		relationName: "advertisements_updaterId_users_id",
	}),
	advertisementAttachments_creatorId: many(advertisementAttachments, {
		relationName: "advertisementAttachments_creatorId_users_id",
	}),
	advertisementAttachments_updaterId: many(advertisementAttachments, {
		relationName: "advertisementAttachments_updaterId_users_id",
	}),
	agendaFolders_creatorId: many(agendaFolders, {
		relationName: "agendaFolders_creatorId_users_id",
	}),
	agendaFolders_updaterId: many(agendaFolders, {
		relationName: "agendaFolders_updaterId_users_id",
	}),
	agendaItems_creatorId: many(agendaItems, {
		relationName: "agendaItems_creatorId_users_id",
	}),
	agendaItems_updaterId: many(agendaItems, {
		relationName: "agendaItems_updaterId_users_id",
	}),
	chats_creatorId: many(chats, {
		relationName: "chats_creatorId_users_id",
	}),
	chats_updaterId: many(chats, {
		relationName: "chats_updaterId_users_id",
	}),
	chatMessages: many(chatMessages),
	comments: many(comments),
	commentVotes: many(commentVotes),
	posts_creatorId: many(posts, {
		relationName: "posts_creatorId_users_id",
	}),
	posts_updaterId: many(posts, {
		relationName: "posts_updaterId_users_id",
	}),
	communities: many(communities),
	eventAttachments_creatorId: many(eventAttachments, {
		relationName: "eventAttachments_creatorId_users_id",
	}),
	eventAttachments_updaterId: many(eventAttachments, {
		relationName: "eventAttachments_updaterId_users_id",
	}),
	eventAttendances_attendeeId: many(eventAttendances, {
		relationName: "eventAttendances_attendeeId_users_id",
	}),
	eventAttendances_creatorId: many(eventAttendances, {
		relationName: "eventAttendances_creatorId_users_id",
	}),
	eventAttendances_updaterId: many(eventAttendances, {
		relationName: "eventAttendances_updaterId_users_id",
	}),
	families_creatorId: many(families, {
		relationName: "families_creatorId_users_id",
	}),
	families_updaterId: many(families, {
		relationName: "families_updaterId_users_id",
	}),
	fundCampaigns_creatorId: many(fundCampaigns, {
		relationName: "fundCampaigns_creatorId_users_id",
	}),
	fundCampaigns_updaterId: many(fundCampaigns, {
		relationName: "fundCampaigns_updaterId_users_id",
	}),
	fundCampaignPledges_creatorId: many(fundCampaignPledges, {
		relationName: "fundCampaignPledges_creatorId_users_id",
	}),
	fundCampaignPledges_pledgerId: many(fundCampaignPledges, {
		relationName: "fundCampaignPledges_pledgerId_users_id",
	}),
	fundCampaignPledges_updaterId: many(fundCampaignPledges, {
		relationName: "fundCampaignPledges_updaterId_users_id",
	}),
	funds_creatorId: many(funds, {
		relationName: "funds_creatorId_users_id",
	}),
	funds_updaterId: many(funds, {
		relationName: "funds_updaterId_users_id",
	}),
	postAttachments_creatorId: many(postAttachments, {
		relationName: "postAttachments_creatorId_users_id",
	}),
	postAttachments_updaterId: many(postAttachments, {
		relationName: "postAttachments_updaterId_users_id",
	}),
	postVotes: many(postVotes),
	tags_creatorId: many(tags, {
		relationName: "tags_creatorId_users_id",
	}),
	tags_updaterId: many(tags, {
		relationName: "tags_updaterId_users_id",
	}),
	tagFolders_creatorId: many(tagFolders, {
		relationName: "tagFolders_creatorId_users_id",
	}),
	tagFolders_updaterId: many(tagFolders, {
		relationName: "tagFolders_updaterId_users_id",
	}),
	venueAttachments_creatorId: many(venueAttachments, {
		relationName: "venueAttachments_creatorId_users_id",
	}),
	venueAttachments_updaterId: many(venueAttachments, {
		relationName: "venueAttachments_updaterId_users_id",
	}),
	venues_creatorId: many(venues, {
		relationName: "venues_creatorId_users_id",
	}),
	venues_updaterId: many(venues, {
		relationName: "venues_updaterId_users_id",
	}),
	volunteerGroups_creatorId: many(volunteerGroups, {
		relationName: "volunteerGroups_creatorId_users_id",
	}),
	volunteerGroups_leaderId: many(volunteerGroups, {
		relationName: "volunteerGroups_leaderId_users_id",
	}),
	volunteerGroups_updaterId: many(volunteerGroups, {
		relationName: "volunteerGroups_updaterId_users_id",
	}),
	tagAssignments_assigneeId: many(tagAssignments, {
		relationName: "tagAssignments_assigneeId_users_id",
	}),
	tagAssignments_creatorId: many(tagAssignments, {
		relationName: "tagAssignments_creatorId_users_id",
	}),
	venueBookings: many(venueBookings),
	chatMemberships_creatorId: many(chatMemberships, {
		relationName: "chatMemberships_creatorId_users_id",
	}),
	chatMemberships_memberId: many(chatMemberships, {
		relationName: "chatMemberships_memberId_users_id",
	}),
	chatMemberships_updaterId: many(chatMemberships, {
		relationName: "chatMemberships_updaterId_users_id",
	}),
	familyMemberships_creatorId: many(familyMemberships, {
		relationName: "familyMemberships_creatorId_users_id",
	}),
	familyMemberships_memberId: many(familyMemberships, {
		relationName: "familyMemberships_memberId_users_id",
	}),
	familyMemberships_updaterId: many(familyMemberships, {
		relationName: "familyMemberships_updaterId_users_id",
	}),
	organizationMemberships_creatorId: many(organizationMemberships, {
		relationName: "organizationMemberships_creatorId_users_id",
	}),
	organizationMemberships_memberId: many(organizationMemberships, {
		relationName: "organizationMemberships_memberId_users_id",
	}),
	organizationMemberships_updaterId: many(organizationMemberships, {
		relationName: "organizationMemberships_updaterId_users_id",
	}),
	volunteerGroupAssignments_assigneeId: many(volunteerGroupAssignments, {
		relationName: "volunteerGroupAssignments_assigneeId_users_id",
	}),
	volunteerGroupAssignments_creatorId: many(volunteerGroupAssignments, {
		relationName: "volunteerGroupAssignments_creatorId_users_id",
	}),
	volunteerGroupAssignments_updaterId: many(volunteerGroupAssignments, {
		relationName: "volunteerGroupAssignments_updaterId_users_id",
	}),
	membershipRequests_userId: many(membershipRequests, {
		relationName: "membership_requests.user_id:users.id",
	}),
}));

export const actionCategoriesRelations = relations(
	actionCategories,
	({ one, many }) => ({
		user_creatorId: one(users, {
			fields: [actionCategories.creatorId],
			references: [users.id],
			relationName: "actionCategories_creatorId_users_id",
		}),
		organization: one(organizations, {
			fields: [actionCategories.organizationId],
			references: [organizations.id],
		}),
		user_updaterId: one(users, {
			fields: [actionCategories.updaterId],
			references: [users.id],
			relationName: "actionCategories_updaterId_users_id",
		}),
		actions: many(actions),
	}),
);

export const actionsRelations = relations(actions, ({ one }) => ({
	user_actorId: one(users, {
		fields: [actions.actorId],
		references: [users.id],
		relationName: "actions_actorId_users_id",
	}),
	actionCategory: one(actionCategories, {
		fields: [actions.categoryId],
		references: [actionCategories.id],
	}),
	user_creatorId: one(users, {
		fields: [actions.creatorId],
		references: [users.id],
		relationName: "actions_creatorId_users_id",
	}),
	event: one(events, {
		fields: [actions.eventId],
		references: [events.id],
	}),
	organization: one(organizations, {
		fields: [actions.organizationId],
		references: [organizations.id],
	}),
	user_updaterId: one(users, {
		fields: [actions.updaterId],
		references: [users.id],
		relationName: "actions_updaterId_users_id",
	}),
}));

export const eventsRelations = relations(events, ({ one, many }) => ({
	actions: many(actions),
	user_creatorId: one(users, {
		fields: [events.creatorId],
		references: [users.id],
		relationName: "events_creatorId_users_id",
	}),
	organization: one(organizations, {
		fields: [events.organizationId],
		references: [organizations.id],
	}),
	user_updaterId: one(users, {
		fields: [events.updaterId],
		references: [users.id],
		relationName: "events_updaterId_users_id",
	}),
	agendaFolders: many(agendaFolders),
	eventAttachments: many(eventAttachments),
	eventAttendances: many(eventAttendances),
	volunteerGroups: many(volunteerGroups),
	venueBookings: many(venueBookings),
}));

export const advertisementsRelations = relations(
	advertisements,
	({ one, many }) => ({
		user_creatorId: one(users, {
			fields: [advertisements.creatorId],
			references: [users.id],
			relationName: "advertisements_creatorId_users_id",
		}),
		organization: one(organizations, {
			fields: [advertisements.organizationId],
			references: [organizations.id],
		}),
		user_updaterId: one(users, {
			fields: [advertisements.updaterId],
			references: [users.id],
			relationName: "advertisements_updaterId_users_id",
		}),
		advertisementAttachments: many(advertisementAttachments),
	}),
);

export const advertisementAttachmentsRelations = relations(
	advertisementAttachments,
	({ one }) => ({
		advertisement: one(advertisements, {
			fields: [advertisementAttachments.advertisementId],
			references: [advertisements.id],
		}),
		user_creatorId: one(users, {
			fields: [advertisementAttachments.creatorId],
			references: [users.id],
			relationName: "advertisementAttachments_creatorId_users_id",
		}),
		user_updaterId: one(users, {
			fields: [advertisementAttachments.updaterId],
			references: [users.id],
			relationName: "advertisementAttachments_updaterId_users_id",
		}),
	}),
);

export const agendaFoldersRelations = relations(
	agendaFolders,
	({ one, many }) => ({
		user_creatorId: one(users, {
			fields: [agendaFolders.creatorId],
			references: [users.id],
			relationName: "agendaFolders_creatorId_users_id",
		}),
		event: one(events, {
			fields: [agendaFolders.eventId],
			references: [events.id],
		}),
		agendaFolder: one(agendaFolders, {
			fields: [agendaFolders.parentFolderId],
			references: [agendaFolders.id],
			relationName: "agendaFolders_parentFolderId_agendaFolders_id",
		}),
		agendaFolders: many(agendaFolders, {
			relationName: "agendaFolders_parentFolderId_agendaFolders_id",
		}),
		user_updaterId: one(users, {
			fields: [agendaFolders.updaterId],
			references: [users.id],
			relationName: "agendaFolders_updaterId_users_id",
		}),
		agendaItems: many(agendaItems),
	}),
);

export const agendaItemsRelations = relations(agendaItems, ({ one }) => ({
	user_creatorId: one(users, {
		fields: [agendaItems.creatorId],
		references: [users.id],
		relationName: "agendaItems_creatorId_users_id",
	}),
	agendaFolder: one(agendaFolders, {
		fields: [agendaItems.folderId],
		references: [agendaFolders.id],
	}),
	user_updaterId: one(users, {
		fields: [agendaItems.updaterId],
		references: [users.id],
		relationName: "agendaItems_updaterId_users_id",
	}),
}));

export const chatsRelations = relations(chats, ({ one, many }) => ({
	user_creatorId: one(users, {
		fields: [chats.creatorId],
		references: [users.id],
		relationName: "chats_creatorId_users_id",
	}),
	organization: one(organizations, {
		fields: [chats.organizationId],
		references: [organizations.id],
	}),
	user_updaterId: one(users, {
		fields: [chats.updaterId],
		references: [users.id],
		relationName: "chats_updaterId_users_id",
	}),
	chatMessages: many(chatMessages),
	chatMemberships: many(chatMemberships),
}));

export const chatMessagesRelations = relations(
	chatMessages,
	({ one, many }) => ({
		chat: one(chats, {
			fields: [chatMessages.chatId],
			references: [chats.id],
		}),
		user: one(users, {
			fields: [chatMessages.creatorId],
			references: [users.id],
		}),
		chatMessage: one(chatMessages, {
			fields: [chatMessages.parentMessageId],
			references: [chatMessages.id],
			relationName: "chatMessages_parentMessageId_chatMessages_id",
		}),
		chatMessages: many(chatMessages, {
			relationName: "chatMessages_parentMessageId_chatMessages_id",
		}),
	}),
);

export const commentsRelations = relations(comments, ({ one, many }) => ({
	user: one(users, {
		fields: [comments.creatorId],
		references: [users.id],
	}),
	post: one(posts, {
		fields: [comments.postId],
		references: [posts.id],
	}),
	commentVotes: many(commentVotes),
}));

export const postsRelations = relations(posts, ({ one, many }) => ({
	comments: many(comments),
	user_creatorId: one(users, {
		fields: [posts.creatorId],
		references: [users.id],
		relationName: "posts_creatorId_users_id",
	}),
	organization: one(organizations, {
		fields: [posts.organizationId],
		references: [organizations.id],
	}),
	user_updaterId: one(users, {
		fields: [posts.updaterId],
		references: [users.id],
		relationName: "posts_updaterId_users_id",
	}),
	postAttachments: many(postAttachments),
	postVotes: many(postVotes),
}));

export const commentVotesRelations = relations(commentVotes, ({ one }) => ({
	comment: one(comments, {
		fields: [commentVotes.commentId],
		references: [comments.id],
	}),
	user: one(users, {
		fields: [commentVotes.creatorId],
		references: [users.id],
	}),
}));

export const communitiesRelations = relations(communities, ({ one }) => ({
	user: one(users, {
		fields: [communities.updaterId],
		references: [users.id],
	}),
}));

export const eventAttachmentsRelations = relations(
	eventAttachments,
	({ one }) => ({
		user_creatorId: one(users, {
			fields: [eventAttachments.creatorId],
			references: [users.id],
			relationName: "eventAttachments_creatorId_users_id",
		}),
		event: one(events, {
			fields: [eventAttachments.eventId],
			references: [events.id],
		}),
		user_updaterId: one(users, {
			fields: [eventAttachments.updaterId],
			references: [users.id],
			relationName: "eventAttachments_updaterId_users_id",
		}),
	}),
);

export const eventAttendancesRelations = relations(
	eventAttendances,
	({ one }) => ({
		user_attendeeId: one(users, {
			fields: [eventAttendances.attendeeId],
			references: [users.id],
			relationName: "eventAttendances_attendeeId_users_id",
		}),
		user_creatorId: one(users, {
			fields: [eventAttendances.creatorId],
			references: [users.id],
			relationName: "eventAttendances_creatorId_users_id",
		}),
		event: one(events, {
			fields: [eventAttendances.eventId],
			references: [events.id],
		}),
		user_updaterId: one(users, {
			fields: [eventAttendances.updaterId],
			references: [users.id],
			relationName: "eventAttendances_updaterId_users_id",
		}),
	}),
);

export const familiesRelations = relations(families, ({ one, many }) => ({
	user_creatorId: one(users, {
		fields: [families.creatorId],
		references: [users.id],
		relationName: "families_creatorId_users_id",
	}),
	organization: one(organizations, {
		fields: [families.organizationId],
		references: [organizations.id],
	}),
	user_updaterId: one(users, {
		fields: [families.updaterId],
		references: [users.id],
		relationName: "families_updaterId_users_id",
	}),
	familyMemberships: many(familyMemberships),
}));

export const fundCampaignsRelations = relations(
	fundCampaigns,
	({ one, many }) => ({
		user_creatorId: one(users, {
			fields: [fundCampaigns.creatorId],
			references: [users.id],
			relationName: "fundCampaigns_creatorId_users_id",
		}),
		fund: one(funds, {
			fields: [fundCampaigns.fundId],
			references: [funds.id],
		}),
		user_updaterId: one(users, {
			fields: [fundCampaigns.updaterId],
			references: [users.id],
			relationName: "fundCampaigns_updaterId_users_id",
		}),
		fundCampaignPledges: many(fundCampaignPledges),
	}),
);

export const fundsRelations = relations(funds, ({ one, many }) => ({
	fundCampaigns: many(fundCampaigns),
	user_creatorId: one(users, {
		fields: [funds.creatorId],
		references: [users.id],
		relationName: "funds_creatorId_users_id",
	}),
	organization: one(organizations, {
		fields: [funds.organizationId],
		references: [organizations.id],
	}),
	user_updaterId: one(users, {
		fields: [funds.updaterId],
		references: [users.id],
		relationName: "funds_updaterId_users_id",
	}),
}));

export const fundCampaignPledgesRelations = relations(
	fundCampaignPledges,
	({ one }) => ({
		fundCampaign: one(fundCampaigns, {
			fields: [fundCampaignPledges.campaignId],
			references: [fundCampaigns.id],
		}),
		user_creatorId: one(users, {
			fields: [fundCampaignPledges.creatorId],
			references: [users.id],
			relationName: "fundCampaignPledges_creatorId_users_id",
		}),
		user_pledgerId: one(users, {
			fields: [fundCampaignPledges.pledgerId],
			references: [users.id],
			relationName: "fundCampaignPledges_pledgerId_users_id",
		}),
		user_updaterId: one(users, {
			fields: [fundCampaignPledges.updaterId],
			references: [users.id],
			relationName: "fundCampaignPledges_updaterId_users_id",
		}),
	}),
);

export const postAttachmentsRelations = relations(
	postAttachments,
	({ one }) => ({
		user_creatorId: one(users, {
			fields: [postAttachments.creatorId],
			references: [users.id],
			relationName: "postAttachments_creatorId_users_id",
		}),
		post: one(posts, {
			fields: [postAttachments.postId],
			references: [posts.id],
		}),
		user_updaterId: one(users, {
			fields: [postAttachments.updaterId],
			references: [users.id],
			relationName: "postAttachments_updaterId_users_id",
		}),
	}),
);

export const postVotesRelations = relations(postVotes, ({ one }) => ({
	user: one(users, {
		fields: [postVotes.creatorId],
		references: [users.id],
	}),
	post: one(posts, {
		fields: [postVotes.postId],
		references: [posts.id],
	}),
}));

export const tagsRelations = relations(tags, ({ one, many }) => ({
	user_creatorId: one(users, {
		fields: [tags.creatorId],
		references: [users.id],
		relationName: "tags_creatorId_users_id",
	}),
	tagFolder: one(tagFolders, {
		fields: [tags.folderId],
		references: [tagFolders.id],
	}),
	organization: one(organizations, {
		fields: [tags.organizationId],
		references: [organizations.id],
	}),
	user_updaterId: one(users, {
		fields: [tags.updaterId],
		references: [users.id],
		relationName: "tags_updaterId_users_id",
	}),
	tagAssignments: many(tagAssignments),
}));

export const tagFoldersRelations = relations(tagFolders, ({ one, many }) => ({
	tags: many(tags),
	user_creatorId: one(users, {
		fields: [tagFolders.creatorId],
		references: [users.id],
		relationName: "tagFolders_creatorId_users_id",
	}),
	organization: one(organizations, {
		fields: [tagFolders.organizationId],
		references: [organizations.id],
	}),
	tagFolder: one(tagFolders, {
		fields: [tagFolders.parentFolderId],
		references: [tagFolders.id],
		relationName: "tagFolders_parentFolderId_tagFolders_id",
	}),
	tagFolders: many(tagFolders, {
		relationName: "tagFolders_parentFolderId_tagFolders_id",
	}),
	user_updaterId: one(users, {
		fields: [tagFolders.updaterId],
		references: [users.id],
		relationName: "tagFolders_updaterId_users_id",
	}),
}));

export const venueAttachmentsRelations = relations(
	venueAttachments,
	({ one }) => ({
		user_creatorId: one(users, {
			fields: [venueAttachments.creatorId],
			references: [users.id],
			relationName: "venueAttachments_creatorId_users_id",
		}),
		user_updaterId: one(users, {
			fields: [venueAttachments.updaterId],
			references: [users.id],
			relationName: "venueAttachments_updaterId_users_id",
		}),
		venue: one(venues, {
			fields: [venueAttachments.venueId],
			references: [venues.id],
		}),
	}),
);

export const venuesRelations = relations(venues, ({ one, many }) => ({
	venueAttachments: many(venueAttachments),
	user_creatorId: one(users, {
		fields: [venues.creatorId],
		references: [users.id],
		relationName: "venues_creatorId_users_id",
	}),
	organization: one(organizations, {
		fields: [venues.organizationId],
		references: [organizations.id],
	}),
	user_updaterId: one(users, {
		fields: [venues.updaterId],
		references: [users.id],
		relationName: "venues_updaterId_users_id",
	}),
	venueBookings: many(venueBookings),
}));

export const volunteerGroupsRelations = relations(
	volunteerGroups,
	({ one, many }) => ({
		user_creatorId: one(users, {
			fields: [volunteerGroups.creatorId],
			references: [users.id],
			relationName: "volunteerGroups_creatorId_users_id",
		}),
		event: one(events, {
			fields: [volunteerGroups.eventId],
			references: [events.id],
		}),
		user_leaderId: one(users, {
			fields: [volunteerGroups.leaderId],
			references: [users.id],
			relationName: "volunteerGroups_leaderId_users_id",
		}),
		user_updaterId: one(users, {
			fields: [volunteerGroups.updaterId],
			references: [users.id],
			relationName: "volunteerGroups_updaterId_users_id",
		}),
		volunteerGroupAssignments: many(volunteerGroupAssignments),
	}),
);

export const tagAssignmentsRelations = relations(tagAssignments, ({ one }) => ({
	user_assigneeId: one(users, {
		fields: [tagAssignments.assigneeId],
		references: [users.id],
		relationName: "tagAssignments_assigneeId_users_id",
	}),
	user_creatorId: one(users, {
		fields: [tagAssignments.creatorId],
		references: [users.id],
		relationName: "tagAssignments_creatorId_users_id",
	}),
	tag: one(tags, {
		fields: [tagAssignments.tagId],
		references: [tags.id],
	}),
}));

export const venueBookingsRelations = relations(venueBookings, ({ one }) => ({
	user: one(users, {
		fields: [venueBookings.creatorId],
		references: [users.id],
	}),
	event: one(events, {
		fields: [venueBookings.eventId],
		references: [events.id],
	}),
	venue: one(venues, {
		fields: [venueBookings.venueId],
		references: [venues.id],
	}),
}));

export const chatMembershipsRelations = relations(
	chatMemberships,
	({ one }) => ({
		user_creatorId: one(users, {
			fields: [chatMemberships.creatorId],
			references: [users.id],
			relationName: "chatMemberships_creatorId_users_id",
		}),
		chat: one(chats, {
			fields: [chatMemberships.chatId],
			references: [chats.id],
		}),
		user_memberId: one(users, {
			fields: [chatMemberships.memberId],
			references: [users.id],
			relationName: "chatMemberships_memberId_users_id",
		}),
		user_updaterId: one(users, {
			fields: [chatMemberships.updaterId],
			references: [users.id],
			relationName: "chatMemberships_updaterId_users_id",
		}),
	}),
);

export const familyMembershipsRelations = relations(
	familyMemberships,
	({ one }) => ({
		user_creatorId: one(users, {
			fields: [familyMemberships.creatorId],
			references: [users.id],
			relationName: "familyMemberships_creatorId_users_id",
		}),
		family: one(families, {
			fields: [familyMemberships.familyId],
			references: [families.id],
		}),
		user_memberId: one(users, {
			fields: [familyMemberships.memberId],
			references: [users.id],
			relationName: "familyMemberships_memberId_users_id",
		}),
		user_updaterId: one(users, {
			fields: [familyMemberships.updaterId],
			references: [users.id],
			relationName: "familyMemberships_updaterId_users_id",
		}),
	}),
);

export const organizationMembershipsRelations = relations(
	organizationMemberships,
	({ one }) => ({
		user_creatorId: one(users, {
			fields: [organizationMemberships.creatorId],
			references: [users.id],
			relationName: "organizationMemberships_creatorId_users_id",
		}),
		user_memberId: one(users, {
			fields: [organizationMemberships.memberId],
			references: [users.id],
			relationName: "organizationMemberships_memberId_users_id",
		}),
		organization: one(organizations, {
			fields: [organizationMemberships.organizationId],
			references: [organizations.id],
		}),
		user_updaterId: one(users, {
			fields: [organizationMemberships.updaterId],
			references: [users.id],
			relationName: "organizationMemberships_updaterId_users_id",
		}),
	}),
);

export const volunteerGroupAssignmentsRelations = relations(
	volunteerGroupAssignments,
	({ one }) => ({
		user_assigneeId: one(users, {
			fields: [volunteerGroupAssignments.assigneeId],
			references: [users.id],
			relationName: "volunteerGroupAssignments_assigneeId_users_id",
		}),
		user_creatorId: one(users, {
			fields: [volunteerGroupAssignments.creatorId],
			references: [users.id],
			relationName: "volunteerGroupAssignments_creatorId_users_id",
		}),
		volunteerGroup: one(volunteerGroups, {
			fields: [volunteerGroupAssignments.groupId],
			references: [volunteerGroups.id],
		}),
		user_updaterId: one(users, {
			fields: [volunteerGroupAssignments.updaterId],
			references: [users.id],
			relationName: "volunteerGroupAssignments_updaterId_users_id",
		}),
	}),
);

export const membershipRequestsRelations = relations(
	membershipRequests,
	({ one }) => ({
		user: one(users, {
			fields: [membershipRequests.userId],
			references: [users.id],
			relationName: "membership_requests.user_id:users.id",
		}),
		organization: one(organizations, {
			fields: [membershipRequests.organizationId],
			references: [organizations.id],
			relationName: "membership_requests.organization_id:organizations.id",
		}),
		membership: one(organizationMemberships, {
			fields: [membershipRequests.userId, membershipRequests.organizationId],
			references: [
				organizationMemberships.memberId,
				organizationMemberships.organizationId,
			],
			relationName:
				"membership_requests.user_id+organization_id:organization_memberships.member_id+organization_id",
		}),
	}),
);
