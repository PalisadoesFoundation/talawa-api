import { relations, sql } from "drizzle-orm";
import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { uuidv7 } from "uuidv7";
import { imageMimeTypeEnum } from "~/src/drizzle/enums/imageMimeType";
import { iso3166Alpha2CountryCodeEnum } from "~/src/drizzle/enums/iso3166Alpha2CountryCode";
import { actionCategoriesTable } from "./actionCategories";
import { actionsTable } from "./actions";
import { advertisementsTable } from "./advertisements";
import { chatsTable } from "./chats";
import { eventsTable } from "./events";
import { familiesTable } from "./families";
import { fundsTable } from "./funds";
import { organizationMembershipsTable } from "./organizationMemberships";
import { postsTable } from "./posts";
import { tagFoldersTable } from "./tagFolders";
import { tagsTable } from "./tags";
import { usersTable } from "./users";
import { venuesTable } from "./venues";

/**
 * Drizzle orm postgres table definition for organizations.
 */
export const organizationsTable = pgTable(
	"organizations",
	{
		/**
		 * Address line 1 of the organization's address.
		 */
		addressLine1: text("address_line_1"),
		/**
		 * Address line 2 of the organization's address.
		 */
		addressLine2: text("address_line_2"),
		/**
		 * Mime type of the avatar of the organization.
		 */
		avatarMimeType: text("avatar_mime_type", {
			enum: imageMimeTypeEnum.options,
		}),
		/**
		 * Primary unique identifier of the organziation's avatar.
		 */
		avatarName: text("avatar_name"),
		/**
		 * Name of the city where organization exists in.
		 */
		city: text("city"),
		/**
		 * Country code of the country the organization exists in.
		 */
		countryCode: text("country_code", {
			enum: iso3166Alpha2CountryCodeEnum.options,
		}),
		/**
		 * Date time at the time the organization was created.
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
		creatorId: uuid("creator_id").references(() => usersTable.id, {
			onDelete: "set null",
			onUpdate: "cascade",
		}),
		/**
		 * Custom information about the organization.
		 */
		description: text("description"),
		/**
		 * Primary unique identifier of the organization.
		 */
		id: uuid("id").primaryKey().$default(uuidv7),
		/**
		 * Name of the organization.
		 */
		name: text("name", {}).notNull().unique(),
		/**
		 * Postal code of the organization.
		 */
		postalCode: text("postal_code"),
		/**
		 * Name of the state the organization exists in within its country.
		 */
		state: text("state"),
		/**
		 * Date time at the time the organization was last updated.
		 */
		updatedAt: timestamp("updated_at", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		})
			.$defaultFn(() => sql`${null}`)
			.$onUpdate(() => new Date()),
		/**
		 * Foreign key reference to the id of the user who last updated the organization.
		 */
		updaterId: uuid("updater_id").references(() => usersTable.id, {
			onDelete: "set null",
			onUpdate: "cascade",
		}),
	},
	(self) => [
		index().on(self.creatorId),
		index().on(self.name),
		index().on(self.updaterId),
	],
);

export const organizationsTableRelations = relations(
	organizationsTable,
	({ one, many }) => ({
		/**
		 * One to many relationship from `organizations` table to `actions` table.
		 */
		actionsWhereOrganization: many(actionsTable, {
			relationName: "actions.organization_id:organizations.id",
		}),
		/**
		 * One to many relationship from `organizations` table to `action_categories` table.
		 */
		actionCategoriesWhereOrganization: many(actionCategoriesTable, {
			relationName: "action_categories.organization_id:organizations.id",
		}),
		/**
		 * One to many relationship from `organizations` table to `advertisements` table.
		 */
		advertisementsWhereOrganization: many(advertisementsTable, {
			relationName: "advertisements.organization_id:organizations.id",
		}),
		/**
		 * One to many relationship from `organizations` table to `chats` table.
		 */
		chatsWhereOrganization: many(chatsTable, {
			relationName: "chats.organization_id:organizations.id",
		}),
		/**
		 * Many to one relationship from `organizations` table to `users` table.
		 */
		creator: one(usersTable, {
			fields: [organizationsTable.creatorId],
			references: [usersTable.id],
			relationName: "organizations.creator_id:users.id",
		}),
		/**
		 * One to many relationship from `organizations` table to `events` table.
		 */
		eventsWhereOrganization: many(eventsTable, {
			relationName: "events.organization_id:organizations.id",
		}),
		/**
		 * One to many relationship from `organizations` table to `families` table.
		 */
		familiesWhereOrganization: many(familiesTable, {
			relationName: "families.organization_id:organizations.id",
		}),
		/**
		 * One to many relationship from `organizations` table to `funds` table.
		 */
		fundsWhereOrganization: many(fundsTable, {
			relationName: "funds.organization_id:organizations.id",
		}),
		/**
		 * One to many relationship from `organizations` table to `organization_memberships` table.
		 */
		membershipsWhereOrganization: many(organizationMembershipsTable, {
			relationName: "organization_memberships.organization_id:organizations.id",
		}),
		/**
		 * One to many relationship from `organizations` table to `posts` table.
		 */
		postsWhereOrganization: many(postsTable, {
			relationName: "organizations.id:posts.organization_id",
		}),
		/**
		 * One to many relationship from `organizations` table to `tags` table.
		 */
		tagsWhereOrganization: many(tagsTable, {
			relationName: "organizations.id:tags.organization_id",
		}),
		/**
		 * One to many relationship from `organizations` table to `tag_folders` table.
		 */
		tagFoldersWhereOrganization: many(tagFoldersTable, {
			relationName: "organizations.id:tag_folders.organization_id",
		}),
		/**
		 * Many to one relationship from `organizations` table to `users` table.
		 */
		updater: one(usersTable, {
			fields: [organizationsTable.updaterId],
			references: [usersTable.id],
			relationName: "organizations.updater_id:users.id",
		}),
		/**
		 * One to many relationship from `organizations` table to `venues` table.
		 */
		venuesWhereOrganization: many(venuesTable, {
			relationName: "organizations.id:venues.organization_id",
		}),
	}),
);

export const organizationsTableInsertSchema = createInsertSchema(
	organizationsTable,
	{
		addressLine1: (schema) => schema.min(1).max(1024).optional(),
		addressLine2: (schema) => schema.min(1).max(1024).optional(),
		avatarName: (schema) => schema.min(1).optional(),
		city: (schema) => schema.min(1).max(64).optional(),
		description: (schema) => schema.min(1).max(2048).optional(),
		name: (schema) => schema.min(1).max(256),
		postalCode: (schema) => schema.min(1).max(32).optional(),
		state: (schema) => schema.min(1).max(64).optional(),
	},
);
