import { relations } from "drizzle-orm";
import {
	index,
	pgTable,
	primaryKey,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { tagsTable } from "./tags";
import { usersTable } from "./users";

/**
 * Drizzle orm postgres table definition for tag assignments.
 */
export const tagAssignmentsTable = pgTable(
	"tag_assignments",
	{
		/**
		 * Foreign key reference to the id of the user who has been assigned.
		 */
		assigneeId: uuid("assignee_id")
			.notNull()
			.references(() => usersTable.id, {
				onDelete: "cascade",
				onUpdate: "cascade",
			}),
		/**
		 * Date time at the time the tag assignment was created.
		 */
		createdAt: timestamp("created_at", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		})
			.notNull()
			.defaultNow(),
		/**
		 * Foreign key reference to the id of the user who created the tag assignment.
		 */
		creatorId: uuid("creator_id").references(() => usersTable.id, {
			onDelete: "set null",
			onUpdate: "cascade",
		}),
		/**
		 * Foreign key reference to the id of the tag that is assigned.
		 */
		tagId: uuid("tag_id")
			.notNull()
			.references(() => tagsTable.id, {
				onDelete: "cascade",
				onUpdate: "cascade",
			}),
	},
	(self) => [
		index().on(self.assigneeId),
		index().on(self.createdAt),
		index().on(self.creatorId),
		index().on(self.tagId),
		primaryKey({
			columns: [self.assigneeId, self.tagId],
		}),
	],
);

export const tagAssignmentsTableRelations = relations(
	tagAssignmentsTable,
	({ one }) => ({
		/**
		 * Many to one relationship from `tag_assignments` table to `users` table.
		 */
		assignee: one(usersTable, {
			fields: [tagAssignmentsTable.assigneeId],
			references: [usersTable.id],
			relationName: "tag_assignments.assignee_id:users.id",
		}),
		/**
		 * Many to one relationship from `tag_assignments` table to `users` table.
		 */
		creator: one(usersTable, {
			fields: [tagAssignmentsTable.creatorId],
			references: [usersTable.id],
			relationName: "tag_assignments.creator_id:users.id",
		}),
		/**
		 * Many to one relationship from `tag_assignments` table to `tags` table.
		 */
		tag: one(tagsTable, {
			fields: [tagAssignmentsTable.tagId],
			references: [tagsTable.id],
			relationName: "tag_assignments.tag_id:tags.id",
		}),
	}),
);

export const tagAssignmentsTableInsertSchema =
	createInsertSchema(tagAssignmentsTable);
