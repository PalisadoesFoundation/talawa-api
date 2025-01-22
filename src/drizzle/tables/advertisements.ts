import { relations, sql } from "drizzle-orm";
import {
	index,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
	uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { uuidv7 } from "uuidv7";
import { advertisementTypeEnum } from "~/src/drizzle/enums/advertisementType";
import { advertisementAttachmentsTable } from "./advertisementAttachments";
import { organizationsTable } from "./organizations";
import { usersTable } from "./users";

/**
 * Drizzle orm postgres table definition for advertisements.
 */
export const advertisementsTable = pgTable(
	"advertisements",
	{
		/**
		 * Date time at the time the advertisement was created.
		 */
		createdAt: timestamp("created_at", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		})
			.notNull()
			.defaultNow(),
		/**
		 * Foreign key reference to the id of the user who created the advertisement.
		 */
		creatorId: uuid("creator_id").references(() => usersTable.id, {
			onDelete: "set null",
			onUpdate: "cascade",
		}),
		/**
		 * Custom information about the advertisement.
		 */
		description: text("description"),
		/**
		 * Date time at the time the advertised event ends at.
		 */
		endAt: timestamp("end_at", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		}).notNull(),
		/**
		 * Primary unique identifier of the advertisement.
		 */
		id: uuid("id").primaryKey().$default(uuidv7),
		/**
		 * Name of the advertisement.
		 */
		name: text("name", {}).notNull(),
		/**
		 * Foreign key reference to the id of the organization in which the advertisement is made.
		 */
		organizationId: uuid("organization_id")
			.notNull()
			.references(() => organizationsTable.id, {
				onDelete: "cascade",
				onUpdate: "cascade",
			}),
		/**
		 * Date time at the time the advertised event starts at.
		 */
		startAt: timestamp("start_at", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		}).notNull(),
		/**
		 * Date time at the time the advertisement was last updated.
		 */
		updatedAt: timestamp("updated_at", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		})
			.$defaultFn(() => sql`${null}`)
			.$onUpdate(() => new Date()),
		/**
		 * Foreign key reference to the id of the user who last updated the advertisement.
		 */
		updaterId: uuid("updater_id").references(() => usersTable.id, {
			onDelete: "set null",
			onUpdate: "cascade",
		}),
		/**
		 * Mime type of the attachment.
		 */
		type: text("type", {
			enum: advertisementTypeEnum.options,
		}).notNull(),
	},
	(self) => [
		index().on(self.creatorId),
		index().on(self.endAt),
		index().on(self.name),
		index().on(self.organizationId),
		index().on(self.startAt),
		uniqueIndex().on(self.name, self.organizationId),
	],
);

export const advertisementsTableRelations = relations(
	advertisementsTable,
	({ many, one }) => ({
		/**
		 * One to many relationship from `advertisements` table to `advertisement_attachments` table.
		 */
		attachmentsWhereAdvertisement: many(advertisementAttachmentsTable, {
			relationName:
				"advertisement_attachments.advertisement_id:advertisements.id",
		}),
		/**
		 * Many to one relationship from `advertisements` table to `users` table.
		 */
		creator: one(usersTable, {
			fields: [advertisementsTable.creatorId],
			references: [usersTable.id],
			relationName: "advertisements.creator_id:users.id",
		}),
		/**
		 * Many to one relationship from `advertisements` table to `organizations` table.
		 */
		organization: one(organizationsTable, {
			fields: [advertisementsTable.organizationId],
			references: [organizationsTable.id],
			relationName: "advertisements.organization_id:organizations.id",
		}),
		/**
		 * Many to one relationship from `advertisements` table to `users` table.
		 */
		updater: one(usersTable, {
			fields: [advertisementsTable.updaterId],
			references: [usersTable.id],
			relationName: "advertisements.updater_id:users.id",
		}),
	}),
);

export const advertisementsTableInsertSchema = createInsertSchema(
	advertisementsTable,
	{
		description: (schema) => schema.min(1).max(2048).optional(),
		name: (schema) => schema.min(1).max(256),
	},
);
