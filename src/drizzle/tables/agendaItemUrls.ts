import { relations, sql } from "drizzle-orm";
import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { uuidv7 } from "uuidv7";
import { agendaItemsTable } from "./agendaItems";
import { usersTable } from "./users";

export const agendaItemUrlTable = pgTable(
	"agenda_item_url",
	{
		/**
		 * Foreign key reference to the id of the agenda item that the url is associated to.
		 */
		agendaItemId: uuid("agenda_item_id")
			.notNull()
			.references(() => agendaItemsTable.id, {
				onDelete: "cascade",
				onUpdate: "cascade",
			}),
		/**
		 * URL to the agenda item.
		 */
		agendaItemURL: text("agenda_item_url").notNull(),
		/**
		 * Date time at the time the agenda item URL was created.
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
		 * Primary unique identifier of the agenda item url.
		 */
		id: uuid("id").primaryKey().$default(uuidv7),
		/**
		 * Date time at the time the url was last updated.
		 */
		updatedAt: timestamp("updated_at", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		})
			.$defaultFn(() => sql`${null}`)
			.$onUpdate(() => new Date()),
		/**
		 * Foreign key reference to the id of the user who last updated the url.
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
	],
);

export const agendaItemUrlTableRelations = relations(
	agendaItemUrlTable,
	({ one }) => ({
		/**
		 * Many to one relationship from `agenda_item_url` table to `users` table.
		 */
		creator: one(usersTable, {
			fields: [agendaItemUrlTable.creatorId],
			references: [usersTable.id],
			relationName: "agenda_item_url.creator_id:users.id",
		}),
		/**
		 * Many to one relationship from `agenda_item_url` table to `agenda_item` table.
		 */
		agendaItem: one(agendaItemsTable, {
			fields: [agendaItemUrlTable.agendaItemId],
			references: [agendaItemsTable.id],
			relationName: "agenda_item_url.agenda_item_id:agenda_item.id",
		}),
		/**
		 * Many to one relationship from `agenda_item_url` table to `users` table.
		 */
		updater: one(usersTable, {
			fields: [agendaItemUrlTable.updaterId],
			references: [usersTable.id],
			relationName: "agenda_item_url.updater_id:users.id",
		}),
	}),
);

export const agendaItemUrlTableInsertSchema =
	createInsertSchema(agendaItemUrlTable);
