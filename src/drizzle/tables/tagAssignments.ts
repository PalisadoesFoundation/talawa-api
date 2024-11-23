import { relations } from "drizzle-orm";
import {
	index,
	pgTable,
	primaryKey,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";
import { tagsTable } from "./tags";
import { usersTable } from "./users";

export const tagAssignmentsTable = pgTable(
	"tag_assignments",
	{
		assigneeId: uuid("assignee_id")
			.notNull()
			.references(() => usersTable.id, {}),

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

		tagId: uuid("tag_id").references(() => tagsTable.id),

		updatedAt: timestamp("updated_at", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		}),

		updaterId: uuid("updater_id").references(() => usersTable.id),
	},
	(self) => [
		primaryKey({
			columns: [self.assigneeId, self.tagId],
		}),
		index().on(self.assigneeId),
		index().on(self.createdAt),
		index().on(self.creatorId),
		index().on(self.tagId),
	],
);

export const tagAssignmentsTableRelations = relations(
	tagAssignmentsTable,
	({ one }) => ({
		assignee: one(usersTable, {
			fields: [tagAssignmentsTable.assigneeId],
			references: [usersTable.id],
			relationName: "tag_assignments.assignee_id:users.id",
		}),

		creator: one(usersTable, {
			fields: [tagAssignmentsTable.creatorId],
			references: [usersTable.id],
			relationName: "tag_assignments.creator_id:users.id",
		}),

		tag: one(tagsTable, {
			fields: [tagAssignmentsTable.tagId],
			references: [tagsTable.id],
			relationName: "tag_assignments.tag_id:tags.id",
		}),

		updater: one(usersTable, {
			fields: [tagAssignmentsTable.updaterId],
			references: [usersTable.id],
			relationName: "tag_assignments.updater_id:users.id",
		}),
	}),
);
