import { relations, sql } from "drizzle-orm";
import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { uuidv7 } from "uuidv7";
import { postAttachmentMimeTypeEnum } from "~/src/drizzle/enums/postAttachmentMimeType";
import { agendaItemsTable } from "./agendaItems";
import { usersTable } from "./users";

/**
 * Drizzle orm postgres table definition for agenda item attachments.
 */
export const agendaItemAttachmentsTable = pgTable(
	"agenda_item_attachments",
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
		 * Primary unique identifier of the agenda item attachment.
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
		 * Foreign key reference to the id of the agenda item that the attachment is associated to.
		 */
		agendaItemId: uuid("agenda_item_id")
			.notNull()
			.references(() => agendaItemsTable.id, {
				onDelete: "cascade",
				onUpdate: "cascade",
			}),
		/**
		 * Mime type of the attachment.
		 */
		mimeType: text("mime_type", {
			enum: postAttachmentMimeTypeEnum.options,
		}).notNull(),
		/**
		 * Identifier name of the attachment.
		 */
		name: text("name").notNull(),

		/**
		 * Object name used when creating presigned URLs.
		 */
		objectName: text("object_name").notNull(),

		/**
		 * File hash for integrity verification (may enable future deduplication).
		 */
		fileHash: text("file_hash").notNull(),

		/**
		 * Date time at the time the attachment was last updated.
		 */
		updatedAt: timestamp("updated_at", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		})
			.default(sql`null`)
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
		index().on(self.agendaItemId),
		index().on(self.fileHash),
		index().on(self.objectName),
	],
);

export const agendaItemAttachmentsTableRelations = relations(
	agendaItemAttachmentsTable,
	({ one }) => ({
		/**
		 * Many to one relationship from `agenda_item_attachments` table to `users` table.
		 */
		creator: one(usersTable, {
			fields: [agendaItemAttachmentsTable.creatorId],
			references: [usersTable.id],
			relationName: "agenda_item_attachments.creator_id:users.id",
		}),
		/**
		 * Many to one relationship from `agenda_item_attachments` table to `agenda_items` table.
		 */
		agendaItem: one(agendaItemsTable, {
			fields: [agendaItemAttachmentsTable.agendaItemId],
			references: [agendaItemsTable.id],
			relationName: "agenda_item_attachments.agenda_item_id:agenda_items.id",
		}),
		/**
		 * Many to one relationship from `agenda_item_attachments` table to `users` table.
		 */
		updater: one(usersTable, {
			fields: [agendaItemAttachmentsTable.updaterId],
			references: [usersTable.id],
			relationName: "agenda_item_attachments.updater_id:users.id",
		}),
	}),
);

export const agendaItemAttachmentsTableInsertSchema = createInsertSchema(
	agendaItemAttachmentsTable,
	{
		fileHash: (schema) =>
			schema.regex(
				/^[a-f0-9]{64}$/,
				"Must be a valid SHA-256 hash (64 lowercase hexadecimal characters)",
			),
		name: (schema) => schema.min(1),
		objectName: (schema) => schema.min(1),
	},
);
