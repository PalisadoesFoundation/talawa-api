import { relations } from "drizzle-orm";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import {
	index,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
	uuid,
} from "drizzle-orm/pg-core";
import { uuidv7 } from "uuidv7";
import { organizationsTable } from "./organizations";
import { tagsTable } from "./tags";
import { usersTable } from "./users";

export const tagFoldersTable = pgTable(
	"tag_folders",
	{
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

		id: uuid("id").primaryKey().$default(uuidv7),

		name: text("name").notNull(),

		organizationId: uuid("organization_id")
			.notNull()
			.references(() => organizationsTable.id, {}),

		parentFolderId: uuid("parent_folder_id").references(
			(): AnyPgColumn => tagFoldersTable.id,
		),

		updatedAt: timestamp("updated_at", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		}),

		updaterId: uuid("updater_id").references(() => usersTable.id),
	},
	(self) => [
		index().on(self.createdAt),
		index().on(self.creatorId),
		index().on(self.name),
		index().on(self.organizationId),
		uniqueIndex().on(self.name, self.organizationId),
	],
);

export const tagFoldersTableRelations = relations(
	tagFoldersTable,
	({ many, one }) => ({
		creator: one(usersTable, {
			fields: [tagFoldersTable.creatorId],
			references: [usersTable.id],
			relationName: "tag_folders.creator_id:users.id",
		}),

		organization: one(organizationsTable, {
			fields: [tagFoldersTable.organizationId],
			references: [organizationsTable.id],
			relationName: "organizations.id:tag_folders.organization_id",
		}),

		parentFolder: one(tagFoldersTable, {
			fields: [tagFoldersTable.parentFolderId],
			references: [tagFoldersTable.id],
			relationName: "tag_folders.id:tag_folders.parent_folder_id",
		}),

		tagFoldersWhereParentFolder: many(tagFoldersTable, {
			relationName: "tag_folders.id:tag_folders.parent_folder_id",
		}),

		tagsWhereFolder: many(tagsTable, {
			relationName: "tag_folders.id:tags.folder_id",
		}),

		updater: one(usersTable, {
			fields: [tagFoldersTable.updaterId],
			references: [usersTable.id],
			relationName: "tag_folders.updater_id:users.id",
		}),
	}),
);
