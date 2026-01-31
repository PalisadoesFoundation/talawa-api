import { pgTable, uuid, timestamp, primaryKey } from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { tagsTable } from "./tags";
import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod"; // <--- Added this

export const tagAssignmentsTable = pgTable(
  "tag_assignments",
  {
    assigneeId: uuid("assignee_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade", onUpdate: "cascade" }),

    tagId: uuid("tag_id")
      .notNull()
      .references(() => tagsTable.id, { onDelete: "cascade", onUpdate: "cascade" }),

    // Note: We use 'cascade' here because the column is notNull(). 
    // This means if the creator is deleted, this record is also deleted.
    creatorId: uuid("creator_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade", onUpdate: "cascade" }),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.assigneeId, table.tagId] }),
    };
  }
);

export const tagAssignmentsTableRelations = relations(
  tagAssignmentsTable,
  ({ one }) => ({
    assignee: one(usersTable, {
      fields: [tagAssignmentsTable.assigneeId],
      references: [usersTable.id],
      relationName: "tag_assignments_assignee",
    }),
    tag: one(tagsTable, {
      fields: [tagAssignmentsTable.tagId],
      references: [tagsTable.id],
      relationName: "tag_assignments_tag",
    }),
    creator: one(usersTable, {
      fields: [tagAssignmentsTable.creatorId],
      references: [usersTable.id],
      relationName: "tag_assignments_creator",
    }),
  })
);

export const tagAssignmentsTableInsertSchema = createInsertSchema(tagAssignmentsTable);
export const tagAssignmentsTableSelectSchema = createSelectSchema(tagAssignmentsTable);