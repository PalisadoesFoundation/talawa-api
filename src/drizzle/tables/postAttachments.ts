import { relations } from "drizzle-orm";
import {
	index,
	integer,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
	uuid,
} from "drizzle-orm/pg-core";
import { postAttachmentTypeEnum } from "~/src/drizzle/enums/postAttachmentType";
import { postsTable } from "./posts";
import { usersTable } from "./users";

export const postAttachmentsTable = pgTable(
	"post_attachments",
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

		position: integer("position").notNull(),

		postId: uuid("post_id")
			.notNull()
			.references(() => postsTable.id),

		type: postAttachmentTypeEnum("type").notNull(),

		updatedAt: timestamp("updated_at", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		}),

		updaterId: uuid("updater_id").references(() => usersTable.id, {}),

		uri: text("uri", {}).notNull(),
	},
	(self) => [
		index().on(self.createdAt),
		index().on(self.creatorId),
		index().on(self.postId),
		uniqueIndex().on(self.position, self.postId),
	],
);

export const postAttachmentsTableRelations = relations(
	postAttachmentsTable,
	({ one }) => ({
		creator: one(usersTable, {
			fields: [postAttachmentsTable.creatorId],
			references: [usersTable.id],
			relationName: "post_attachments.creator_id:users.id",
		}),

		post: one(postsTable, {
			fields: [postAttachmentsTable.postId],
			references: [postsTable.id],
			relationName: "post_attachments.post_id:posts.id",
		}),

		updater: one(usersTable, {
			fields: [postAttachmentsTable.updaterId],
			references: [usersTable.id],
			relationName: "post_attachments.updater_id:users.id",
		}),
	}),
);
