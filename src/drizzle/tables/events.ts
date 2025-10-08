import { relations, sql } from "drizzle-orm";
import {
	boolean,
	index,
	integer,
	pgTable,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { uuidv7 } from "uuidv7";
import { agendaFoldersTable } from "./agendaFolders";
import { eventAttachmentsTable } from "./eventAttachments";
import { eventAttendancesTable } from "./eventAttendances";
import { organizationsTable } from "./organizations";
import { eventExceptionsTable } from "./recurringEventExceptions";
import { usersTable } from "./users";
import { venueBookingsTable } from "./venueBookings";

export const eventsTable = pgTable(
	"events",
	{
		createdAt: timestamp("created_at", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		})
			.notNull()
			.defaultNow(),
		creatorId: uuid("creator_id").references(() => usersTable.id, {
			onDelete: "set null",
			onUpdate: "cascade",
		}),
		description: text("description"),
		endAt: timestamp("end_at", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		}).notNull(),
		id: uuid("id").primaryKey().$default(uuidv7),
		name: text("name", {}).notNull(),
		organizationId: uuid("organization_id")
			.notNull()
			.references(() => organizationsTable.id, {
				onDelete: "cascade",
				onUpdate: "cascade",
			}),
		startAt: timestamp("start_at", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		}).notNull(),
		allDay: boolean("all_day").notNull().default(false),
		isPublic: boolean("is_public").notNull().default(false),
		isRegisterable: boolean("is_registerable").notNull().default(false),
		location: text("location"),
		capacity: integer("capacity").notNull(),
		updatedAt: timestamp("updated_at", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		})
			.$defaultFn(() => sql`${null}`)
			.$onUpdate(() => new Date()),
		updaterId: uuid("updater_id").references(() => usersTable.id, {
			onDelete: "set null",
			onUpdate: "cascade",
		}),
		isRecurringEventTemplate: boolean("is_recurring_template")
			.notNull()
			.default(false),
	},
	(self) => ({
		createdAtIdx: index("events_created_at_idx").on(self.createdAt),
		creatorIdIdx: index("events_creator_id_idx").on(self.creatorId),
		endAtIdx: index("events_end_at_idx").on(self.endAt),
		nameIdx: index("events_name_idx").on(self.name),
		organizationIdIdx: index("events_organization_id_idx").on(
			self.organizationId,
		),
		startAtIdx: index("events_start_at_idx").on(self.startAt),
		allDayIdx: index("events_all_day_idx").on(self.allDay),
		isPublicIdx: index("events_is_public_idx").on(self.isPublic),
		isRegisterableIdx: index("events_is_registerable_idx").on(
			self.isRegisterable,
		),
		isRecurringEventTemplateIdx: index("events_is_recurring_template_idx").on(
			self.isRecurringEventTemplate,
		),
	}),
);

export const eventsTableRelations = relations(eventsTable, ({ many, one }) => ({
	agendaFoldersWhereEvent: many(agendaFoldersTable, {
		relationName: "agenda_folders.event_id:events.id",
	}),
	creator: one(usersTable, {
		fields: [eventsTable.creatorId],
		references: [usersTable.id],
		relationName: "events.creator_id:users.id",
	}),
	attachmentsWhereEvent: many(eventAttachmentsTable, {
		relationName: "event_attachments.event_id:events.id",
	}),
	eventAttendancesWhereEvent: many(eventAttendancesTable, {
		relationName: "event_attendances.event_id:events.id",
	}),
	organization: one(organizationsTable, {
		fields: [eventsTable.organizationId],
		references: [organizationsTable.id],
		relationName: "events.organization_id:organizations.id",
	}),
	updater: one(usersTable, {
		fields: [eventsTable.updaterId],
		references: [usersTable.id],
		relationName: "events.updater_id:users.id",
	}),
	venueBookingsWhereEvent: many(venueBookingsTable, {
		relationName: "events.id:venue_bookings.event_id",
	}),

	exceptionsWhereEventInstance: many(eventExceptionsTable, {
		relationName: "event_exceptions.event_instance_id:events.id",
	}),
	exceptionsWhereRecurringEvent: many(eventExceptionsTable, {
		relationName: "event_exceptions.recurring_event_id:events.id",
	}),
}));
// Ensure 'capacity' is included in all event object usages and definitions above.
import type { ZodBoolean, ZodString } from "zod";
export const eventsTableInsertSchema = createInsertSchema(eventsTable, {
	description: (schema: ZodString) => schema.min(1).max(2048).optional(),
	name: (schema: ZodString) => schema.min(1).max(256),
	allDay: (schema: ZodBoolean) => schema.optional(),
	isPublic: (schema: ZodBoolean) => schema.optional(),
	isRegisterable: (schema: ZodBoolean) => schema.optional(),
	location: (schema: ZodString) => schema.min(1).max(1024).optional(),
	isRecurringEventTemplate: (schema: ZodBoolean) => schema.optional(),
});
