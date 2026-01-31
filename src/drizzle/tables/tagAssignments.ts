import { relations } from "drizzle-orm";
import { pgTable, primaryKey, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { tagsTable } from "./tags";
import { usersTable } from "./users";

export const tagAssignmentsTable = pgTable(
	"tag_assignments",
	{
		assigneeId: uuid("assignee_id")
			.notNull()
			.references(() => usersTable.id, { onDelete: "cascade" }),
		tagId: uuid("tag_id")
			.notNull()
			.references(() => tagsTable.id, { onDelete: "cascade" }),
		creatorId: uuid("creator_id")
			.notNull()
			.references(() => usersTable.id),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(t) => ({
		pk: primaryKey({ columns: [t.assigneeId, t.tagId] }),
	}),
);

export const tagAssignmentsTableRelations = relations(
	tagAssignmentsTable,
	({ one }) => ({
		assignee: one(usersTable, {
			fields: [tagAssignmentsTable.assigneeId],
			references: [usersTable.id],
			relationName: "tag_assignments.assignee_id:users.id",
		}),
		tag: one(tagsTable, {
			fields: [tagAssignmentsTable.tagId],
			references: [tagsTable.id],
			relationName: "tag_assignments.tag_id:tags.id",
		}),
		creator: one(usersTable, {
			fields: [tagAssignmentsTable.creatorId],
			references: [usersTable.id],
			relationName: "tag_assignments.creator_id:users.id",
		}),
	}),
);

export const tagAssignmentsTableInsertSchema = createInsertSchema(
	tagAssignmentsTable,
	{
		assigneeId: () => z.string().uuid(),
		tagId: () => z.string().uuid(),
		creatorId: () => z.string().uuid(),
	},
);

export const tagAssignmentsTableSelectSchema =
	createSelectSchema(tagAssignmentsTable);
