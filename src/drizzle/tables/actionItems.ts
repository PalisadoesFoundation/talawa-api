// Import Drizzle ORM utilities for table and field definitions
import { relations, sql } from "drizzle-orm";
import {
	boolean,
	index,
	numeric,
	pgTable,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";

// Import for generating Zod schema from Drizzle schema
import { createInsertSchema } from "drizzle-zod";

// UUIDv7 for time-sortable primary keys
import { uuidv7 } from "uuidv7";

// Import referenced tables for relationships
import { actionItemCategoriesTable } from "./actionItemCategories";
import { eventsTable } from "./events";
import { organizationsTable } from "./organizations";
import { usersTable } from "./users";

/**
 * PostgreSQL table definition for "actions" (i.e., action items).
 * Stores all details related to tasks assigned to users within an organization.
 */
export const actionItemsTable = pgTable(
	"actions",
	{
		/**
		 * Timestamp indicating when the task was assigned.
		 */
		assignedAt: timestamp("assigned_at", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		}).notNull(),

		/**
		 * Foreign key to the user assigned this task.
		 * Nullable in case the assignee is removed.
		 */
		assigneeId: uuid("actor_id").references(() => usersTable.id, {
			onDelete: "set null",
			onUpdate: "cascade",
		}),

		/**
		 * Foreign key to the action item category.
		 * Helps in organizing action items by type.
		 */
		actionItemCategoryId: uuid("category_id").references(
			() => actionItemCategoriesTable.id,
			{
				onDelete: "set null",
				onUpdate: "cascade",
			},
		),

		/**
		 * Timestamp when the task was completed (if completed).
		 */
		completionAt: timestamp("completion_at", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		}),

		/**
		 * Timestamp when the action item was created.
		 */
		createdAt: timestamp("created_at", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		})
			.notNull()
			.defaultNow(),

		/**
		 * Foreign key to the user who created the action item.
		 */
		creatorId: uuid("creator_id").references(() => usersTable.id, {
			onDelete: "set null",
			onUpdate: "cascade",
		}),

		/**
		 * Optional foreign key to the event this action item is linked to.
		 */
		eventId: uuid("event_id").references(() => eventsTable.id, {
			onDelete: "set null",
			onUpdate: "cascade",
		}),

		/**
		 * Primary key ID of the action item, generated using uuidv7.
		 */
		id: uuid("id").primaryKey().$default(uuidv7),

		/**
		 * Boolean indicating whether the task is completed or not.
		 */
		isCompleted: boolean("is_completed").notNull(),

		/**
		 * Estimated or allocated hours for this task.
		 */
		allottedHours: numeric("allotted_hours"),

		/**
		 * Foreign key to the organization that owns this task.
		 * Cannot be null; used for scoping data per organization.
		 */
		organizationId: uuid("organization_id")
			.notNull()
			.references(() => organizationsTable.id, {
				onDelete: "cascade",
				onUpdate: "cascade",
			}),

		/**
		 * Optional text field for post-completion notes.
		 */
		postCompletionNotes: text("post_completion_notes"),

		/**
		 * Optional text field for pre-completion notes.
		 */
		preCompletionNotes: text("pre_completion_notes"),

		/**
		 * Timestamp of the last update to the action item.
		 * Defaults to null, updated automatically on any change.
		 */
		updatedAt: timestamp("updated_at", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		})
			.$defaultFn(() => sql`${null}`)
			.$onUpdate(() => new Date()),

		/**
		 * Foreign key to the user who last updated the action item.
		 */
		updaterId: uuid("updater_id").references(() => usersTable.id, {
			onDelete: "set null",
			onUpdate: "cascade",
		}),
	},
	(self) => [
		// Adding indexes to optimize querying by commonly filtered fields
		index().on(self.assignedAt),
		index().on(self.assigneeId),
		index().on(self.actionItemCategoryId),
		index().on(self.completionAt),
		index().on(self.createdAt),
		index().on(self.creatorId),
		index().on(self.organizationId),
	],
);

/**
 * Defines one-to-many relationships from actionItemsTable
 * to other tables using Drizzle's relations API.
 */
export const actionsItemRelations = relations(actionItemsTable, ({ one }) => ({
	/**
	 * Relation to the assignee (user assigned the task).
	 */
	assignee: one(usersTable, {
		fields: [actionItemsTable.assigneeId],
		references: [usersTable.id],
		relationName: "actions.assignee_id:users.id",
	}),
	/**
	 * Relation to the action item category.
	 */
	category: one(actionItemCategoriesTable, {
		fields: [actionItemsTable.actionItemCategoryId],
		references: [actionItemCategoriesTable.id],
		relationName: "action_categories.id:actions.category_id",
	}),
	/**
	 * Relation to the user who created the action item.
	 */
	creator: one(usersTable, {
		fields: [actionItemsTable.creatorId],
		references: [usersTable.id],
		relationName: "actions.creator_id:users.id",
	}),
	/**
	 * Relation to the linked event (if any).
	 */
	event: one(eventsTable, {
		fields: [actionItemsTable.eventId],
		references: [eventsTable.id],
		relationName: "actions.event_id:events.id",
	}),
	/**
	 * Relation to the organization that owns the action item.
	 */
	organization: one(organizationsTable, {
		fields: [actionItemsTable.organizationId],
		references: [organizationsTable.id],
		relationName: "actions.organization_id:organizations.id",
	}),
	/**
	 * Relation to the user who last updated the item.
	 */
	updater: one(usersTable, {
		fields: [actionItemsTable.updaterId],
		references: [usersTable.id],
		relationName: "actions.updater_id:users.id",
	}),
}));

/**
 * Zod validation schema for inserting new records into actionItemsTable.
 * Auto-generated based on the table definition.
 */
export const actionsTableInsertSchema = createInsertSchema(actionItemsTable);
