import { relations } from "drizzle-orm";
import { pgTable, primaryKey, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod"; // <--- THIS WAS MISSING
import { tagsTable } from "./tags";
import { usersTable } from "./users";

export const tagAssignmentsTable = pgTable(
	"tag_assignments",
	{
		assigneeId: uuid("assignee_id")
			.notNull()
			.references(() => usersTable.id),
		tagId: uuid("tag_id")
			.notNull()
			.references(() => tagsTable.id),
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
			relationName: "tag_assignee",
		}),
		tag: one(tagsTable, {
			fields: [tagAssignmentsTable.tagId],
			references: [tagsTable.id],
			relationName: "assignment_tag",
		}),
		creator: one(usersTable, {
			fields: [tagAssignmentsTable.creatorId],
			references: [usersTable.id],
			relationName: "tag_creator",
		}),
	}),
);

export const tagAssignmentsTableInsertSchema =
	createInsertSchema(tagAssignmentsTable);
