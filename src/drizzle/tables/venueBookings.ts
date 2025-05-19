import { relations } from "drizzle-orm";
import {
	index,
	pgTable,
	primaryKey,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { eventsTable } from "./events";
import { usersTable } from "./users";
import { venuesTable } from "./venues";

/**
 * Drizzle orm postgres table definition for venue bookings.
 */
export const venueBookingsTable = pgTable(
	"venue_bookings",
	{
		/**
		 * Date time at the time the venue booking was created.
		 */
		createdAt: timestamp("created_at", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		})
			.notNull()
			.defaultNow(),
		/**
		 * Foreign key reference to the id of the user who created the venue booking.
		 */
		creatorId: uuid("creator_id").references(() => usersTable.id, {
			onDelete: "set null",
			onUpdate: "cascade",
		}),
		/**
		 * Foreign key reference to the id of the event the venue booking is associated to.
		 */
		eventId: uuid("event_id")
			.notNull()
			.references(() => eventsTable.id, {
				onDelete: "cascade",
				onUpdate: "cascade",
			}),
		/**
		 * Foreign key reference to the id of the venue the venue booking is associated to.
		 */
		venueId: uuid("venue_id")
			.notNull()
			.references(() => venuesTable.id, {
				onDelete: "cascade",
				onUpdate: "cascade",
			}),
	},
	(self) => [
		index().on(self.createdAt),
		index().on(self.creatorId),
		index().on(self.eventId),
		index().on(self.venueId),
		primaryKey({
			columns: [self.eventId, self.venueId],
		}),
	],
);

export const venueBookingsTableRelations = relations(
	venueBookingsTable,
	({ one }) => ({
		/**
		 * Many to one relationship from `venue_bookings` table to `users` table.
		 */
		creator: one(usersTable, {
			fields: [venueBookingsTable.creatorId],
			references: [usersTable.id],
			relationName: "users.id:venue_bookings.creator_id",
		}),
		/**
		 * Many to one relationship from `venue_bookings` table to `events` table.
		 */
		event: one(eventsTable, {
			fields: [venueBookingsTable.eventId],
			references: [eventsTable.id],
			relationName: "events.id:venue_bookings.event_id",
		}),
		/**
		 * Many to one relationship from `venue_bookings` table to `venues` table.
		 */
		venue: one(venuesTable, {
			fields: [venueBookingsTable.venueId],
			references: [venuesTable.id],
			relationName: "venue_bookings.venue_id:venues.id",
		}),
	}),
);

export const venueBookingsTableInsertSchema =
	createInsertSchema(venueBookingsTable);
