import { pgTable, uuid, timestamp, primaryKey } from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { tagsTable } from "./tags";
import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod"; // <--- Import Zod

export const tagAssignmentsTable = pgTable(
  "tag_assignments",
  {
    assigneeId: uuid("assignee_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade", onUpdate: "cascade" }),

    tagId: uuid("tag_id")
      .notNull()
      .references(() => tagsTable.id, { onDelete: "cascade", onUpdate: "cascade" }),

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

// Enforce UUID validation for insert schema
export const tagAssignmentsTableInsertSchema = createInsertSchema(tagAssignmentsTable, {
  assigneeId: () => z.string().uuid(),
  tagId: () => z.string().uuid(),
  creatorId: () => z.string().uuid(),
});

export const tagAssignmentsTableSelectSchema = createSelectSchema(tagAssignmentsTable);