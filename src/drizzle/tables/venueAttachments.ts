import { relations, sql } from "drizzle-orm";
import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { venueAttachmentMimeTypeEnum } from "~/src/drizzle/enums/venueAttachmentMimeType";
import { usersTable } from "./users";
import { venuesTable } from "./venues";

/**
 * Drizzle orm postgres table definition for venue attachments.
 */
export const venueAttachmentsTable = pgTable(
	"venue_attachments",
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
		 * Mime type of the attachment.
		 */
		mimeType: text("mime_type", {
			enum: venueAttachmentMimeTypeEnum.options,
		}).notNull(),
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
		/**
		 * Foreign key reference to the id of the venue that the attachment is associated to.
		 */
		venueId: uuid("venue_id")
			.notNull()
			.references(() => venuesTable.id, {
				onDelete: "cascade",
				onUpdate: "cascade",
			}),
	},
	(self) => [
		index().on(self.createdAt),
		index().on(self.creatorId),
		index().on(self.venueId),
	],
);

export const venueAttachmentsTableRelations = relations(
	venueAttachmentsTable,
	({ one }) => ({
		/**
		 * Many to one relationship from `venue_attachments` table to `users` table.
		 */
		creator: one(usersTable, {
			fields: [venueAttachmentsTable.creatorId],
			references: [usersTable.id],
			relationName: "users.id:venue_attachments.creator_id",
		}),
		/**
		 * Many to one relationship from `venue_attachments` table to `users` table.
		 */
		updater: one(usersTable, {
			fields: [venueAttachmentsTable.updaterId],
			references: [usersTable.id],
			relationName: "users.id:venue_attachments.updater_id",
		}),
		/**
		 * Many to one relationship from `venue_attachments` table to `venues` table.
		 */
		venue: one(venuesTable, {
			fields: [venueAttachmentsTable.venueId],
			references: [venuesTable.id],
			relationName: "venue_attachments.venue_id:venues.id",
		}),
	}),
);

export const venueAttachmentsTableInsertSchema = createInsertSchema(
	venueAttachmentsTable,
	{
		name: (schema) => schema.min(1),
	},
);
