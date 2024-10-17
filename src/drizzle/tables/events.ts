import { type InferSelectModel, relations } from "drizzle-orm";
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
		})
			.notNull()
			.defaultNow(),

		creatorId: uuid("creator_id").references(() => usersTable.id, {}),

		deletedAt: timestamp("deleted_at", {
			mode: "date",
		}),

		description: text("description"),

		endDate: date("end_date", {
			mode: "date",
		}),

		endTime: time("end_time"),

		id: uuid("id").notNull().primaryKey().defaultRandom(),

		isAllDay: boolean("is_all_day").notNull().default(false),

		isBaseRecurringEvent: boolean("is_base_recurring_event")
			.notNull()
			.default(false),

		isPrivate: boolean("is_private").notNull().default(false),

		isRecurring: boolean("is_recurring").notNull().default(false),

		isRecurringException: boolean("is_recurring_exception")
			.notNull()
			.default(false),

		isRegisterable: boolean("is_registerable").notNull().default(true),

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
		}),

		updaterId: uuid("updater_id").references(() => usersTable.id, {}),
	},
	(self) => ({
		index0: index().on(self.createdAt),
		index1: index().on(self.creatorId),
		index2: index().on(self.name),
		index3: index().on(self.organizationId),
	}),
);

export type EventPgType = InferSelectModel<typeof eventsTable>;

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
