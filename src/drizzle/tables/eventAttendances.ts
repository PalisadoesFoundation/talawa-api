import { relations, sql } from "drizzle-orm";
import { index, pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
import { eventsTable } from "./events";
import { usersTable } from "./users";

/**
 * Drizzle orm postgres table definition for event attendances.
 */
export const eventAttendancesTable = pgTable(
	"event_attendances",
	{
		/**
		 * Foreign key reference to the id of the user attending the event.
		 */
		attendeeId: uuid("attendee_id")
			.notNull()
			.references(() => usersTable.id, {
				onDelete: "cascade",
				onUpdate: "cascade",
			}),
		/**
		 * Date time at the time the attendee checked in to the event.
		 */
		checkInAt: timestamp("check_in_at", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		}),
		/**
		 * Date time at the time the attendee checked out of the event.
		 */
		checkOutAt: timestamp("check_out_at", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		}),
		/**
		 * Date time at the time the event attendance was created.
		 */
		createdAt: timestamp("created_at", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		})
			.notNull()
			.defaultNow(),
		/**
		 * Foreign key reference to the id of the user who created the event attendance.
		 */
		creatorId: uuid("creator_id").references(() => usersTable.id, {
			onDelete: "set null",
			onUpdate: "cascade",
		}),
		/**
		 * Foreign key reference to the id of the event the event attendance is associated to.
		 */
		eventId: uuid("event_id")
			.notNull()
			.references(() => eventsTable.id, {
				onDelete: "cascade",
				onUpdate: "cascade",
			}),
		/**
		 * Date time at the time the event attendance was last updated.
		 */
		updatedAt: timestamp("updated_at", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		})
			.$defaultFn(() => sql`${null}`)
			.$onUpdate(() => new Date()),
		/**
		 * Foreign key reference to the id of the user who last updated the event attendance.
		 */
		updaterId: uuid("updater_id").references(() => usersTable.id, {
			onDelete: "set null",
			onUpdate: "cascade",
		}),
	},
	(self) => [
		index().on(self.attendeeId),
		index().on(self.checkInAt),
		index().on(self.checkOutAt),
		index().on(self.createdAt),
		index().on(self.creatorId),
		index().on(self.eventId),
	],
);

export const eventAttendancesTableRelations = relations(
	eventAttendancesTable,
	({ one }) => ({
		/**
		 * Many to one relationship from `event_attendances` table to `users` table.
		 */
		attendee: one(usersTable, {
			fields: [eventAttendancesTable.attendeeId],
			references: [usersTable.id],
			relationName: "event_attendances.attendee_id:users.id",
		}),
		/**
		 * Many to one relationship from `event_attendances` table to `users` table.
		 */
		creator: one(usersTable, {
			fields: [eventAttendancesTable.creatorId],
			references: [usersTable.id],
			relationName: "event_attendances.creator_id:users.id",
		}),
		/**
		 * Many to one relationship from `event_attendances` table to `events` table.
		 */
		event: one(eventsTable, {
			fields: [eventAttendancesTable.eventId],
			references: [eventsTable.id],
			relationName: "event_attendances.event_id:events.id",
		}),
		/**
		 * Many to one relationship from `event_attendances` table to `users` table.
		 */
		updater: one(usersTable, {
			fields: [eventAttendancesTable.updaterId],
			references: [usersTable.id],
			relationName: "event_attendances.updater_id:users.id",
		}),
	}),
);
