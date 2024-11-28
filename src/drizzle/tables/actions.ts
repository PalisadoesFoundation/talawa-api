import { relations, sql } from "drizzle-orm";
import {
	boolean,
	index,
	pgTable,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";
import { uuidv7 } from "uuidv7";
import { actionCategoriesTable } from "./actionCategories";
import { eventsTable } from "./events";
import { organizationsTable } from "./organizations";
import { usersTable } from "./users";

export const actionsTable = pgTable(
	"actions",
	{
		assignedAt: timestamp("assigned_at", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		}).notNull(),

		assigneeId: uuid("actor_id").references(() => usersTable.id),

		categoryId: uuid("category_id").references(() => actionCategoriesTable.id),

		completionAt: timestamp("completion_at", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		}).notNull(),

		createdAt: timestamp("created_at", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		})
			.notNull()
			.defaultNow(),

		creatorId: uuid("creator_id")
			.references(() => usersTable.id, {})
			.notNull(),

		eventId: uuid("event_id").references(() => eventsTable.id),

		id: uuid("id").primaryKey().$default(uuidv7),

		isCompleted: boolean("is_completed").notNull(),

		organizationId: uuid("organization_id")
			.notNull()
			.references(() => organizationsTable.id),

		postCompletionNotes: text("post_completion_notes"),

		preCompletionNotes: text("pre_completion_notes"),

		updatedAt: timestamp("updated_at", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		})
			.$defaultFn(() => sql`${null}`)
			.$onUpdate(() => new Date()),

		updaterId: uuid("updater_id").references(() => usersTable.id, {}),
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

export const actionsTableRelations = relations(actionsTable, ({ one }) => ({
	assignee: one(usersTable, {
		fields: [actionsTable.assigneeId],
		references: [usersTable.id],
		relationName: "actions.assignee_id:users.id",
	}),

	category: one(actionCategoriesTable, {
		fields: [actionsTable.categoryId],
		references: [actionCategoriesTable.id],
		relationName: "action_categories.id:actions.category_id",
	}),

	creator: one(usersTable, {
		fields: [actionsTable.creatorId],
		references: [usersTable.id],
		relationName: "actions.creator_id:users.id",
	}),

	event: one(eventsTable, {
		fields: [actionsTable.eventId],
		references: [eventsTable.id],
		relationName: "actions.event_id:events.id",
	}),

	organization: one(organizationsTable, {
		fields: [actionsTable.organizationId],
		references: [organizationsTable.id],
		relationName: "actions.organization_id:organizations.id",
	}),

	updater: one(usersTable, {
		fields: [actionsTable.updaterId],
		references: [usersTable.id],
		relationName: "actions.updater_id:users.id",
	}),
}));
