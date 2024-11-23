import { relations } from "drizzle-orm";
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
import { tagAssignmentsTable } from "./tagAssignments";
import { tagFoldersTable } from "./tagFolders";
import { usersTable } from "./users";

export const tagsTable = pgTable(
	"tags",
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

		folderId: uuid("folder_id").references(() => tagFoldersTable.id),

		id: uuid("id").primaryKey().$default(uuidv7),

		name: text("name").notNull(),

		organizationId: uuid("organization_id")
			.notNull()
			.references(() => organizationsTable.id, {}),

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
		index().on(self.folderId),
		index().on(self.name),
		index().on(self.organizationId),
		uniqueIndex().on(self.name, self.organizationId),
	],
);

export const tagsTableRelations = relations(tagsTable, ({ many, one }) => ({
	creator: one(usersTable, {
		fields: [tagsTable.creatorId],
		references: [usersTable.id],
		relationName: "tags.creator_id:users.id",
	}),

	folder: one(tagFoldersTable, {
		fields: [tagsTable.folderId],
		references: [tagFoldersTable.id],
		relationName: "tag_folders.id:tags.folder_id",
	}),

	organization: one(organizationsTable, {
		fields: [tagsTable.organizationId],
		references: [organizationsTable.id],
		relationName: "organizations.id:tags.organization_id",
	}),

	tagAssignmentsWhereTag: many(tagAssignmentsTable, {
		relationName: "tag_assignments.tag_id:tags.id",
	}),

	updater: one(usersTable, {
		fields: [tagsTable.updaterId],
		references: [usersTable.id],
		relationName: "tags.updater_id:users.id",
	}),
}));
