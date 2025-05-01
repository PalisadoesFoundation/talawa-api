// Import required Drizzle ORM utilities and types
import { relations, sql } from "drizzle-orm";
import {
	boolean,
	index,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
	uuid,
} from "drizzle-orm/pg-core";

// UUIDv7 for time-sortable and unique primary keys
import { uuidv7 } from "uuidv7";

// Import related tables for defining foreign key relationships
import { actionItemsTable } from "./actionItems";
import { organizationsTable } from "./organizations";
import { usersTable } from "./users";

/**
 * PostgreSQL table definition for "action_categories".
 * Represents various categories that action items can be grouped under.
 */
export const actionItemCategoriesTable = pgTable(
	"action_categories",
	{
		/**
		 * Timestamp of when the category was created.
		 */
		createdAt: timestamp("created_at", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		})
			.notNull()
			.defaultNow(),

		/**
		 * Foreign key to the user who created the category.
		 */
		creatorId: uuid("creator_id").references(() => usersTable.id, {
			onDelete: "set null",
			onUpdate: "cascade",
		}),

		/**
		 * Optional textual description of the category.
		 */
		description: text("description"),

		/**
		 * Primary key UUID, generated using uuidv7.
		 */
		id: uuid("id").primaryKey().$default(uuidv7),

		/**
		 * Boolean flag to indicate if the category is currently disabled.
		 */
		isDisabled: boolean("is_disabled").notNull(),

		/**
		 * Name of the category. Required.
		 */
		name: text("name", {}).notNull(),

		/**
		 * Foreign key to the organization the category belongs to.
		 */
		organizationId: uuid("organization_id")
			.notNull()
			.references(() => organizationsTable.id, {
				onDelete: "cascade",
				onUpdate: "cascade",
			}),

		/**
		 * Timestamp of the last update to the category.
		 */
		updatedAt: timestamp("updated_at", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		})
			.$defaultFn(() => sql`${null}`)
			.$onUpdate(() => new Date()),

		/**
		 * Foreign key to the user who last updated the category.
		 */
		updaterId: uuid("updater_id").references(() => usersTable.id, {
			onDelete: "set null",
			onUpdate: "cascade",
		}),
	},
	(self) => [
		// Indexes to optimize lookups
		index().on(self.createdAt),
		index().on(self.creatorId),
		index().on(self.name),

		// Enforce unique name within each organization
		uniqueIndex().on(self.name, self.organizationId),
	],
);

/**
 * Defines relationships for actionItemCategoriesTable.
 */
export const actionItemCategoriesRelations = relations(
	actionItemCategoriesTable,
	({ many, one }) => ({
		/**
		 * One-to-many relationship:
		 * Fetches all action items associated with a specific category.
		 */
		actionsWhereCategory: many(actionItemsTable, {
			relationName: "action_categories.id:actions.category_id",
		}),

		/**
		 * Many-to-one relationship to the user who created the category.
		 */
		creator: one(usersTable, {
			fields: [actionItemCategoriesTable.creatorId],
			references: [usersTable.id],
			relationName: "action_categories.creator_id:users.id",
		}),

		/**
		 * Many-to-one relationship to the owning organization.
		 */
		organization: one(organizationsTable, {
			fields: [actionItemCategoriesTable.organizationId],
			references: [organizationsTable.id],
			relationName: "action_categories.organization_id:organizations.id",
		}),

		/**
		 * Many-to-one relationship to the user who last updated the category.
		 */
		updater: one(usersTable, {
			fields: [actionItemCategoriesTable.updaterId],
			references: [usersTable.id],
			relationName: "action_categories.updater_id:users.id",
		}),
	}),
);
