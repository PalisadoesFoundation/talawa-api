import { type InferSelectModel, relations } from "drizzle-orm";
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
import {
	iso3166Alpha2CountryCodeEnum,
	userEducationGradeEnum,
	userEmploymentStatusEnum,
	userMaritalStatusEnum,
	userNatalSexEnum,
} from "~/src/drizzle/enums";
import { actionCategoriesTable } from "./actionCategories";
import { actionsTable } from "./actions";
import { advertisementAttachmentsTable } from "./advertisementAttachments";
import { advertisementsTable } from "./advertisements";
import { agendaSectionsTable } from "./agendaSections";
import { commentVotesTable } from "./commentVotes";
import { commentsTable } from "./comments";
import { eventAttachmentsTable } from "./eventAttachments";
import { eventsTable } from "./events";
import { familiesTable } from "./families";
import { familyMembershipsTable } from "./familyMemberships";
import { fundraisingCampaignsTable } from "./fundraisingCampaigns";
import { fundsTable } from "./funds";
import { organizationMembershipsTable } from "./organizationMemberships";
import { organizationsTable } from "./organizations";
import { pledgesTable } from "./pledges";
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

export const usersTable = pgTable(
	"user",
	{
		addressLine1: text("address_line_1"),

		addressLine2: text("address_line_2"),

		avatarURI: text("avatar_uri"),

		birthDate: date("birth_date", {
			mode: "date",
		}),

		city: text("city"),

		countryCode: text("country_code", {
			enum: iso3166Alpha2CountryCodeEnum.options,
		}),

		createdAt: timestamp("created_at", {
			mode: "date",
		})
			.notNull()
			.defaultNow(),

		creatorId: uuid("creator_id").references((): AnyPgColumn => usersTable.id),

		description: text("description"),

		educationGrade: text("education_grade", {
			enum: userEducationGradeEnum.options,
		}),

		state: text("state"),

		email: text("email").notNull().unique(),

		employmentStatus: text("employment_status", {
			enum: userEmploymentStatusEnum.options,
		}),

		firstName: text("first_name"),

		homePhoneNumber: text("home_phone_number"),

		id: uuid("id").notNull().primaryKey().defaultRandom(),

		isAdminstrator: boolean("is_administrator").notNull().default(false),

		isEmailVerified: boolean("is_email_verified").notNull().default(false),

		lastName: text("last_name"),

		maritalStatus: text("marital_status", {
			enum: userMaritalStatusEnum.options,
		}),

		mobilePhoneNumber: text("mobile_phone_number"),

		name: text("name").unique(),

		natalSex: text("natal_sex", {
			enum: userNatalSexEnum.options,
		}),

		passwordHash: text("password_hash"),

		postalCode: text("postal_code"),

		updatedAt: timestamp("updated_at", {
			mode: "date",
		}),

		updaterId: uuid("updater_id").references((): AnyPgColumn => usersTable.id),

		workPhoneNumber: text("work_phone_number"),
	},
	(self) => ({
		index0: index().on(self.createdAt),
		index1: index().on(self.name),
	}),
);

export type UserPgType = InferSelectModel<typeof usersTable>;

export const usersTableRelations = relations(usersTable, ({ many }) => ({
	actionsWhereAssignee: many(actionsTable, {
		relationName: "actions.assignee_id:users.id",
	}),

	actionsWhereCreator: many(actionsTable, {
		relationName: "actions.creator_id:users.id",
	}),

	actionsWhereUpdater: many(actionsTable, {
		relationName: "actions.updater_id:users.id",
	}),

	actionCategoriesWhereCreator: many(actionCategoriesTable, {
		relationName: "action_categories.creator_id:users.id",
	}),

	actionCategoriesWhereUpdater: many(actionCategoriesTable, {
		relationName: "action_categories.updater_id:users.id",
	}),

	advertisementAttachmentsWhereCreator: many(advertisementAttachmentsTable, {
		relationName: "advertisement_attachments.creator_id:users.id",
	}),

	advertisementAttachmentsWhereUpdater: many(advertisementAttachmentsTable, {
		relationName: "advertisement_attachments.updater_id:users.id",
	}),

	advertisementsWhereCreator: many(advertisementsTable, {
		relationName: "advertisements.creator_id:users.id",
	}),

	advertisementsWhereUpdater: many(advertisementsTable, {
		relationName: "advertisements.updater_id:users.id",
	}),

	agendaSectionsWhereCreator: many(agendaSectionsTable, {
		relationName: "agenda_sections.creator_id:users.id",
	}),

	agendaSectionsWhereUpdater: many(agendaSectionsTable, {
		relationName: "agenda_sections.updater_id:users.id",
	}),

	commentsWhereCommenter: many(commentsTable, {
		relationName: "comments.commenter_id:users.id",
	}),

	commentsWhereCreator: many(commentsTable, {
		relationName: "comments.creator_id:users.id",
	}),

	commentsWherePinner: many(commentsTable, {
		relationName: "comments.pinner_id:users.id",
	}),

	commentsWhereUpdater: many(commentsTable, {
		relationName: "comments.updater_id:users.id",
	}),

	commentVotesWhereCreator: many(commentVotesTable, {
		relationName: "comment_votes.creator_id:users.id",
	}),

	commentVotesWhereUpdater: many(commentVotesTable, {
		relationName: "comment_votes.updater_id:users.id",
	}),

	commentVotesWhereVoter: many(commentVotesTable, {
		relationName: "comment_votes.voter_id:users.id",
	}),

	eventsWhereCreator: many(eventsTable, {
		relationName: "events.creator_id:users.id",
	}),

	eventsWhereUpdater: many(eventsTable, {
		relationName: "events.updater_id:users.id",
	}),

	eventAttachmentsWhereCreator: many(eventAttachmentsTable, {
		relationName: "event_attachments.creator_id:users.id",
	}),

	eventAttachmentsWhereUpdater: many(eventAttachmentsTable, {
		relationName: "event_attachments.updater_id:users.id",
	}),

	familiesWhereCreator: many(familiesTable, {
		relationName: "families.creator_id:users.id",
	}),

	familiesWhereUpdater: many(familiesTable, {
		relationName: "families.updater_id:users.id",
	}),

	familyMembershipsWhereCreator: many(familyMembershipsTable, {
		relationName: "family_memberships.creator_id:users.id",
	}),

	familyMembershipsWhereMember: many(familyMembershipsTable, {
		relationName: "family_memberships.member_id:users.id",
	}),

	familyMembershipsWhereUpdater: many(familyMembershipsTable, {
		relationName: "family_memberships.updater_id:users.id",
	}),

	fundraisingCampaignsWhereCreator: many(fundraisingCampaignsTable, {
		relationName: "fundraising_campaigns.creator_id:users.id",
	}),

	fundraisingCampaignsWhereUpdater: many(fundraisingCampaignsTable, {
		relationName: "fundraising_campaigns.updater_id:users.id",
	}),

	fundsWhereCreator: many(fundsTable, {
		relationName: "funds.creator_id:users.id",
	}),

	fundsWhereUpdater: many(fundsTable, {
		relationName: "funds.updater_id:users.id",
	}),

	organizationsWhereCreator: many(organizationsTable, {
		relationName: "organizations.creator_id:users.id",
	}),

	organizationsWhereUpdater: many(organizationsTable, {
		relationName: "organizations.updater_id:users.id",
	}),

	organizationMembershipsWhereCreator: many(organizationMembershipsTable, {
		relationName: "organization_memberships.creator_id:users.id",
	}),

	organizationMembershipsWhereMember: many(organizationMembershipsTable, {
		relationName: "organization_memberships.member_id:users.id",
	}),

	organizationMembershipsWhereUpdator: many(organizationMembershipsTable, {
		relationName: "organization_memberships.updater_id:users.id",
	}),

	pledgesWhereCreator: many(pledgesTable, {
		relationName: "pledges.creator_id:users.id",
	}),

	pledgesWherePledger: many(pledgesTable, {
		relationName: "pledges.pledger_id:users.id",
	}),

	pledgesWhereUpdater: many(pledgesTable, {
		relationName: "pledges.updater_id:users.id",
	}),

	postsWhereCreator: many(postsTable, {
		relationName: "posts.creator_id:users.id",
	}),

	postsWherePinner: many(postsTable, {
		relationName: "posts.pinner_id:users.id",
	}),

	postsWherePoster: many(postsTable, {
		relationName: "posts.poster_id:users.id",
	}),

	postsWhereUpdater: many(postsTable, {
		relationName: "posts.updater_id:users.id",
	}),

	postAttachmentsWhereCreator: many(postAttachmentsTable, {
		relationName: "post_attachments.creator_id:users.id",
	}),

	postAttachmentsWhereUpdater: many(postAttachmentsTable, {
		relationName: "post_attachments.updater_id:users.id",
	}),

	postVotesWhereCreator: many(postVotesTable, {
		relationName: "post_votes.creator_id:users.id",
	}),

	postVotesWhereUpdater: many(postVotesTable, {
		relationName: "post_votes.updater_id:users.id",
	}),

	postVotesWhereVoter: many(postVotesTable, {
		relationName: "post_votes.voter_id:users.id",
	}),

	tagsWhereCreator: many(tagsTable, {
		relationName: "tags.creator_id:users.id",
	}),

	tagsWhereUpdater: many(tagsTable, {
		relationName: "tags.updater_id:users.id",
	}),

	tagAssignmentsWhereAssignee: many(tagAssignmentsTable, {
		relationName: "tag_assignments.assignee_id:users.id",
	}),

	tagAssignmentsWhereCreator: many(tagAssignmentsTable, {
		relationName: "tag_assignments.creator_id:users.id",
	}),

	tagAssignmentsWhereUpdater: many(tagAssignmentsTable, {
		relationName: "tag_assignments.updater_id:users.id",
	}),

	tagFoldersWhereCreator: many(tagFoldersTable, {
		relationName: "tag_folders.creator_id:users.id",
	}),

	tagFoldersWhereUpdater: many(tagFoldersTable, {
		relationName: "tag_folders.updater_id:users.id",
	}),

	venuesWhereCreator: many(venuesTable, {
		relationName: "users.id:venues.creator_id",
	}),

	venuesWhereUpdater: many(venuesTable, {
		relationName: "users.id:venues.updater_id",
	}),

	venueAttachmentsWhereCreator: many(venueAttachmentsTable, {
		relationName: "users.id:venue_attachments.creator_id",
	}),

	venueAttachmentsWhereUpdater: many(venueAttachmentsTable, {
		relationName: "users.id:venue_attachments.updater_id",
	}),

	venueBookingsWhereCreator: many(venueBookingsTable, {
		relationName: "users.id:venue_bookings.creator_id",
	}),

	venueBookingsWhereUpdater: many(venueBookingsTable, {
		relationName: "users.id:venue_bookings.updater_id",
	}),

	volunteerGroupsWhereCreator: many(volunteerGroupsTable, {
		relationName: "users.id:volunteer_groups.creator_id",
	}),

	volunteerGroupsWhereLeader: many(volunteerGroupsTable, {
		relationName: "users.id:volunteer_groups.leader_id",
	}),

	volunteerGroupsWhereUpdater: many(volunteerGroupsTable, {
		relationName: "users.id:volunteer_groups.updater_id",
	}),

	volunteerGroupAssignmentsWhereAssignee: many(volunteerGroupAssignmentsTable, {
		relationName: "users.id:volunteer_group_assignments.assignee_id",
	}),

	volunteerGroupAssignmentsWhereCreator: many(volunteerGroupAssignmentsTable, {
		relationName: "users.id:volunteer_group_assignments.creator_id",
	}),

	volunteerGroupAssignmentsWhereUpdater: many(volunteerGroupAssignmentsTable, {
		relationName: "users.id:volunteer_group_assignments.updater_id",
	}),
}));
