import { relations, sql } from "drizzle-orm";
import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { uuidv7 } from "uuidv7";
import { iso3166Alpha2CountryCodeEnum } from "~/src/drizzle/enums/iso3166Alpha2CountryCode";
import { actionCategoriesTable } from "./actionCategories";
import { actionsTable } from "./actions";
import { advertisementsTable } from "./advertisements";
import { familiesTable } from "./families";
import { fundsTable } from "./funds";
import { organizationMembershipsTable } from "./organizationMemberships";
import { postsTable } from "./posts";
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
		 * Foreign key reference to the id of the user who first created the user.
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
		 * Many to one relationship from `organizations` table to `users` table.
		 */
		creator: one(usersTable, {
			fields: [organizationsTable.creatorId],
			references: [usersTable.id],
			relationName: "organizations.creator_id:users.id",
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
		organizationMembershipsWhereOrganization: many(
			organizationMembershipsTable,
			{
				relationName:
					"organization_memberships.organization_id:organizations.id",
			},
		),
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
		address: (schema) => schema.address.min(1).max(1024),
		avatarURI: (schema) => schema.avatarURI.min(1),
		city: (schema) => schema.city.min(1).max(64),
		description: (schema) => schema.description.min(1).max(2048),
		name: (schema) => schema.name.min(1).max(256),
		postalCode: (schema) => schema.postalCode.min(1).max(32),
		state: (schema) => schema.state.min(1).max(64),
	},
);
