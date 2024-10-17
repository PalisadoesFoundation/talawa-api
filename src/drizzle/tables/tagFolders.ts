import { type InferSelectModel, relations } from "drizzle-orm";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import {
	index,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
	uuid,
} from "drizzle-orm/pg-core";
import { organizationsTable } from "./organizations";
import { tagsTable } from "./tags";
import { usersTable } from "./users";

export const tagFoldersTable = pgTable(
	"tag_folders",
	{
		createdAt: timestamp("created_at", {
			mode: "date",
		})
			.notNull()
			.defaultNow(),

		creatorId: uuid("creator_id").references(() => usersTable.id, {}),

		deletedAt: timestamp("deleted_at", {
			mode: "date",
		}),

		id: uuid("id").notNull().primaryKey().defaultRandom(),

		name: text("name").notNull(),

		organizationId: uuid("organization_id")
			.notNull()
			.references(() => organizationsTable.id, {}),

		parentFolderId: uuid("parent_folder_id").references(
			(): AnyPgColumn => tagFoldersTable.id,
		),

		updatedAt: timestamp("updated_at", {
			mode: "date",
		}),

		updaterId: uuid("updater_id").references(() => usersTable.id),
	},
	(self) => ({
		index0: index().on(self.createdAt),
		index1: index().on(self.creatorId),
		index2: index().on(self.name),
		index3: index().on(self.organizationId),
		uniqueIndex0: uniqueIndex().on(self.name, self.organizationId),
	}),
);

export type TagFolderPgType = InferSelectModel<typeof tagFoldersTable>;

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
