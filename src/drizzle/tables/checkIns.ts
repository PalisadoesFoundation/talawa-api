import { relations, sql } from "drizzle-orm";
import { boolean, index, pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { uuidv7 } from "uuidv7";
import { z } from "zod";
import { eventAttendeesTable } from "./eventAttendees";

/**
 * Drizzle ORM postgres table definition for event check-ins.
 * Tracks when users check in to events and their feedback submission status.
 */
export const checkInsTable = pgTable(
	"check_ins",
	{
		/**
		 * Primary unique identifier of the check-in record.
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
		 * Date and time when the check-in occurred.
		 */
		time: timestamp("time", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		})
			.notNull()
			.defaultNow(),

		/**
		 * Indicates whether feedback has been submitted for this check-in.
		 * Used to track if the user has provided event feedback.
		 */
		feedbackSubmitted: boolean("feedback_submitted").notNull().default(false),

		/**
		 * Date time when the check-in record was created.
		 */
		createdAt: timestamp("created_at", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		})
			.notNull()
			.defaultNow(),

		/**
		 * Date time when the check-in record was last updated.
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
		eventAttendeeIdIdx: index("check_ins_event_attendee_id_idx").on(
			self.eventAttendeeId,
		),
		timeIdx: index("check_ins_time_idx").on(self.time),

		// Status indexes
		feedbackSubmittedIdx: index("check_ins_feedback_submitted_idx").on(
			self.feedbackSubmitted,
		),

		// Timestamps
		createdAtIdx: index("check_ins_created_at_idx").on(self.createdAt),
	}),
);

export const checkInsTableRelations = relations(checkInsTable, ({ one }) => ({
	/**
	 * Many to one relationship from `check_ins` table to `event_attendees` table.
	 */
	eventAttendee: one(eventAttendeesTable, {
		fields: [checkInsTable.eventAttendeeId],
		references: [eventAttendeesTable.id],
		relationName: "check_ins.event_attendee_id:event_attendees.id",
	}),
}));

export const checkInsTableInsertSchema = createInsertSchema(checkInsTable, {
	eventAttendeeId: z.string().uuid(),
	time: z.date().optional(),
	feedbackSubmitted: z.boolean().optional(),
});

/**
 * Type for creating a new check-in record.
 */
export type CreateCheckInInput = {
	eventAttendeeId: string;
	time?: Date;
};

/**
 * Type for updating a check-in record.
 */
export type UpdateCheckInInput = {
	feedbackSubmitted?: boolean;
};
