import { relations, sql } from "drizzle-orm";
import { index, pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { uuidv7 } from "uuidv7";
import { z } from "zod";
import { eventAttendeesTable } from "./eventAttendees";

/**
 * Drizzle ORM postgres table definition for event check-outs.
 * Tracks when users check out from events.
 */
export const checkOutsTable = pgTable(
	"check_outs",
	{
		/**
		 * Primary unique identifier of the check-out record.
		 */
		id: uuid("id").primaryKey().$default(uuidv7),

		/**
		 * Foreign key reference to the event attendee record.
		 */
		eventAttendeeId: uuid("event_attendee_id")
			.notNull()
			.references(() => eventAttendeesTable.id, {
				onDelete: "cascade",
				onUpdate: "cascade",
			}),

		/**
		 * Date and time when the check-out occurred.
		 */
		time: timestamp("time", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		})
			.notNull()
			.defaultNow(),

		/**
		 * Date time when the check-out record was created.
		 */
		createdAt: timestamp("created_at", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		})
			.notNull()
			.defaultNow(),

		/**
		 * Date time when the check-out record was last updated.
		 */
		updatedAt: timestamp("updated_at", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		})
			.$defaultFn(() => sql`${null}`)
			.$onUpdate(() => new Date()),
	},
	(self) => ({
		// Primary indexes for performance
		eventAttendeeIdIdx: index("check_outs_event_attendee_id_idx").on(
			self.eventAttendeeId,
		),
		timeIdx: index("check_outs_time_idx").on(self.time),

		// Timestamps
		createdAtIdx: index("check_outs_created_at_idx").on(self.createdAt),
	}),
);

export const checkOutsTableRelations = relations(checkOutsTable, ({ one }) => ({
	/**
	 * Many to one relationship from `check_outs` table to `event_attendees` table.
	 */
	eventAttendee: one(eventAttendeesTable, {
		fields: [checkOutsTable.eventAttendeeId],
		references: [eventAttendeesTable.id],
		relationName: "check_outs.event_attendee_id:event_attendees.id",
	}),
}));

export const checkOutsTableInsertSchema = createInsertSchema(checkOutsTable, {
	eventAttendeeId: z.string().uuid(),
	time: z.date().optional(),
});

/**
 * Type for creating a new check-out record.
 */
export type CreateCheckOutInput = {
	eventAttendeeId: string;
	time?: Date;
};
