import { relations, sql } from "drizzle-orm";
import {
	index,
	integer,
	pgTable,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { uuidv7 } from "uuidv7";
import { agendaItemTypeEnum } from "~/src/drizzle/enums/agendaItemType";
import { agendaCategoriesTable } from "./agendaCategories";
import { agendaFoldersTable } from "./agendaFolders";
import { agendaItemAttachmentsTable } from "./agendaItemAttachments";
import { agendaItemUrlTable } from "./agendaItemUrls";
import { eventsTable } from "./events";
import { usersTable } from "./users";

/**
 * Drizzle orm postgres table definition for agenda items.
 */
export const agendaItemsTable = pgTable(
	"agenda_items",
	{
		/**
		 * Date time at the time the agenda item was created.
		 */
		createdAt: timestamp("created_at", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		})
			.notNull()
			.defaultNow(),
		/**
		 * Foreign key reference to the id of the user who created the agenda item.
		 */
		creatorId: uuid("creator_id").references(() => usersTable.id, {
			onDelete: "set null",
			onUpdate: "cascade",
		}),
		/**
		 * Foreign key reference to the id of the agenda category the agenda item belongs
		 */
		categoryId: uuid("category_id")
			.notNull()
			.references(() => agendaCategoriesTable.id, {
				onDelete: "cascade",
				onUpdate: "cascade",
			}),
		/**
		 * Custom information about the agenda item.
		 */
		description: text("description"),
		/**
		 * Duration of the agenda item.
		 */
		duration: text("duration"),
		/**
		 * Foreign key reference to the id of the event the agenda item is associated to.
		 */
		eventId: uuid("event_id")
			.notNull()
			.references(() => eventsTable.id, {
				onDelete: "cascade",
				onUpdate: "cascade",
			}),
		/**
		 * Foreign key reference to the id of the agenda folder the agenda item is associated to.
		 */
		folderId: uuid("folder_id")
			.notNull()
			.references(() => agendaFoldersTable.id, {
				onDelete: "cascade",
				onUpdate: "cascade",
			}),
		/**
		 * Primary unique identifier of the agenda item.
		 */
		id: uuid("id").primaryKey().$default(uuidv7),
		/**
		 * Key of the agenda item if it's type is `song`. More information at this link: {@link https://en.wikipedia.org/wiki/Key_(music)}
		 */
		key: text("key"),
		/**
		 * Name of the agenda item.
		 */
		name: text("name", {}).notNull(),
		/**
		 * Additional notes for the agenda item.
		 */
		notes: text("notes"),
		/**
		 * Sequence of the agenda item.
		 */
		sequence: integer("sequence").notNull(),
		/**
		 * Type of the agenda item.
		 */
		type: text("type", {
			enum: agendaItemTypeEnum.options,
		}).notNull(),
		/**
		 * Date time at the time the agenda item was last updated.
		 */
		updatedAt: timestamp("updated_at", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		})
			.$defaultFn(() => sql`${null}`)
			.$onUpdate(() => new Date()),
		/**
		 * Foreign key reference to the id of the user who last updated the agenda item.
		 */
		updaterId: uuid("updater_id").references(() => usersTable.id, {
			onDelete: "set null",
			onUpdate: "cascade",
		}),
	},
	(self) => [
		index().on(self.createdAt),
		index().on(self.creatorId),
		index().on(self.categoryId),
		index().on(self.eventId),
		index().on(self.folderId),
		index().on(self.name),
		index().on(self.type),
	],
);

export const agendaItemsTableRelations = relations(
	agendaItemsTable,
	({ one, many }) => ({
		/**
		 * Many to one relationship from `agenda_items` table to `users` table.
		 */
		creator: one(usersTable, {
			fields: [agendaItemsTable.creatorId],
			references: [usersTable.id],
			relationName: "agenda_items.creator_id:users.id",
		}),
		/**
		 * Many to one relationship from `agenda_items` table to `agenda_category` table.
		 */
		category: one(agendaCategoriesTable, {
			fields: [agendaItemsTable.categoryId],
			references: [agendaCategoriesTable.id],
			relationName: "agenda_items.category_id:agenda_categories.id",
		}),
		/**
		 * One to many relationship from `agenda_items` table to `agenda_item_attachments` table.
		 */
		attachmentsWhereAgendaItem: many(agendaItemAttachmentsTable, {
			relationName: "agenda_item_attachments.agenda_item_id:agenda_items.id",
		}),
		/**
		 * One to many relationship from `agenda_items` table to `agenda_item_url` table.
		 */
		urlsWhereAgendaItem: many(agendaItemUrlTable, {
			relationName: "agenda_item_url.agenda_item_id:agenda_items.id",
		}),
		/**
		 * Many to one relationship from `agenda_items` table to `events` table.
		 */
		event: one(eventsTable, {
			fields: [agendaItemsTable.eventId],
			references: [eventsTable.id],
			relationName: "agenda_items.event_id:events.id",
		}),
		/**
		 * Many to one relationship from `agenda_items` table to `agenda_folders` table.
		 */
		folder: one(agendaFoldersTable, {
			fields: [agendaItemsTable.folderId],
			references: [agendaFoldersTable.id],
			relationName: "agenda_items.folder_id:agenda_folders.id",
		}),
		/**
		 * Many to one relationship from `agenda_items` table to `users` table.
		 */
		updater: one(usersTable, {
			fields: [agendaItemsTable.updaterId],
			references: [usersTable.id],
			relationName: "agenda_items.updater_id:users.id",
		}),
	}),
);

export const AGENDA_ITEM_DESCRIPTION_MAX_LENGTH = 2048;
export const AGENDA_ITEM_NAME_MAX_LENGTH = 256;
export const AGENDA_ITEM_NOTES_MAX_LENGTH = 2048;

export const agendaItemsTableInsertSchema = createInsertSchema(
	agendaItemsTable,
	{
		description: (schema) =>
			schema.min(1).max(AGENDA_ITEM_DESCRIPTION_MAX_LENGTH).optional(),
		name: (schema) => schema.min(1).max(AGENDA_ITEM_NAME_MAX_LENGTH),
		notes: (schema) => schema.max(AGENDA_ITEM_NOTES_MAX_LENGTH).optional(),
		sequence: (schema) => schema.int().min(1),
	},
);
