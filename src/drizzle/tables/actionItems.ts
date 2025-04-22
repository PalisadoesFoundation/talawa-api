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
import { createInsertSchema } from "drizzle-zod";
import { uuidv7 } from "uuidv7";
import { actionItemCategoriesTable } from "./actionItemCategories";
import { eventsTable } from "./events";
import { organizationsTable } from "./organizations";
import { usersTable } from "./users";

export const actionItemsTable = pgTable(
	"actions",
	{
		assignedAt: timestamp("assigned_at", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		}).notNull(),

		assigneeId: uuid("assignee_id").references(() => usersTable.id, {
			onDelete: "set null",
			onUpdate: "cascade",
		}),

		categoryId: uuid("category_id").references(
			() => actionItemCategoriesTable.id,
			{
				onDelete: "set null",
				onUpdate: "cascade",
			},
		),

		completionAt: timestamp("completion_at", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		}),

		createdAt: timestamp("created_at", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		})
			.notNull()
			.defaultNow(),

		creatorId: uuid("creator_id").references(() => usersTable.id, {
			onDelete: "set null",
			onUpdate: "cascade",
		}),

		eventId: uuid("event_id").references(() => eventsTable.id, {
			onDelete: "set null",
			onUpdate: "cascade",
		}),

		id: uuid("id").primaryKey().$default(uuidv7),

		isCompleted: boolean("is_completed").notNull(),

		allottedHours: numeric("allotted_hours"),

		organizationId: uuid("organization_id")
			.notNull()
			.references(() => organizationsTable.id, {
				onDelete: "cascade",
				onUpdate: "cascade",
			}),

		postCompletionNotes: text("post_completion_notes"),
		preCompletionNotes: text("pre_completion_notes"),

		updatedAt: timestamp("updated_at", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		})
			.$defaultFn(() => sql`${null}`)
			.$onUpdate(() => new Date()),

		updaterId: uuid("updater_id").references(() => usersTable.id, {
			onDelete: "set null",
			onUpdate: "cascade",
		}),
	},
	(self) => [
		index().on(self.assignedAt),
		index().on(self.assigneeId),
		index().on(self.categoryId),
		index().on(self.completionAt),
		index().on(self.createdAt),
		index().on(self.creatorId),
		index().on(self.organizationId),
	],
);

export const actionsItemRelations = relations(actionItemsTable, ({ one }) => ({
	assignee: one(usersTable, {
		fields: [actionItemsTable.assigneeId],
		references: [usersTable.id],
		relationName: "actions.assignee_id:users.id",
	}),
	category: one(actionItemCategoriesTable, {
		fields: [actionItemsTable.categoryId],
		references: [actionItemCategoriesTable.id],
		relationName: "action_categories.id:actions.category_id",
	}),
	creator: one(usersTable, {
		fields: [actionItemsTable.creatorId],
		references: [usersTable.id],
		relationName: "actions.creator_id:users.id",
	}),
	event: one(eventsTable, {
		fields: [actionItemsTable.eventId],
		references: [eventsTable.id],
		relationName: "actions.event_id:events.id",
	}),
	organization: one(organizationsTable, {
		fields: [actionItemsTable.organizationId],
		references: [organizationsTable.id],
		relationName: "actions.organization_id:organizations.id",
	}),
	updater: one(usersTable, {
		fields: [actionItemsTable.updaterId],
		references: [usersTable.id],
		relationName: "actions.updater_id:users.id",
	}),
}));

// ✅ Export the insert schema with the new field included
export const actionsTableInsertSchema = createInsertSchema(actionItemsTable);
