import { relations, sql } from "drizzle-orm";
import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { postAttachmentTypeEnum } from "~/src/drizzle/enums/postAttachmentType";
import { postsTable } from "./posts";
import { usersTable } from "./users";

export const postAttachmentsTable = pgTable(
	"post_attachments",
	{
		/**
		 * Date time at the time the attachment was created.
		 */
		createdAt: timestamp("created_at", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		})
			.notNull()
			.defaultNow(),
		/**
		 * Foreign key reference to the id of the user who first created the attachment.
		 */
		creatorId: uuid("creator_id")
			.references(() => usersTable.id, {})
			.notNull(),
		/**
		 * Foreign key reference to the id of the post that the attachment is associated to.
		 */
		postId: uuid("post_id")
			.notNull()
			.references(() => postsTable.id),
		/**
		 * Type of the attachment.
		 */
		type: postAttachmentTypeEnum("type").notNull(),
		/**
		 * Foreign key reference to the id of the user who last updated the attachment.
		 */
		updatedAt: timestamp("updated_at", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		})
			.$defaultFn(() => sql`${null}`)
			.$onUpdate(() => new Date()),
		/**
		 * Foreign key reference to the id of the user who last updated the attachment.
		 */
		updaterId: uuid("updater_id").references(() => usersTable.id, {}),
		/**
		 * URI to the attachment.
		 */
		uri: text("uri", {}).notNull(),
	},
	(self) => [
		index().on(self.createdAt),
		index().on(self.creatorId),
		index().on(self.postId),
	],
);

export const postAttachmentsTableRelations = relations(
	postAttachmentsTable,
	({ one }) => ({
		/**
		 * Many to one relationship from `post_attachments` table to `users` table.
		 */
		creator: one(usersTable, {
			fields: [postAttachmentsTable.creatorId],
			references: [usersTable.id],
			relationName: "post_attachments.creator_id:users.id",
		}),
		/**
		 * Many to one relationship from `post_attachments` table to `posts` table.
		 */
		post: one(postsTable, {
			fields: [postAttachmentsTable.postId],
			references: [postsTable.id],
			relationName: "post_attachments.post_id:posts.id",
		}),
		/**
		 * Many to one relationship from `post_attachments` table to `users` table.
		 */
		updater: one(usersTable, {
			fields: [postAttachmentsTable.updaterId],
			references: [usersTable.id],
			relationName: "post_attachments.updater_id:users.id",
		}),
	}),
);

export const postAttachmentsTableInsertSchema = createInsertSchema(
	postAttachmentsTable,
	{
		uri: (schema) => schema.uri.min(1),
	},
);
