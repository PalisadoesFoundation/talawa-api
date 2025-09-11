import { relations } from "drizzle-orm";
import {
	boolean,
	pgTable,
	text,
	timestamp,
	unique,
	uuid,
} from "drizzle-orm/pg-core";
import { actionCategoriesTable } from "./actionCategories";
import { actionsTable } from "./actions";
import { recurringEventInstancesTable } from "./recurringEventInstances";
import { usersTable } from "./users";

export const actionExceptionsTable = pgTable(
	"action_exceptions",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		actionId: uuid("action_id")
			.notNull()
			.references(() => actionsTable.id),
		eventId: uuid("event_id")
			.notNull()
			.references(() => recurringEventInstancesTable.id),
		assigneeId: uuid("assignee_id").references(() => usersTable.id, {
			onDelete: "set null",
			onUpdate: "cascade",
		}),
		categoryId: uuid("category_id").references(() => actionCategoriesTable.id, {
			onDelete: "set null",
			onUpdate: "cascade",
		}),
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

export const actionExceptionsTableRelations = relations(
	actionExceptionsTable,
	({ one }) => ({
		action: one(actionsTable, {
			fields: [actionExceptionsTable.actionId],
			references: [actionsTable.id],
		}),
		event: one(recurringEventInstancesTable, {
			fields: [actionExceptionsTable.eventId],
			references: [recurringEventInstancesTable.id],
		}),
		assignee: one(usersTable, {
			fields: [actionExceptionsTable.assigneeId],
			references: [usersTable.id],
		}),
		category: one(actionCategoriesTable, {
			fields: [actionExceptionsTable.categoryId],
			references: [actionCategoriesTable.id],
		}),
	}),
);
