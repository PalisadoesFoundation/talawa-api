import { relations, sql } from "drizzle-orm";
import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { uuidv7 } from "uuidv7";
import { agendaFoldersTable } from "./agendaFolders";
import { eventAttachmentsTable } from "./eventAttachments";
import { eventAttendancesTable } from "./eventAttendances";
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
	},
	(self) => [
		index().on(self.createdAt),
		index().on(self.creatorId),
		index().on(self.endAt),
		index().on(self.name),
		index().on(self.organizationId),
		index().on(self.startAt),
	],
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
	 * One to many relationship from `events` table to `event_attendances` table.
	 */
	eventAttendancesWhereEvent: many(eventAttendancesTable, {
		relationName: "event_attendances.event_id:events.id",
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

export const eventsTableInsertSchema = createInsertSchema(eventsTable, {
	description: (schema) => schema.min(1).max(2048).optional(),
	name: (schema) => schema.min(1).max(256),
});
