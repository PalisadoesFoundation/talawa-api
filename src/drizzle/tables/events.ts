import { relations, sql } from "drizzle-orm";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import {
	boolean,
	date,
	index,
	pgTable,
	text,
	time,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";
import { uuidv7 } from "uuidv7";
import { actionsTable } from "./actions";
import { agendaSectionsTable } from "./agendaSections";
import { eventAttachmentsTable } from "./eventAttachments";
import { eventAttendancesTable } from "./eventAttendances";
import { organizationsTable } from "./organizations";
import { usersTable } from "./users";
import { venueBookingsTable } from "./venueBookings";
import { volunteerGroupsTable } from "./volunteerGroups";

export const eventsTable = pgTable(
	"events",
	{
		baseRecurringEventId: uuid("base_recurring_event_id").references(
			(): AnyPgColumn => eventsTable.id,
		),

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

		endDate: date("end_date", {
			mode: "date",
		}),

		endTime: time("end_time"),

		id: uuid("id").primaryKey().$default(uuidv7),

		isAllDay: boolean("is_all_day").notNull(),

		isBaseRecurringEvent: boolean("is_base_recurring_event").notNull(),

		isPrivate: boolean("is_private").notNull(),

		isRecurring: boolean("is_recurring").notNull(),

		isRecurringException: boolean("is_recurring_exception").notNull(),

		isRegisterable: boolean("is_registerable").notNull(),

		name: text("name", {}).notNull(),

		organizationId: uuid("organization_id")
			.notNull()
			.references(() => organizationsTable.id),

		startDate: date("start_date", {
			mode: "date",
		}).notNull(),

		startTime: time("start_time"),

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
		index().on(self.organizationId),
	],
);

export const eventsTableRelations = relations(eventsTable, ({ many, one }) => ({
	actionsWhereEvent: many(actionsTable, {
		relationName: "actions.event_id:events.id",
	}),

	agendaSectionsWhereEvent: many(agendaSectionsTable, {
		relationName: "agenda_sections.event_id:events.id",
	}),

	creator: one(usersTable, {
		fields: [eventsTable.creatorId],
		references: [usersTable.id],
		relationName: "events.creator_id:users.id",
	}),

	eventAttachmentsWhereEvent: many(eventAttachmentsTable, {
		relationName: "event_attachments.event_id:events.id",
	}),

	eventAttendancesWhereEvent: many(eventAttendancesTable, {
		relationName: "event_attendances.event_id:events.id",
	}),

	updater: one(usersTable, {
		fields: [eventsTable.updaterId],
		references: [usersTable.id],
		relationName: "events.updater_id:users.id",
	}),

	venueBookingsWhereEvent: many(venueBookingsTable, {
		relationName: "events.id:venue_bookings.event_id",
	}),

	volunteerGroupsWhereEvent: many(volunteerGroupsTable, {
		relationName: "events.id:volunteer_groups.event_id",
	}),
}));
