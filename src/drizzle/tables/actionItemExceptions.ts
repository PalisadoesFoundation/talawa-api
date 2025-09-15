import { relations } from "drizzle-orm";
import {
	boolean,
	pgTable,
	text,
	timestamp,
	unique,
	uuid,
} from "drizzle-orm/pg-core";
import { actionItemCategoriesTable } from "./actionItemCategories";
import { actionItemsTable } from "./actionItems";
import { recurringEventInstancesTable } from "./recurringEventInstances";
import { usersTable } from "./users";

export const actionItemExceptionsTable = pgTable(
	"actionitem_exceptions",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		actionId: uuid("action_id")
			.notNull()
			.references(() => actionItemsTable.id),
		eventId: uuid("event_id")
			.notNull()
			.references(() => recurringEventInstancesTable.id),
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
		assignedAt: timestamp("assigned_at", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		}),
		preCompletionNotes: text("pre_completion_notes"),
		postCompletionNotes: text("post_completion_notes"),
		completed: boolean("completed").default(false),
		deleted: boolean("deleted").default(false),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at").defaultNow().notNull(),
	},
	(table) => {
		return {
			unq: unique().on(table.actionId, table.eventId),
		};
	},
);

export const actionItemExceptionsTableRelations = relations(
	actionItemExceptionsTable,
	({ one }) => ({
		action: one(actionItemsTable, {
			fields: [actionItemExceptionsTable.actionId],
			references: [actionItemsTable.id],
		}),
		event: one(recurringEventInstancesTable, {
			fields: [actionItemExceptionsTable.eventId],
			references: [recurringEventInstancesTable.id],
		}),
		assignee: one(usersTable, {
			fields: [actionItemExceptionsTable.assigneeId],
			references: [usersTable.id],
		}),
		category: one(actionItemCategoriesTable, {
			fields: [actionItemExceptionsTable.categoryId],
			references: [actionItemCategoriesTable.id],
		}),
	}),
);
