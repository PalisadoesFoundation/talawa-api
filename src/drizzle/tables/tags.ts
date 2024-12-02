import { relations, sql } from "drizzle-orm";
import {
	type AnyPgColumn,
	boolean,
	index,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
	uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { uuidv7 } from "uuidv7";
import { organizationsTable } from "./organizations";
import { tagAssignmentsTable } from "./tagAssignments";
import { usersTable } from "./users";

/**
 * Drizzle orm postgres table definition for tags.
 */
export const tagsTable = pgTable(
	"tags",
	{
		/**
		 * Date time at the time the tag was created.
		 */
		createdAt: timestamp("created_at", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		})
			.notNull()
			.defaultNow(),
		/**
		 * Foreign key reference to the id of the user who first created the tag.
		 */
		creatorId: uuid("creator_id").references(() => usersTable.id, {
			onDelete: "set null",
			onUpdate: "cascade",
		}),
		/**
		 * Primary unique identifier of the tag.
		 */
		id: uuid("id").primaryKey().$default(uuidv7),
		/**
		 * Boolean to tell if the tag is to be used as a tag folder.
		 */
		isFolder: boolean("is_folder").notNull(),
		/**
		 * Name of the state the tag.
		 */
		name: text("name").notNull(),
		/**
		 * Foreign key reference to the id of the organization within which the tag is created.
		 */
		organizationId: uuid("organization_id")
			.notNull()
			.references(() => organizationsTable.id, {
				onDelete: "cascade",
				onUpdate: "cascade",
			}),
		/**
		 * Foreign key reference to the id of the parent tag.
		 */
		parentTagId: uuid("parent_tag_id").references(
			(): AnyPgColumn => tagsTable.id,
			{
				onDelete: "cascade",
				onUpdate: "cascade",
			},
		),
		/**
		 * Date time at the time the tag was last updated.
		 */
		updatedAt: timestamp("updated_at", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		})
			.$defaultFn(() => sql`${null}`)
			.$onUpdate(() => new Date()),
		/**
		 * Foreign key reference to the id of the user who last updated the tag.
		 */
		updaterId: uuid("updater_id").references(() => usersTable.id, {
			onDelete: "set null",
			onUpdate: "cascade",
		}),
	},
	(self) => [
		index().on(self.creatorId),
		index().on(self.isFolder),
		index().on(self.name),
		index().on(self.organizationId),
		index().on(self.parentTagId),
		uniqueIndex().on(self.isFolder, self.name, self.organizationId),
	],
);

export const tagsTableRelations = relations(tagsTable, ({ many, one }) => ({
	/**
	 * Many to one relationship from `tags` table to `users` table.
	 */
	creator: one(usersTable, {
		fields: [tagsTable.creatorId],
		references: [usersTable.id],
		relationName: "tags.creator_id:users.id",
	}),
	/**
	 * Many to one relationship from `tags` table to `organizations` table.
	 */
	organization: one(organizationsTable, {
		fields: [tagsTable.organizationId],
		references: [organizationsTable.id],
		relationName: "organizations.id:tags.organization_id",
	}),
	/**
	 * Many to one relationship from `tags` table to `tags` table.
	 */
	parentTag: one(tagsTable, {
		fields: [tagsTable.parentTagId],
		references: [tagsTable.id],
		relationName: "tags.id:tags.parent_tag_id",
	}),
	/**
	 * One to many relationship from `tags` table to `tag_assignments` table.
	 */
	tagAssignmentsWhereTag: many(tagAssignmentsTable, {
		relationName: "tag_assignments.tag_id:tags.id",
	}),
	/**
	 * One to many relationship from `tags` table to `tags` table.
	 */
	tagsWhereParentTag: many(tagsTable, {
		relationName: "tags.id:tags.parent_tag_id",
	}),
	/**
	 * Many to one relationship from `tags` table to `users` table.
	 */
	updater: one(usersTable, {
		fields: [tagsTable.updaterId],
		references: [usersTable.id],
		relationName: "tags.updater_id:users.id",
	}),
}));

export const tagsTableInsertSchema = createInsertSchema(tagsTable, {
	name: (schema) => schema.name.min(1).max(256),
});
