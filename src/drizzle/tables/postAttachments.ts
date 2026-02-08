import { relations, sql } from "drizzle-orm";
import {
	index,
	pgEnum,
	pgTable,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { uuidv7 } from "uuidv7";
import { postAttachmentTypes } from "~/src/drizzle/enums/postAttachmentMimeType";
import { postsTable } from "./posts";
import { usersTable } from "./users";

/**
 * PostgreSQL enum for agendaItem attachment MIME types.
 * Valid values: image/avif, image/jpeg, image/png, image/webp, video/mp4, video/webm
 */
export const postAttachmentMimeTypePgEnum = pgEnum(
	"post_attachment_mime_type",
	postAttachmentTypes,
);

/**
 * Drizzle orm postgres table definition for post attachments.
 */
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
		 * Primary unique identifier of the post attachment.
		 */
		id: uuid("id").primaryKey().$default(uuidv7),

		/**
		 * Foreign key reference to the id of the user who created the attachment.
		 */
		creatorId: uuid("creator_id").references(() => usersTable.id, {
			onDelete: "set null",
			onUpdate: "cascade",
		}),
		/**
		 * Foreign key reference to the id of the post that the attachment is associated to.
		 */
		postId: uuid("post_id")
			.notNull()
			.references(() => postsTable.id, {
				onDelete: "cascade",
				onUpdate: "cascade",
			}),
		/**
		 * Mime type of the attachment.
		 */
		mimeType: postAttachmentMimeTypePgEnum("mime_type").notNull(),
		/**
		 * Identifier name of the attachment.
		 */
		name: text("name", {}).notNull(),

		/**
		 * Object name used when creating presigned URLs.
		 */
		objectName: text("object_name", {}).notNull(),

		/**
		 * File hash for deduplication purposes.
		 */
		fileHash: text("file_hash", {}).notNull(),

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
		updaterId: uuid("updater_id").references(() => usersTable.id, {
			onDelete: "set null",
			onUpdate: "cascade",
		}),
	},
	(self) => [
		index().on(self.createdAt),
		index().on(self.creatorId),
		index().on(self.postId),
		index().on(self.fileHash),
		index().on(self.objectName),
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
		name: (schema) => schema.min(1),
	},
);
