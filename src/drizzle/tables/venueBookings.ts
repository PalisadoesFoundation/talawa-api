import { relations, sql } from "drizzle-orm";
import {
	index,
	pgTable,
	primaryKey,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";
import { eventsTable } from "./events";
import { usersTable } from "./users";
import { venuesTable } from "./venues";

export const venueBookingsTable = pgTable(
	"venue_bookings",
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

		updatedAt: timestamp("updated_at", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		})
			.$defaultFn(() => sql`${null}`)
			.$onUpdate(() => new Date()),

		updaterId: uuid("updater_id").references(() => usersTable.id, {}),

		venueId: uuid("venue_id")
			.notNull()
			.references(() => venuesTable.id),
	},
	(self) => [
		primaryKey({
			columns: [self.eventId, self.venueId],
		}),
		index().on(self.createdAt),
		index().on(self.creatorId),
		index().on(self.eventId),
		index().on(self.venueId),
	],
);

export const venueBookingsTableRelations = relations(
	venueBookingsTable,
	({ one }) => ({
		creator: one(usersTable, {
			fields: [venueBookingsTable.creatorId],
			references: [usersTable.id],
			relationName: "users.id:venue_bookings.creator_id",
		}),

		event: one(eventsTable, {
			fields: [venueBookingsTable.eventId],
			references: [eventsTable.id],
			relationName: "events.id:venue_bookings.event_id",
		}),

		updater: one(usersTable, {
			fields: [venueBookingsTable.updaterId],
			references: [usersTable.id],
			relationName: "users.id:venue_bookings.updater_id",
		}),

		venue: one(venuesTable, {
			fields: [venueBookingsTable.venueId],
			references: [venuesTable.id],
			relationName: "venue_bookings.venue_id:venues.id",
		}),
	}),
);
