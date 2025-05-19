import { relations, sql } from "drizzle-orm";
import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { uuidv7 } from "uuidv7";
import { agendaItemTypeEnum } from "~/src/drizzle/enums/agendaItemType";
import { agendaFoldersTable } from "./agendaFolders";
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
		 * Custom information about the agenda item.
		 */
		description: text("description"),
		/**
		 * Duration of the agenda item.
		 */
		duration: text("duration"),
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
		index().on(self.folderId),
		index().on(self.name),
		index().on(self.type),
	],
);

export const agendaItemsTableRelations = relations(
	agendaItemsTable,
	({ one }) => ({
		/**
		 * Many to one relationship from `agenda_items` table to `users` table.
		 */
		creator: one(usersTable, {
			fields: [agendaItemsTable.creatorId],
			references: [usersTable.id],
			relationName: "agenda_items.creator_id:users.id",
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

export const agendaItemsTableInsertSchema = createInsertSchema(
	agendaItemsTable,
	{
		description: (schema) => schema.min(1).max(2048).optional(),
		name: (schema) => schema.min(1).max(256),
	},
);
