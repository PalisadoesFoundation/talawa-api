import { relations, sql } from "drizzle-orm";
import {
	boolean,
	check,
	date,
	index,
	pgTable,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { uuidv7 } from "uuidv7";
import { z } from "zod";
import { agendaFoldersTable } from "./agendaFolders";
import { eventAttachmentsTable } from "./eventAttachments";
import { organizationsTable } from "./organizations";
import { usersTable } from "./users";
import { venueBookingsTable } from "./venueBookings";

/**
 * Drizzle orm postgres table definition for events.
 */
export const eventsTable = pgTable(
	"events",
	{
		/**
		 * Date time at the time the event was created.
		 */
		createdAt: timestamp("created_at", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		})
			.notNull()
			.defaultNow(),
		/**
		 * Foreign key reference to the id of the user who created the event.
		 */
		creatorId: uuid("creator_id").references(() => usersTable.id, {
			onDelete: "set null",
			onUpdate: "cascade",
		}),
		/**
		 * Custom information about the event.
		 */
		description: text("description"),
		/**
		 * Date time at the time the event ends at.
		 * Used only for timed events (allDay = false).
		 * Always stored in UTC as a timestamp with timezone.
		 * Must be null if allDay = true.
		 */
		endAt: timestamp("end_at", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		}),

		/**
		 * Exclusive end date for all-day events (date only, no time or timezone).
		 * For example, March 1 to March 2 represents a one-day event.
		 * Used only for all-day events (allDay = true).
		 * Must be null if allDay = false.
		 */
		endDate: date("end_date"),
		/**
		 * Primary unique identifier of the event.
		 */
		id: uuid("id").primaryKey().$default(uuidv7),
		/**
		 * Name of the event.
		 */
		name: text("name", {}).notNull(),
		/**
		 * Foreign key reference to the id of the organization the event is associated to.
		 */
		organizationId: uuid("organization_id")
			.notNull()
			.references(() => organizationsTable.id, {
				onDelete: "cascade",
				onUpdate: "cascade",
			}),
		/**
		 * Date time at the time the event starts at.
		 * Used only for timed events (allDay = false).
		 * Always stored in UTC as a timestamp with timezone.
		 * Must be null if allDay = true.
		 */
		startAt: timestamp("start_at", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		}),
		/**
		 * Inclusive start date for all-day events (date only, no time or timezone).
		 * Used only for all-day events (allDay = true).
		 * Must be null if allDay = false.
		 */
		startDate: date("start_date"),
		/**
		 * Indicates if the event spans the entire day.
		 */
		allDay: boolean("all_day").notNull().default(false),
		/**
		 * Indicates if the event is invite-only.
		 */
		isInviteOnly: boolean("is_invite_only").notNull().default(false),
		/**
		 * Indicates if the event is publicly visible.
		 */
		isPublic: boolean("is_public").notNull().default(false),
		/**
		 * Indicates if users can register for this event.
		 */
		isRegisterable: boolean("is_registerable").notNull().default(false),
		/**
		 * Physical or virtual location of the event.
		 */
		location: text("location"),
		/**
		 * Date time at the time the event was last updated.
		 */
		updatedAt: timestamp("updated_at", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		})
			.$defaultFn(() => sql`${null}`)
			.$onUpdate(() => new Date()),
		/**
		 * Foreign key reference to the id of the user who last updated the event.
		 */
		updaterId: uuid("updater_id").references(() => usersTable.id, {
			onDelete: "set null",
			onUpdate: "cascade",
		}),

		// RECURRING EVENT FIELDS
		/**
		 * Indicates if this event is a recurring template (base event).
		 * Template events store the default properties that all instances inherit.
		 */
		isRecurringEventTemplate: boolean("is_recurring_template")
			.notNull()
			.default(false),
	},
	(self) => ({
		// Check constraint to enforce allDay field consistency
		// If allDay = true: startDate and endDate must be set, startAt and endAt must be null
		// If allDay = false: startAt and endAt must be set, startDate and endDate must be null
		allDayConsistencyCheck: check(
			"all_day_consistency_check",
			sql`
				CASE
					WHEN ${self.allDay} = true THEN
						${self.startDate} IS NOT NULL AND ${self.endDate} IS NOT NULL
						AND ${self.startAt} IS NULL AND ${self.endAt} IS NULL
					WHEN ${self.allDay} = false THEN
						${self.startAt} IS NOT NULL AND ${self.endAt} IS NOT NULL
						AND ${self.startDate} IS NULL AND ${self.endDate} IS NULL
					ELSE false
				END = true
			`,
		),
		// Existing indexes with better naming
		createdAtIdx: index("events_created_at_idx").on(self.createdAt),
		creatorIdIdx: index("events_creator_id_idx").on(self.creatorId),
		endAtIdx: index("events_end_at_idx").on(self.endAt),
		endDateIdx: index("events_end_date_idx").on(self.endDate),
		nameIdx: index("events_name_idx").on(self.name),
		organizationIdIdx: index("events_organization_id_idx").on(
			self.organizationId,
		),
		startAtIdx: index("events_start_at_idx").on(self.startAt),
		startDateIdx: index("events_start_date_idx").on(self.startDate),
		allDayIdx: index("events_all_day_idx").on(self.allDay),
		isInviteOnlyIdx: index("events_is_invite_only_idx").on(self.isInviteOnly),
		isPublicIdx: index("events_is_public_idx").on(self.isPublic),
		isRegisterableIdx: index("events_is_registerable_idx").on(
			self.isRegisterable,
		),

		// New recurring event indexes
		isRecurringEventTemplateIdx: index("events_is_recurring_template_idx").on(
			self.isRecurringEventTemplate,
		),
	}),
);

export const eventsTableRelations = relations(eventsTable, ({ many, one }) => ({
	/**
	 * One to many relationship from `events` table to `agenda_folders` table.
	 */
	agendaFoldersWhereEvent: many(agendaFoldersTable, {
		relationName: "agenda_folders.event_id:events.id",
	}),
	/**
	 * Many to one relationship from `events` table to `users` table.
	 */
	creator: one(usersTable, {
		fields: [eventsTable.creatorId],
		references: [usersTable.id],
		relationName: "events.creator_id:users.id",
	}),
	/**
	 * One to many relationship from `events` table to `event_attachments` table.
	 */
	attachmentsWhereEvent: many(eventAttachmentsTable, {
		relationName: "event_attachments.event_id:events.id",
	}),

	/**
	 * Many to one relationship from `events` table to `organizations` table.
	 */
	organization: one(organizationsTable, {
		fields: [eventsTable.organizationId],
		references: [organizationsTable.id],
		relationName: "events.organization_id:organizations.id",
	}),
	/**
	 * Many to one relationship from `events` table to `users` table.
	 */
	updater: one(usersTable, {
		fields: [eventsTable.updaterId],
		references: [usersTable.id],
		relationName: "events.updater_id:users.id",
	}),
	/**
	 * One to many relationship from `events` table to `venue_bookings` table.
	 */
	venueBookingsWhereEvent: many(venueBookingsTable, {
		relationName: "events.id:venue_bookings.event_id",
	}),
}));

export const EVENT_DESCRIPTION_MAX_LENGTH = 2048;
export const EVENT_NAME_MAX_LENGTH = 256;
export const EVENT_LOCATION_MAX_LENGTH = 1024;

export const eventsTableInsertSchema = createInsertSchema(eventsTable, {
	description: (schema) =>
		schema.min(1).max(EVENT_DESCRIPTION_MAX_LENGTH).optional(),
	name: (schema) => schema.min(1).max(EVENT_NAME_MAX_LENGTH),
	allDay: (schema) => schema.optional(),
	isInviteOnly: (schema) => schema.optional(),
	isPublic: (schema) => schema.optional(),
	isRegisterable: (schema) => schema.optional(),
	location: (schema) => schema.min(1).max(EVENT_LOCATION_MAX_LENGTH).optional(),
	// Timed event fields (used when allDay = false)
	startAt: (schema) => schema.optional(),
	endAt: (schema) => schema.optional(),
	// All-day event fields (used when allDay = true)
	startDate: (schema) => schema.optional(),
	endDate: (schema) => schema.optional(),
	// Recurring event fields validation
	isRecurringEventTemplate: z.boolean().optional(),
}).refine(
	(data) => {
		if (data.allDay === true) {
			return (
				data.startDate != null &&
				data.endDate != null &&
				data.startAt == null &&
				data.endAt == null
			);
		}

		// allDay false/undefined (defaults to false): timed fields required and date-only fields must be absent.
		return (
			data.startAt != null &&
			data.endAt != null &&
			data.startDate == null &&
			data.endDate == null
		);
	},
	{
		message:
			"If allDay=true, provide startDate/endDate only. If allDay=false, provide startAt/endAt only.",
		path: ["allDay"],
	},
);
