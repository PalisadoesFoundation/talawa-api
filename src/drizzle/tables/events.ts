import { relations, sql } from "drizzle-orm";
import {
	boolean,
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
		 */
		endAt: timestamp("end_at", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		}).notNull(),
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
		 */
		startAt: timestamp("start_at", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		}).notNull(),
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
		// Existing indexes with better naming
		createdAtIdx: index("events_created_at_idx").on(self.createdAt),
		creatorIdIdx: index("events_creator_id_idx").on(self.creatorId),
		endAtIdx: index("events_end_at_idx").on(self.endAt),
		nameIdx: index("events_name_idx").on(self.name),
		organizationIdIdx: index("events_organization_id_idx").on(
			self.organizationId,
		),
		startAtIdx: index("events_start_at_idx").on(self.startAt),
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
	// Recurring event fields validation
	isRecurringEventTemplate: z.boolean().optional(),
});
