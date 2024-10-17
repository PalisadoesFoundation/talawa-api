import { type InferSelectModel, relations } from "drizzle-orm";
import {
	index,
	integer,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
	uuid,
} from "drizzle-orm/pg-core";
import { postAttachmentTypeEnum } from "~/src/drizzle/enums";
import { postsTable } from "./posts";
import { usersTable } from "./users";

export const postAttachmentsTable = pgTable(
	"post_attachments",
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

		position: integer("position").notNull(),

		postId: uuid("post_id")
			.notNull()
			.references(() => postsTable.id),

		type: text("type", {
			enum: postAttachmentTypeEnum.options,
		}).notNull(),

		updatedAt: timestamp("updated_at", {
			mode: "date",
		}),

		updaterId: uuid("updater_id").references(() => usersTable.id, {}),

		uri: text("uri", {}).notNull(),
	},
	(self) => ({
		index0: index().on(self.createdAt),
		index1: index().on(self.creatorId),
		index2: index().on(self.postId),
		uniqueIndex0: uniqueIndex().on(self.position, self.postId),
	}),
);

export type PostAttachmentPgType = InferSelectModel<
	typeof postAttachmentsTable
>;

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
