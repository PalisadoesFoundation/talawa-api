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
import { eventAttachmentMimeTypeZodEnum } from "../enums/eventAttachmentMimeType";
import { imageMimeTypes } from "../enums/imageMimeType";
import { videoMimeTypes } from "../enums/videoMimeType";
import { eventsTable } from "./events";
import { usersTable } from "./users";

/**
 * PostgreSQL enum for event attachment MIME types.
 * Valid values: image/avif, image/jpeg, image/png, image/webp, video/mp4, video/webm
 */
export const eventAttachmentMimeTypePgEnum = pgEnum(
	"event_attachment_mime_type",
	[...imageMimeTypes, ...videoMimeTypes],
);

/**
 * Drizzle orm postgres table definition for event attachments.
 */
export const eventAttachmentsTable = pgTable(
	"event_attachments",
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
		 * Foreign key reference to the id of the user who created the attachment.
		 */
		creatorId: uuid("creator_id").references(() => usersTable.id, {
			onDelete: "set null",
			onUpdate: "cascade",
		}),
		/**
		 * Foreign key reference to the id of the event that the attachment is associated to.
		 */
		eventId: uuid("event_id")
			.notNull()
			.references(() => eventsTable.id, {
				onDelete: "cascade",
				onUpdate: "cascade",
			}),
		/**
		 * Mime type of the attachment.
		 */
		mimeType: eventAttachmentMimeTypePgEnum("mime_type").notNull(),
		/**
		 * Identifier name of the attachment.
		 */
		name: text("name", {}).notNull(),
		/**
		 * Date time at the time the attachment was last updated.
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
		index().on(self.eventId),
		index().on(self.createdAt),
		index().on(self.creatorId),
	],
);

export const eventAttachmentsTableRelations = relations(
	eventAttachmentsTable,
	({ one }) => ({
		/**
		 * Many to one relationship from `event_attachments` table to `users` table.
		 */
		creator: one(usersTable, {
			fields: [eventAttachmentsTable.creatorId],
			references: [usersTable.id],
			relationName: "event_attachments.creator_id:users.id",
		}),
		/**
		 * Many to one relationship from `event_attachments` table to `events` table.
		 */
		event: one(eventsTable, {
			fields: [eventAttachmentsTable.eventId],
			references: [eventsTable.id],
			relationName: "event_attachments.event_id:events.id",
		}),
		/**
		 * Many to one relationship from `event_attachments` table to `users` table.
		 */
		updater: one(usersTable, {
			fields: [eventAttachmentsTable.updaterId],
			references: [usersTable.id],
			relationName: "event_attachments.updater_id:users.id",
		}),
	}),
);

export const eventAttachmentsTableInsertSchema = createInsertSchema(
	eventAttachmentsTable,
	{
		name: (schema) => schema.min(1),
		mimeType: () => eventAttachmentMimeTypeZodEnum,
	},
);
