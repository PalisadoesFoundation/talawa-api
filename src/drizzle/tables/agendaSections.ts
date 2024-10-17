import { type InferSelectModel, relations } from "drizzle-orm";
import {
	type AnyPgColumn,
	index,
	integer,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
	uuid,
} from "drizzle-orm/pg-core";
import { agendaItemsTable } from "./agendaItems";
import { eventsTable } from "./events";
import { usersTable } from "./users";

export const agendaSectionsTable = pgTable(
	"agenda_sections",
	{
		createdAt: timestamp("created_at", {
			mode: "date",
		})
			.notNull()
			.defaultNow(),

		creatorId: uuid("creator_id").references(() => usersTable.id, {}),

		deletedAt: timestamp("deleted_at", {
			mode: "date",
		}),

		eventId: uuid("event_id")
			.notNull()
			.references(() => eventsTable.id),

		id: uuid("id").notNull().primaryKey().defaultRandom(),

		name: text("name", {}).notNull(),

		parentSectionId: uuid("parent_section_id").references(
			(): AnyPgColumn => agendaSectionsTable.id,
		),

		position: integer("position").notNull(),

		updatedAt: timestamp("updated_at", {
			mode: "date",
		}),

		updaterId: uuid("updater_id").references(() => usersTable.id, {}),
	},
	(self) => ({
		index0: index().on(self.createdAt),
		index1: index().on(self.creatorId),
		index2: index().on(self.eventId),
		index3: index().on(self.name),
		index4: index().on(self.parentSectionId),
		uniqueIndex0: uniqueIndex().on(self.eventId, self.name),
		uniqueIndex1: uniqueIndex().on(self.eventId, self.position),
	}),
);

export type AgendaSectionPgType = InferSelectModel<typeof agendaSectionsTable>;

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
