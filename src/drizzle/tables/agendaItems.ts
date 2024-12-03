import { relations, sql } from "drizzle-orm";
import {
	index,
	integer,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
	uuid,
} from "drizzle-orm/pg-core";
import { uuidv7 } from "uuidv7";
import { agendaItemTypeEnum } from "~/src/drizzle/enums/agendaItemType";
import { agendaSectionsTable } from "./agendaSections";
import { eventsTable } from "./events";
import { usersTable } from "./users";

export const agendaItemsTable = pgTable(
	"agenda_items",
	{
		createdAt: timestamp("created_at", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		})
			.notNull()
			.defaultNow(),

		creatorId: uuid("creator_id")
			.references(() => usersTable.id, {})
			.notNull(),

		description: text("description"),

		duration: text("duration"),

		eventId: uuid("event_id")
			.notNull()
			.references(() => eventsTable.id),

		id: uuid("id").primaryKey().$default(uuidv7),

		key: text("key"),

		name: text("name", {}),
		/**
		 * Position of the agenda item relative to other agenda item associated to the same agenda section the agenda item is associated to.
		 */
		position: integer("position").notNull(),

		sectionId: uuid("section_id")
			.notNull()
			.references(() => agendaSectionsTable.id),

		type: agendaItemTypeEnum("type").notNull(),

		updatedAt: timestamp("updated_at", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		})
			.$defaultFn(() => sql`${null}`)
			.$onUpdate(() => new Date()),

		updaterId: uuid("updater_id").references(() => usersTable.id, {}),
	},
	(self) => [
		index().on(self.createdAt),
		index().on(self.creatorId),
		index().on(self.name),
		index().on(self.position),
		index().on(self.sectionId),
		index().on(self.type),
		uniqueIndex()
			.on(self.eventId, self.position)
			.where(sql`${self.sectionId} is null`),
		uniqueIndex()
			.on(self.position, self.sectionId)
			.where(sql`${self.sectionId} is not null`),
	],
);

export const agendaItemsTableRelations = relations(
	agendaItemsTable,
	({ one }) => ({
		creator: one(usersTable, {
			fields: [agendaItemsTable.creatorId],
			references: [usersTable.id],
			relationName: "agenda_items.creator_id:users.id",
		}),

		event: one(eventsTable, {
			fields: [agendaItemsTable.eventId],
			references: [eventsTable.id],
			relationName: "agenda_items.event_id:events.id",
		}),

		section: one(agendaSectionsTable, {
			fields: [agendaItemsTable.sectionId],
			references: [agendaSectionsTable.id],
			relationName: "agenda_items.section_id:agenda_sections.id",
		}),

		updater: one(usersTable, {
			fields: [agendaItemsTable.updaterId],
			references: [usersTable.id],
			relationName: "agenda_items.updater_id:users.id",
		}),
	}),
);
