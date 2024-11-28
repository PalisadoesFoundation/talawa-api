import { relations, sql } from "drizzle-orm";
import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { advertisementAttachmentTypeEnum } from "~/src/drizzle/enums/advertisementAttachmentType";
import { advertisementsTable } from "./advertisements";
import { usersTable } from "./users";

export const advertisementAttachmentsTable = pgTable(
	"advertisement_attachments",
	{
		/**
		 * Foreign key reference to the id of the advertisement that the attachment is associated to.
		 */
		advertisementId: uuid("advertisement_id")
			.notNull()
			.references(() => advertisementsTable.id),
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
		 * Type of the attachment.
		 */
		type: advertisementAttachmentTypeEnum("type").notNull(),
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
		updaterId: uuid("updater_id").references(() => usersTable.id, {}),
		/**
		 * URI to the attachment.
		 */
		uri: text("uri", {}).notNull(),
	},
	(self) => [
		index().on(self.advertisementId),
		index().on(self.createdAt),
		index().on(self.creatorId),
	],
);

export const advertisementAttachmentsTableRelations = relations(
	advertisementAttachmentsTable,
	({ one }) => ({
		/**
		 * Many to one relationship from `advertisement_attachments` table to `advertisements` table.
		 */
		advertisement: one(advertisementsTable, {
			fields: [advertisementAttachmentsTable.advertisementId],
			references: [advertisementsTable.id],
			relationName:
				"advertisement_attachments.advertisement_id:advertisements.id",
		}),
		/**
		 * Many to one relationship from `advertisement_attachments` table to `users` table.
		 */
		creator: one(usersTable, {
			fields: [advertisementAttachmentsTable.creatorId],
			references: [usersTable.id],
			relationName: "advertisement_attachments.creator_id:users.id",
		}),
		/**
		 * Many to one relationship from `advertisement_attachments` table to `users` table.
		 */
		updater: one(usersTable, {
			fields: [advertisementAttachmentsTable.updaterId],
			references: [usersTable.id],
			relationName: "advertisement_attachments.updater_id:users.id",
		}),
	}),
);

export const advertisementAttachmentsTableInsertSchema = createInsertSchema(
	advertisementAttachmentsTable,
	{
		uri: (schema) => schema.uri.min(1),
	},
);
