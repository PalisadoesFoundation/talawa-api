import { relations, sql } from "drizzle-orm";
import { boolean, index, pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { uuidv7 } from "uuidv7";
import { z } from "zod";
import { eventsTable } from "./events";
import { recurringEventInstancesTable } from "./recurringEventInstances";
import { usersTable } from "./users";

/**
 * Drizzle ORM postgres table definition for event attendees.
 * Tracks user attendance, registration, and invitation status for events.
 * Supports both standalone events and recurring event instances.
 */
export const eventAttendeesTable = pgTable(
	"event_attendees",
	{
		/**
		 * Primary unique identifier of the event attendee record.
		 */
		id: uuid("id").primaryKey().$default(uuidv7),

		/**
		 * Foreign key reference to the user attending the event.
		 */
		userId: uuid("user_id")
			.notNull()
			.references(() => usersTable.id, {
				onDelete: "cascade",
				onUpdate: "cascade",
			}),

		/**
		 * Foreign key reference to the standalone event (for standalone events).
		 * Either this OR recurringEventInstanceId must be set, but not both.
		 */
		eventId: uuid("event_id").references(() => eventsTable.id, {
			onDelete: "cascade",
			onUpdate: "cascade",
		}),

		/**
		 * Foreign key reference to the recurring event instance (for recurring events).
		 * Either this OR eventId must be set, but not both.
		 */
		recurringEventInstanceId: uuid("recurring_event_instance_id").references(
			() => recurringEventInstancesTable.id,
			{
				onDelete: "cascade",
				onUpdate: "cascade",
			},
		),

		/**
		 * Date and time when the attendee checked in to the event.
		 * Null if the attendee has not checked in yet.
		 */
		checkinTime: timestamp("checkin_time", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		}),

		/**
		 * Date and time when the attendee checked out from the event.
		 * Null if the attendee has not checked out yet.
		 */
		checkoutTime: timestamp("checkout_time", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		}),

		/**
		 * Indicates whether feedback has been submitted for this event attendance.
		 * True when the attendee has provided event feedback.
		 */
		feedbackSubmitted: boolean("feedback_submitted").notNull().default(false),

		/**
		 * Indicates if the attendee is invited to the event.
		 * True when an admin invites a user to an event.
		 */
		isInvited: boolean("is_invited").notNull().default(false),

		/**
		 * Indicates if the attendee is registered for the event.
		 * True when a user registers for an event (either self-registration or admin registration).
		 */
		isRegistered: boolean("is_registered").notNull().default(false),

		/**
		 * Indicates if the attendee has checked in to the event.
		 * True when the attendee successfully checks in.
		 */
		isCheckedIn: boolean("is_checked_in").notNull().default(false),

		/**
		 * Indicates if the attendee has checked out from the event.
		 * True when the attendee successfully checks out.
		 */
		isCheckedOut: boolean("is_checked_out").notNull().default(false),

		/**
		 * Date time when the event attendee record was created.
		 */
		createdAt: timestamp("created_at", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		})
			.notNull()
			.defaultNow(),

		/**
		 * Date time when the event attendee record was last updated.
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
		userIdIdx: index("event_attendees_user_id_idx").on(self.userId),
		eventIdIdx: index("event_attendees_event_id_idx").on(self.eventId),
		recurringEventInstanceIdIdx: index(
			"event_attendees_recurring_event_instance_id_idx",
		).on(self.recurringEventInstanceId),

		// Status indexes for filtering
		isInvitedIdx: index("event_attendees_is_invited_idx").on(self.isInvited),
		isRegisteredIdx: index("event_attendees_is_registered_idx").on(
			self.isRegistered,
		),
		isCheckedInIdx: index("event_attendees_is_checked_in_idx").on(
			self.isCheckedIn,
		),
		isCheckedOutIdx: index("event_attendees_is_checked_out_idx").on(
			self.isCheckedOut,
		),

		// Check-in/out time indexes
		checkinTimeIdx: index("event_attendees_checkin_time_idx").on(
			self.checkinTime,
		),
		checkoutTimeIdx: index("event_attendees_checkout_time_idx").on(
			self.checkoutTime,
		),
		feedbackSubmittedIdx: index("event_attendees_feedback_submitted_idx").on(
			self.feedbackSubmitted,
		),

		// Composite indexes for common queries
		userEventIdx: index("event_attendees_user_event_idx").on(
			self.userId,
			self.eventId,
		),
		userRecurringInstanceIdx: index(
			"event_attendees_user_recurring_instance_idx",
		).on(self.userId, self.recurringEventInstanceId),

		// Composite indexes optimized for invite-only event visibility checks
		// These indexes cover queries that filter by userId, isInvited=true, and event ID
		// (e.g., checking if a user is invited to view an invite-only event).
		// Including isInvited in the index allows PostgreSQL to use index-only scans
		// without needing to filter rows after the index lookup, improving performance
		// for both single-row lookups (event.ts) and batch queries (unifiedEventQueries.ts).
		userInvitedEventIdx: index("event_attendees_user_invited_event_idx").on(
			self.userId,
			self.isInvited,
			self.eventId,
		),
		userInvitedRecurringInstanceIdx: index(
			"event_attendees_user_invited_recurring_instance_idx",
		).on(self.userId, self.isInvited, self.recurringEventInstanceId),
		// Composite indexes for registered users accessing invite-only events
		// These indexes cover queries that filter by userId, isRegistered=true, and event ID
		// Registered users (even if not explicitly invited) can also view invite-only events
		// Including isRegistered in the index allows PostgreSQL to use index-only scans
		// for efficient lookups when checking if a registered user can access an invite-only event.
		userRegisteredEventIdx: index(
			"event_attendees_user_registered_event_idx",
		).on(self.userId, self.isRegistered, self.eventId),
		userRegisteredRecurringInstanceIdx: index(
			"event_attendees_user_registered_recurring_instance_idx",
		).on(self.userId, self.isRegistered, self.recurringEventInstanceId),

		// Timestamps
		createdAtIdx: index("event_attendees_created_at_idx").on(self.createdAt),
	}),
);

export const eventAttendeesTableRelations = relations(
	eventAttendeesTable,
	({ one }) => ({
		/**
		 * Many to one relationship from `event_attendees` table to `users` table.
		 */
		user: one(usersTable, {
			fields: [eventAttendeesTable.userId],
			references: [usersTable.id],
			relationName: "event_attendees.user_id:users.id",
		}),

		/**
		 * Many to one relationship from `event_attendees` table to `events` table.
		 * This relationship is for standalone events.
		 */
		event: one(eventsTable, {
			fields: [eventAttendeesTable.eventId],
			references: [eventsTable.id],
			relationName: "event_attendees.event_id:events.id",
		}),

		/**
		 * Many to one relationship from `event_attendees` table to `recurring_event_instances` table.
		 * This relationship is for recurring event instances.
		 */
		recurringEventInstance: one(recurringEventInstancesTable, {
			fields: [eventAttendeesTable.recurringEventInstanceId],
			references: [recurringEventInstancesTable.id],
			relationName:
				"event_attendees.recurring_event_instance_id:recurring_event_instances.id",
		}),
	}),
);

export const eventAttendeesTableInsertSchema = createInsertSchema(
	eventAttendeesTable,
	{
		userId: z.string().uuid(),
		eventId: z.string().uuid().optional(),
		recurringEventInstanceId: z.string().uuid().optional(),
		checkinTime: z.date().optional(),
		checkoutTime: z.date().optional(),
		feedbackSubmitted: z.boolean().optional(),
		isInvited: z.boolean().optional(),
		isRegistered: z.boolean().optional(),
		isCheckedIn: z.boolean().optional(),
		isCheckedOut: z.boolean().optional(),
	},
);

/**
 * Type for creating a new event attendee record.
 */
export type CreateEventAttendeeInput = {
	userId: string;
	eventId?: string;
	recurringEventInstanceId?: string;
	isInvited?: boolean;
	isRegistered?: boolean;
};

/**
 * Type for updating an event attendee record.
 */
export type UpdateEventAttendeeInput = {
	checkinTime?: Date;
	checkoutTime?: Date;
	feedbackSubmitted?: boolean;
	isInvited?: boolean;
	isRegistered?: boolean;
	isCheckedIn?: boolean;
	isCheckedOut?: boolean;
};
