import { relations, sql } from "drizzle-orm";
import {
	type AnyPgColumn,
	index,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
	uuid,
} from "drizzle-orm/pg-core";
import { uuidv7 } from "uuidv7";
import { agendaItemsTable } from "./agendaItems";
import { eventsTable } from "./events";
import { usersTable } from "./users";

export const agendaSectionsTable = pgTable(
	"agenda_sections",
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

		eventId: uuid("event_id")
			.notNull()
			.references(() => eventsTable.id),

		id: uuid("id").primaryKey().$default(uuidv7),

		name: text("name", {}).notNull(),

		parentSectionId: uuid("parent_section_id").references(
			(): AnyPgColumn => agendaSectionsTable.id,
		),

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
		index().on(self.eventId),
		index().on(self.name),
		index().on(self.parentSectionId),
		uniqueIndex().on(self.eventId, self.name),
	],
);

export const agendaSectionsTableRelations = relations(
	agendaSectionsTable,
	({ many, one }) => ({
		agendaItemsWhereSection: many(agendaItemsTable, {
			relationName: "agenda_items.section_id:agenda_sections.id",
		}),

		agendaSectionsWhereParentSection: many(agendaSectionsTable, {
			relationName: "agenda_sections.id:agenda_sections.parent_section_id",
		}),

		creator: one(usersTable, {
			fields: [agendaSectionsTable.creatorId],
			references: [usersTable.id],
			relationName: "agenda_sections.creator_id:users.id",
		}),

		event: one(eventsTable, {
			fields: [agendaSectionsTable.eventId],
			references: [eventsTable.id],
			relationName: "agenda_sections.event_id:events.id",
		}),

		parentSection: one(agendaSectionsTable, {
			fields: [agendaSectionsTable.parentSectionId],
			references: [agendaSectionsTable.id],
			relationName: "agenda_sections.id:agenda_sections.parent_section_id",
		}),

		updater: one(usersTable, {
			fields: [agendaSectionsTable.updaterId],
			references: [usersTable.id],
			relationName: "agenda_sections.updater_id:users.id",
		}),
	}),
);
