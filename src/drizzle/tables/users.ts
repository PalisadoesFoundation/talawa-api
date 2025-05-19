import { relations, sql } from "drizzle-orm";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import {
	boolean,
	date,
	index,
	pgTable,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { uuidv7 } from "uuidv7";
import { imageMimeTypeEnum } from "~/src/drizzle/enums/imageMimeType";
import { iso639Set1LanguageCodeEnum } from "~/src/drizzle/enums/iso639Set1LanguageCode";
import { iso3166Alpha2CountryCodeEnum } from "~/src/drizzle/enums/iso3166Alpha2CountryCode";
import { userEducationGradeEnum } from "~/src/drizzle/enums/userEducationGrade";
import { userEmploymentStatusEnum } from "~/src/drizzle/enums/userEmploymentStatus";
import { userMaritalStatusEnum } from "~/src/drizzle/enums/userMaritalStatus";
import { userNatalSexEnum } from "~/src/drizzle/enums/userNatalSex";
import { userRoleEnum } from "~/src/drizzle/enums/userRole";
import { actionCategoriesTable } from "./actionCategories";
import { actionsTable } from "./actions";
import { advertisementAttachmentsTable } from "./advertisementAttachments";
import { advertisementsTable } from "./advertisements";
import { agendaFoldersTable } from "./agendaFolders";
import { agendaItemsTable } from "./agendaItems";
import { chatMembershipsTable } from "./chatMemberships";
import { chatMessagesTable } from "./chatMessages";
import { chatsTable } from "./chats";
import { commentVotesTable } from "./commentVotes";
import { commentsTable } from "./comments";
import { communitiesTable } from "./communities";
import { eventAttachmentsTable } from "./eventAttachments";
import { eventAttendancesTable } from "./eventAttendances";
import { eventsTable } from "./events";
import { familiesTable } from "./families";
import { familyMembershipsTable } from "./familyMemberships";
import { fundCampaignPledgesTable } from "./fundCampaignPledges";
import { fundCampaignsTable } from "./fundCampaigns";
import { fundsTable } from "./funds";
import { organizationMembershipsTable } from "./organizationMemberships";
import { organizationsTable } from "./organizations";
import { postAttachmentsTable } from "./postAttachments";
import { postVotesTable } from "./postVotes";
import { postsTable } from "./posts";
import { tagAssignmentsTable } from "./tagAssignments";
import { tagFoldersTable } from "./tagFolders";
import { tagsTable } from "./tags";
import { venueAttachmentsTable } from "./venueAttachments";
import { venueBookingsTable } from "./venueBookings";
import { venuesTable } from "./venues";
import { volunteerGroupAssignmentsTable } from "./volunteerGroupAssignments";
import { volunteerGroupsTable } from "./volunteerGroups";

/**
 * Drizzle orm postgres table definition for users.
 */
export const usersTable = pgTable(
	"users",
	{
		/**
		 * Address line 1 of the user's address.
		 */
		addressLine1: text("address_line_1"),
		/**
		 * Address line 2 of the user's address.
		 */
		addressLine2: text("address_line_2"),
		/**
		 * Mime type of the avatar of the user.
		 */
		avatarMimeType: text("avatar_mime_type", {
			enum: imageMimeTypeEnum.options,
		}),
		/**
		 * Primary unique identifier of the user's avatar.
		 */
		avatarName: text("avatar_name"),
		/**
		 * Date of birth of the user.
		 */
		birthDate: date("birth_date", {
			mode: "date",
		}),
		/**
		 * Name of the city where user resides in.
		 */
		city: text("city"),
		/**
		 * Country code of the country the user is a citizen of.
		 */
		countryCode: text("country_code", {
			enum: iso3166Alpha2CountryCodeEnum.options,
		}),
		/**
		 * Date time at the time the user was created.
		 */
		createdAt: timestamp("created_at", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		})
			.notNull()
			.defaultNow(),
		/**
		 * Foreign key reference to the id of the user who created the user.
		 */
		creatorId: uuid("creator_id").references((): AnyPgColumn => usersTable.id, {
			onDelete: "set null",
			onUpdate: "cascade",
		}),
		/**
		 * Custom information about the user.
		 */
		description: text("description"),
		/**
		 * Primary education grade of the user.
		 */
		educationGrade: text("education_grade", {
			enum: userEducationGradeEnum.options,
		}),
		/**
		 * Email address of the user.
		 */
		emailAddress: text("email_address").notNull().unique(),
		/**
		 * Employment status of the user.
		 */
		employmentStatus: text("employment_status", {
			enum: userEmploymentStatusEnum.options,
		}),
		/**
		 * The phone number to use to communicate with the user at their home.
		 */
		homePhoneNumber: text("home_phone_number"),
		/**
		 * Primary unique identifier of the user.
		 */
		id: uuid("id").primaryKey().$default(uuidv7),
		/**
		 * Boolean to tell whether the user has verified their email or not.
		 */
		isEmailAddressVerified: boolean("is_email_address_verified").notNull(),
		/**
		 * Marital status of the user.
		 */
		maritalStatus: text("marital_status", {
			enum: userMaritalStatusEnum.options,
		}),
		/**
		 * The phone number to use to communicate with the user on their mobile phone.
		 */
		mobilePhoneNumber: text("mobile_phone_number"),
		/**
		 * Name of the user.
		 */
		name: text("name").notNull(),
		/**
		 * The sex assigned to the user at their birth.
		 */
		natalSex: text("natal_sex", {
			enum: userNatalSexEnum.options,
		}),
		/**
		 * Language code of the user's preferred natural language.
		 */
		naturalLanguageCode: text("natural_language_code", {
			enum: iso639Set1LanguageCodeEnum.options,
		}),
		/**
		 * Cryptographic hash of the password of the user to sign in to the application.
		 */
		passwordHash: text("password_hash").notNull(),
		/**
		 * Postal code of the user.
		 */
		postalCode: text("postal_code"),
		/**
		 * Role assigned to the user.
		 */
		role: text("role", {
			enum: userRoleEnum.options,
		}).notNull(),
		/**
		 * Name of the state the user resides in within their country.
		 */
		state: text("state"),
		/**
		 * Date time at the time the user was last updated.
		 */
		updatedAt: timestamp("updated_at", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		})
			.$defaultFn(() => sql`${null}`)
			.$onUpdate(() => new Date()),
		/**
		 * Foreign key reference to the id of the user who last updated the user.
		 */
		updaterId: uuid("updater_id").references((): AnyPgColumn => usersTable.id, {
			onDelete: "set null",
			onUpdate: "cascade",
		}),
		/**
		 * The phone number to use to communicate with the user while they're at work.
		 */
		workPhoneNumber: text("work_phone_number"),
	},
	(self) => [
		index().on(self.creatorId),
		index().on(self.name),
		index().on(self.updaterId),
	],
);

export const usersTableRelations = relations(usersTable, ({ many, one }) => ({
	/**
	 * One to many relationship from `users` table to `actions` table.
	 */
	actionsWhereAssignee: many(actionsTable, {
		relationName: "actions.assignee_id:users.id",
	}),
	/**
	 * One to many relationship from `users` table to `actions` table.
	 */
	actionsWhereCreator: many(actionsTable, {
		relationName: "actions.creator_id:users.id",
	}),
	/**
	 * One to many relationship from `users` table to `actions` table.
	 */
	actionsWhereUpdater: many(actionsTable, {
		relationName: "actions.updater_id:users.id",
	}),
	/**
	 * One to many relationship from `users` table to `action_categories` table.
	 */
	actionCategoriesWhereCreator: many(actionCategoriesTable, {
		relationName: "action_categories.creator_id:users.id",
	}),
	/**
	 * One to many relationship from `users` table to `action_categories` table.
	 */
	actionCategoriesWhereUpdater: many(actionCategoriesTable, {
		relationName: "action_categories.updater_id:users.id",
	}),
	/**
	 * One to many relationship from `users` table to `advertisement_attachments` table.
	 */
	advertisementAttachmentsWhereCreator: many(advertisementAttachmentsTable, {
		relationName: "advertisement_attachments.creator_id:users.id",
	}),
	/**
	 * One to many relationship from `users` table to `advertisement_attachments` table.
	 */
	advertisementAttachmentsWhereUpdater: many(advertisementAttachmentsTable, {
		relationName: "advertisement_attachments.updater_id:users.id",
	}),
	/**
	 * One to many relationship from `users` table to `advertisements` table.
	 */
	advertisementsWhereCreator: many(advertisementsTable, {
		relationName: "advertisements.creator_id:users.id",
	}),
	/**
	 * One to many relationship from `users` table to `advertisements` table.
	 */
	advertisementsWhereUpdater: many(advertisementsTable, {
		relationName: "advertisements.updater_id:users.id",
	}),
	/**
	 * One to many relationship from `users` table to `agenda_folders` table.
	 */
	agendaFoldersWhereCreator: many(agendaFoldersTable, {
		relationName: "agenda_folders.creator_id:users.id",
	}),
	/**
	 * One to many relationship from `users` table to `agenda_folders` table.
	 */
	agendaFoldersWhereUpdater: many(agendaFoldersTable, {
		relationName: "agenda_folders.updater_id:users.id",
	}),
	/**
	 * One to many relationship from `users` table to `agenda_items` table.
	 */
	agendaItemsWhereCreator: many(agendaItemsTable, {
		relationName: "agenda_items.creator_id:users.id",
	}),
	/**
	 * One to many relationship from `users` table to `agenda_items` table.
	 */
	agendaItemsWhereUpdater: many(agendaItemsTable, {
		relationName: "agenda_items.updater_id:users.id",
	}),
	/**
	 * One to many relationship from `users` table to `chats` table.
	 */
	chatsWhereCreator: many(chatsTable, {
		relationName: "chats.creator_id:users.id",
	}),
	/**
	 * One to many relationship from `users` table to `chats` table.
	 */
	chatsWhereUpdater: many(chatsTable, {
		relationName: "chats.updater_id:users.id",
	}),
	/**
	 * One to many relationship from `users` table to `chat_memberships` table.
	 */
	chatMembershipsWhereCreator: many(chatMembershipsTable, {
		relationName: "chat_memberships.creator_id:users.id",
	}),
	/**
	 * One to many relationship from `users` table to `chat_memberships` table.
	 */
	chatMembershipsWhereMember: many(chatMembershipsTable, {
		relationName: "chat_memberships.member_id:users.id",
	}),
	/**
	 * One to many relationship from `users` table to `chat_memberships` table.
	 */
	chatMembershipsWhereUpdater: many(chatMembershipsTable, {
		relationName: "chat_memberships.updater_id:users.id",
	}),
	/**
	 * One to many relationship from `users` table to `chat_messages` table.
	 */
	chatMessagesWhereCreator: many(chatMessagesTable, {
		relationName: "chat_messages.creator_id:users.id",
	}),
	/**
	 * One to many relationship from `users` table to `comments` table.
	 */
	commentsWhereCreator: many(commentsTable, {
		relationName: "comments.creator_id:users.id",
	}),
	/**
	 * One to many relationship from `users` table to `comment_votes` table.
	 */
	commentVotesWhereCreator: many(commentVotesTable, {
		relationName: "comment_votes.creator_id:users.id",
	}),
	/**
	 * One to many relationship from `users` table to `comment_votes` table.
	 */
	commentVotesWhereUpdater: many(commentVotesTable, {
		relationName: "comment_votes.updater_id:users.id",
	}),
	/**
	 * One to many relationship from `users` table to `communities` table.
	 */
	communitiesWhereUpdater: many(communitiesTable, {
		relationName: "communities.updater_id:users.id",
	}),
	/**
	 * Many to one relationship from `users` table to `users` table.
	 */
	creator: one(usersTable, {
		fields: [usersTable.creatorId],
		references: [usersTable.id],
		relationName: "users.creator_id:users.id",
	}),
	/**
	 * One to many relationship from `users` table to `events` table.
	 */
	eventsWhereCreator: many(eventsTable, {
		relationName: "events.creator_id:users.id",
	}),
	/**
	 * One to many relationship from `users` table to `events` table.
	 */
	eventsWhereUpdater: many(eventsTable, {
		relationName: "events.updater_id:users.id",
	}),
	/**
	 * One to many relationship from `users` table to `event_attachments` table.
	 */
	eventAttachmentsWhereCreator: many(eventAttachmentsTable, {
		relationName: "event_attachments.creator_id:users.id",
	}),
	/**
	 * One to many relationship from `users` table to `event_attachments` table.
	 */
	eventAttachmentsWhereUpdater: many(eventAttachmentsTable, {
		relationName: "event_attachments.updater_id:users.id",
	}),
	/**
	 * One to many relationship from `users` table to `event_attendances` table.
	 */
	eventAttendancesWhereAttendee: many(eventAttendancesTable, {
		relationName: "event_attendances.attendee_id:users.id",
	}),
	/**
	 * One to many relationship from `users` table to `event_attendances` table.
	 */
	eventAttendancesWhereCreator: many(eventAttendancesTable, {
		relationName: "event_attendances.creator_id:users.id",
	}),
	/**
	 * One to many relationship from `users` table to `event_attendances` table.
	 */
	eventAttendancesWhereUpdater: many(eventAttendancesTable, {
		relationName: "event_attendances.updater_id:users.id",
	}),
	/**
	 * One to many relationship from `users` table to `families` table.
	 */
	familiesWhereCreator: many(familiesTable, {
		relationName: "families.creator_id:users.id",
	}),
	/**
	 * One to many relationship from `users` table to `families` table.
	 */
	familiesWhereUpdater: many(familiesTable, {
		relationName: "families.updater_id:users.id",
	}),
	/**
	 * One to many relationship from `users` table to `family_memberships` table.
	 */
	familyMembershipsWhereCreator: many(familyMembershipsTable, {
		relationName: "family_memberships.creator_id:users.id",
	}),
	/**
	 * One to many relationship from `users` table to `family_memberships` table.
	 */
	familyMembershipsWhereMember: many(familyMembershipsTable, {
		relationName: "family_memberships.member_id:users.id",
	}),
	/**
	 * One to many relationship from `users` table to `family_memberships` table.
	 */
	familyMembershipsWhereUpdater: many(familyMembershipsTable, {
		relationName: "family_memberships.updater_id:users.id",
	}),
	/**
	 * One to many relationship from `users` table to `fund_campaigns` table.
	 */
	fundCampaignsWhereCreator: many(fundCampaignsTable, {
		relationName: "fund_campaigns.creator_id:users.id",
	}),
	/**
	 * One to many relationship from `users` table to `fund_campaigns` table.
	 */
	fundCampaignsWhereUpdater: many(fundCampaignsTable, {
		relationName: "fund_campaigns.updater_id:users.id",
	}),
	/**
	 * One to many relationship from `users` table to `funds` table.
	 */
	fundsWhereCreator: many(fundsTable, {
		relationName: "funds.creator_id:users.id",
	}),
	/**
	 * One to many relationship from `users` table to `funds` table.
	 */
	fundsWhereUpdater: many(fundsTable, {
		relationName: "funds.updater_id:users.id",
	}),
	/**
	 * One to many relationship from `users` table to `organizations` table.
	 */
	organizationsWhereCreator: many(organizationsTable, {
		relationName: "organizations.creator_id:users.id",
	}),
	/**
	 * One to many relationship from `users` table to `organizations` table.
	 */
	organizationsWhereUpdater: many(organizationsTable, {
		relationName: "organizations.updater_id:users.id",
	}),
	/**
	 * One to many relationship from `users` table to `organization_memberships` table.
	 */
	organizationMembershipsWhereCreator: many(organizationMembershipsTable, {
		relationName: "organization_memberships.creator_id:users.id",
	}),
	/**
	 * One to many relationship from `users` table to `organization_memberships` table.
	 */
	organizationMembershipsWhereMember: many(organizationMembershipsTable, {
		relationName: "organization_memberships.member_id:users.id",
	}),
	/**
	 * One to many relationship from `users` table to `organization_memberships` table.
	 */
	organizationMembershipsWhereUpdater: many(organizationMembershipsTable, {
		relationName: "organization_memberships.updater_id:users.id",
	}),
	/**
	 * One to many relationship from `users` table to `fund_campaign_pledges` table.
	 */
	fundCampaignPledgesWhereCreator: many(fundCampaignPledgesTable, {
		relationName: "fund_campaign_pledges.creator_id:users.id",
	}),
	/**
	 * One to many relationship from `users` table to `fund_campaign_pledges` table.
	 */
	fundCampaignPledgesWherePledger: many(fundCampaignPledgesTable, {
		relationName: "fund_campaign_pledges.pledger_id:users.id",
	}),
	/**
	 * One to many relationship from `users` table to `fund_campaign_pledges` table.
	 */
	fundCampaignPledgesWhereUpdater: many(fundCampaignPledgesTable, {
		relationName: "fund_campaign_pledges.updater_id:users.id",
	}),
	/**
	 * One to many relationship from `users` table to `posts` table.
	 */
	postsWhereCreator: many(postsTable, {
		relationName: "posts.creator_id:users.id",
	}),
	/**
	 * One to many relationship from `users` table to `posts` table.
	 */
	postsWhereUpdater: many(postsTable, {
		relationName: "posts.updater_id:users.id",
	}),
	/**
	 * One to many relationship from `users` table to `post_attachments` table.
	 */
	postAttachmentsWhereCreator: many(postAttachmentsTable, {
		relationName: "post_attachments.creator_id:users.id",
	}),
	/**
	 * One to many relationship from `users` table to `post_attachments` table.
	 */
	postAttachmentsWhereUpdater: many(postAttachmentsTable, {
		relationName: "post_attachments.updater_id:users.id",
	}),
	/**
	 * One to many relationship from `users` table to `post_votes` table.
	 */
	postVotesWhereCreator: many(postVotesTable, {
		relationName: "post_votes.creator_id:users.id",
	}),
	/**
	 * One to many relationship from `users` table to `tag_folders` table.
	 */
	tagFoldersWhereCreator: many(tagFoldersTable, {
		relationName: "tag_folders.creator_id:users.id",
	}),
	/**
	 * One to many relationship from `users` table to `tag_folders` table.
	 */
	tagFoldersWhereUpdater: many(tagFoldersTable, {
		relationName: "tag_folders.updater_id:users.id",
	}),
	/**
	 * One to many relationship from `users` table to `tags` table.
	 */
	tagsWhereCreator: many(tagsTable, {
		relationName: "tags.creator_id:users.id",
	}),
	/**
	 * One to many relationship from `users` table to `tags` table.
	 */
	tagsWhereUpdater: many(tagsTable, {
		relationName: "tags.updater_id:users.id",
	}),
	/**
	 * One to many relationship from `users` table to `tag_assignments` table.
	 */
	tagAssignmentsWhereAssignee: many(tagAssignmentsTable, {
		relationName: "tag_assignments.assignee_id:users.id",
	}),
	/**
	 * One to many relationship from `users` table to `tag_assignments` table.
	 */
	tagAssignmentsWhereCreator: many(tagAssignmentsTable, {
		relationName: "tag_assignments.creator_id:users.id",
	}),
	/**
	 * Many to one relationship from `users` table to `users` table.
	 */
	updater: one(usersTable, {
		fields: [usersTable.updaterId],
		references: [usersTable.id],
		relationName: "users.id:users.updater_id",
	}),
	/**
	 * One to many relationship from `users` table to `venues` table.
	 */
	venuesWhereCreator: many(venuesTable, {
		relationName: "users.id:venues.creator_id",
	}),
	/**
	 * One to many relationship from `users` table to `venues` table.
	 */
	venuesWhereUpdater: many(venuesTable, {
		relationName: "users.id:venues.updater_id",
	}),
	/**
	 * One to many relationship from `users` table to `venue_attachments` table.
	 */
	venueAttachmentsWhereCreator: many(venueAttachmentsTable, {
		relationName: "users.id:venue_attachments.creator_id",
	}),
	/**
	 * One to many relationship from `users` table to `venue_attachments` table.
	 */
	venueAttachmentsWhereUpdater: many(venueAttachmentsTable, {
		relationName: "users.id:venue_attachments.updater_id",
	}),
	/**
	 * One to many relationship from `users` table to `venue_bookings` table.
	 */
	venueBookingsWhereCreator: many(venueBookingsTable, {
		relationName: "users.id:venue_bookings.creator_id",
	}),
	/**
	 * One to many relationship from `users` table to `volunteer_groups` table.
	 */
	volunteerGroupsWhereCreator: many(volunteerGroupsTable, {
		relationName: "users.id:volunteer_groups.creator_id",
	}),
	/**
	 * One to many relationship from `users` table to `volunteer_groups` table.
	 */
	volunteerGroupsWhereLeader: many(volunteerGroupsTable, {
		relationName: "users.id:volunteer_groups.leader_id",
	}),
	/**
	 * One to many relationship from `users` table to `volunteer_groups` table.
	 */
	volunteerGroupsWhereUpdater: many(volunteerGroupsTable, {
		relationName: "users.id:volunteer_groups.updater_id",
	}),
	/**
	 * One to many relationship from `users` table to `volunteer_group_assignments` table.
	 */
	volunteerGroupAssignmentsWhereAssignee: many(volunteerGroupAssignmentsTable, {
		relationName: "users.id:volunteer_group_assignments.assignee_id",
	}),
	/**
	 * One to many relationship from `users` table to `volunteer_group_assignments` table.
	 */
	volunteerGroupAssignmentsWhereCreator: many(volunteerGroupAssignmentsTable, {
		relationName: "users.id:volunteer_group_assignments.creator_id",
	}),
	/**
	 * One to many relationship from `users` table to `volunteer_group_assignments` table.
	 */
	volunteerGroupAssignmentsWhereUpdater: many(volunteerGroupAssignmentsTable, {
		relationName: "users.id:volunteer_group_assignments.updater_id",
	}),
}));

export const usersTableInsertSchema = createInsertSchema(usersTable, {
	addressLine1: (schema) => schema.min(1).max(1024).optional(),
	addressLine2: (schema) => schema.min(1).max(1024).optional(),
	avatarName: (schema) => schema.min(1).optional(),
	city: (schema) => schema.min(1).max(64).optional(),
	description: (schema) => schema.min(1).max(2048).optional(),
	emailAddress: (schema) => schema.email(),
	name: (schema) => schema.min(1).max(256),
	postalCode: (schema) => schema.min(1).max(32).optional(),
	state: (schema) => schema.min(1).max(64).optional(),
});
