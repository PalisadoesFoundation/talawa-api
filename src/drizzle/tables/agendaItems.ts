import { type InferSelectModel, relations, sql } from "drizzle-orm";
import {
	index,
	integer,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
	uuid,
} from "drizzle-orm/pg-core";
import { agendaItemTypeEnum } from "~/src/drizzle/enums";
import { agendaSectionsTable } from "./agendaSections";
import { eventsTable } from "./events";
import { usersTable } from "./users";

export const agendaItemsTable = pgTable(
	"agenda_items",
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

		description: text("description"),

		duration: text("duration"),

		eventId: uuid("event_id")
			.notNull()
			.references(() => eventsTable.id),

		id: uuid("id").notNull().primaryKey().defaultRandom(),

		key: text("key"),

		name: text("name", {}),

		position: integer("position").notNull(),

		sectionId: uuid("section_id")
			.notNull()
			.references(() => agendaSectionsTable.id),

		type: text("type", {
			enum: agendaItemTypeEnum.options,
		}).notNull(),

		updatedAt: timestamp("updated_at", {
			mode: "date",
		}),

		updaterId: uuid("updater_id").references(() => usersTable.id, {}),
	},
	(self) => ({
		index0: index().on(self.createdAt),
		index1: index().on(self.creatorId),
		index2: index().on(self.deletedAt),
		index3: index().on(self.name),
		index4: index().on(self.position),
		index5: index().on(self.sectionId),
		index6: index().on(self.type),
		uniqueIndex0: uniqueIndex()
			.on(self.eventId, self.position)
			.where(sql`${self.sectionId} is null`),
		uniqueIndex1: uniqueIndex()
			.on(self.position, self.sectionId)
			.where(sql`${self.sectionId} is not null`),
	}),
);

export type AgendaItemPgType = InferSelectModel<typeof agendaItemsTable>;

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
