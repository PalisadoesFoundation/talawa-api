import { relations, sql } from "drizzle-orm";
import {
	type AnyPgColumn,
	index,
	pgTable,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { uuidv7 } from "uuidv7";
import { organizationsTable } from "./organizations";
import { tagsTable } from "./tags";
import { usersTable } from "./users";

/**
 * Drizzle orm postgres table definition for tag folders.
 */
export const tagFoldersTable = pgTable(
	"tag_folders",
	{
		/**
		 * Date time at the time the tag folder was created.
		 */
		createdAt: timestamp("created_at", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		})
			.notNull()
			.defaultNow(),
		/**
		 * Foreign key reference to the id of the user who created the tag folder.
		 */
		creatorId: uuid("creator_id").references(() => usersTable.id, {
			onDelete: "set null",
			onUpdate: "cascade",
		}),
		/**
		 * Primary unique identifier of the tag folder.
		 */
		id: uuid("id").primaryKey().$default(uuidv7),
		/**
		 * Name of the tag folder.
		 */
		name: text("name", {}).notNull(),
		/**
		 * Foreign key reference to the id of the organization the tag folder is associated to.
		 */
		organizationId: uuid("organization_id")
			.notNull()
			.references(() => organizationsTable.id, {
				onDelete: "cascade",
				onUpdate: "cascade",
			}),
		/**
		 * Foreign key reference to the id of the tag folder the tag folder is associated to.
		 */
		parentFolderId: uuid("parent_folder_id").references(
			(): AnyPgColumn => tagFoldersTable.id,
			{
				onDelete: "cascade",
				onUpdate: "cascade",
			},
		),
		/**
		 * Date time at the time the tag folder was last updated.
		 */
		updatedAt: timestamp("updated_at", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		})
			.$defaultFn(() => sql`${null}`)
			.$onUpdate(() => new Date()),
		/**
		 * Foreign key reference to the id of the user who last updated the tag folder.
		 */
		updaterId: uuid("updater_id").references(() => usersTable.id, {
			onDelete: "set null",
			onUpdate: "cascade",
		}),
	},
	(self) => [
		index().on(self.createdAt),
		index().on(self.creatorId),
		index().on(self.name),
		index().on(self.organizationId),
		index().on(self.parentFolderId),
	],
);

export const tagFoldersTableRelations = relations(
	tagFoldersTable,
	({ many, one }) => ({
		/**
		 * Many to one relationship from `tag_folders` table to `users` table.
		 */
		creator: one(usersTable, {
			fields: [tagFoldersTable.creatorId],
			references: [usersTable.id],
			relationName: "tag_folders.creator_id:users.id",
		}),
		/**
		 * Many to one relationship from `tag_folders` table to `organizations` table.
		 */
		organization: one(organizationsTable, {
			fields: [tagFoldersTable.organizationId],
			references: [organizationsTable.id],
			relationName: "organizations.id:tag_folders.organization_id",
		}),
		/**
		 * Many to one relationship from `tag_folders` table to `tag_folders` table.
		 */
		parentFolder: one(tagFoldersTable, {
			fields: [tagFoldersTable.parentFolderId],
			references: [tagFoldersTable.id],
			relationName: "tag_folders.id:tag_folders.parent_folder_id",
		}),
		/**
		 * One to many relationship from `tag_folders` table to `tags` table.
		 */
		tagsWhereFolder: many(tagsTable, {
			relationName: "tag_folders.id:tags.folder_id",
		}),
		/**
		 * One to many relationship from `tag_folders` table to `tag_folders` table.
		 */
		tagFoldersWhereParentFolder: many(tagFoldersTable, {
			relationName: "tag_folders.id:tag_folders.parent_folder_id",
		}),
		/**
		 * Many to one relationship from `tag_folders` table to `users` table.
		 */
		updater: one(usersTable, {
			fields: [tagFoldersTable.updaterId],
			references: [usersTable.id],
			relationName: "tag_folders.updater_id:users.id",
		}),
	}),
);

export const tagFoldersTableInsertSchema = createInsertSchema(tagFoldersTable, {
	name: (schema) => schema.min(1).max(256),
});
