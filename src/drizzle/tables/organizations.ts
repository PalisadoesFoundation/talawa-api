import { relations } from "drizzle-orm";
import {
	boolean,
	index,
	pgTable,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";
import { uuidv7 } from "uuidv7";
import { iso3166Alpha2CountryCodeEnum } from "~/src/drizzle/enums/iso3166Alpha2CountryCode";
import { actionCategoriesTable } from "./actionCategories";
import { actionsTable } from "./actions";
import { advertisementsTable } from "./advertisements";
import { familiesTable } from "./families";
import { fundsTable } from "./funds";
import { organizationMembershipsTable } from "./organizationMemberships";
import { postsTable } from "./posts";
import { tagFoldersTable } from "./tagFolders";
import { tagsTable } from "./tags";
import { usersTable } from "./users";
import { venuesTable } from "./venues";

export const organizationsTable = pgTable(
	"organizations",
	{
		/**
		 * Address of the organization.
		 */
		address: text("address"),
		/**
		 * URI to the avatar of the organization.
		 */
		avatarURI: text("avatar_uri"),
		/**
		 * Name of the city where organization exists in.
		 */
		city: text("city"),
		/**
		 * Country code of the country the organization exists in.
		 */
		countryCode: iso3166Alpha2CountryCodeEnum("country_code"),
		/**
		 * Datetime at the time the organization was created.
		 */
		createdAt: timestamp("created_at", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		})
			.notNull()
			.defaultNow(),
		/**
		 * Foreign key reference to the id of the user who first created the user.
		 */
		creatorId: uuid("creator_id")
			.references(() => usersTable.id, {})
			.notNull(),
		/**
		 * Custom information about the organization.
		 */
		description: text("description"),
		/**
		 * Primary unique identifier of the organization.
		 */
		id: uuid("id").primaryKey().$default(uuidv7),
		/**
		 * Boolean field to tell whether the organization requires manual verification for membership.
		 */
		isPrivate: boolean("is_private").notNull(),
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
		 * Datetime at the time the organization was last updated.
		 */
		updatedAt: timestamp("updated_at", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		}),
		/**
		 * Foreign key reference to the id of the user who last updated the organization.
		 */
		updaterId: uuid("updater_id").references(() => usersTable.id),
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
		actionsWhereOrganization: many(actionsTable, {
			relationName: "actions.organization_id:organizations.id",
		}),
		actionCategoriesWhereOrganization: many(actionCategoriesTable, {
			relationName: "action_categories.organization_id:organizations.id",
		}),

		advertisementsWhereOrganization: many(advertisementsTable, {
			relationName: "advertisements.organization_id:organizations.id",
		}),

		creator: one(usersTable, {
			fields: [organizationsTable.creatorId],
			references: [usersTable.id],
			relationName: "organizations.creator_id:users.id",
		}),

		familiesWhereOrganization: many(familiesTable, {
			relationName: "families.organization_id:organizations.id",
		}),

		fundsWhereOrganization: many(fundsTable, {
			relationName: "funds.organization_id:organizations.id",
		}),

		organizationMembershipsWhereOrganization: many(
			organizationMembershipsTable,
			{
				relationName:
					"organization_memberships.organization_id:organizations.id",
			},
		),

		postsWhereOrganization: many(postsTable, {
			relationName: "organizations.id:posts.organization_id",
		}),

		tagFoldersWhereOrganization: many(tagFoldersTable, {
			relationName: "organizations.id:tag_folders.organization_id",
		}),

		tagsWhereOrganization: many(tagsTable, {
			relationName: "organizations.id:tags.organization_id",
		}),

		updater: one(usersTable, {
			fields: [organizationsTable.updaterId],
			references: [usersTable.id],
			relationName: "organizations.updater_id:users.id",
		}),

		venuesWhereOrganization: many(venuesTable, {
			relationName: "organizations.id:venues.organization_id",
		}),
	}),
);
