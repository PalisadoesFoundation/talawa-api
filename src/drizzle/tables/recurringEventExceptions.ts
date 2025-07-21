import { relations, sql } from "drizzle-orm";
import {
	index,
	jsonb,
	pgEnum,
	pgTable,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { uuidv7 } from "uuidv7";
import { z } from "zod";
import { eventsTable } from "./events";
import { organizationsTable } from "./organizations";
import { usersTable } from "./users";

/**
 * Enum for exception types
 */
export const exceptionTypeEnum = pgEnum("exception_type", [
	"SINGLE_INSTANCE",
	"THIS_AND_FUTURE",
]);

/**
 * Drizzle ORM postgres table definition for event exceptions.
 * This table stores instance-specific modifications to recurring events.
 * When a user modifies a single instance or "this and future" instances,
 * the changes are stored here as differences from the template.
 */
export const eventExceptionsTable = pgTable(
	"event_exceptions",
	{
		/**
		 * Primary unique identifier of the exception.
		 */
		id: uuid("id").primaryKey().$default(uuidv7),

		/**
		 * Foreign key reference to the specific event instance that has exceptions.
		 * This is the actual event record in the events table.
		 */
		eventInstanceId: uuid("event_instance_id")
			.notNull()
			.references(() => eventsTable.id, {
				onDelete: "cascade",
				onUpdate: "cascade",
			}),

		/**
		 * Foreign key reference to the base recurring event (template).
		 * Links back to the original template to understand what changed.
		 */
		baseRecurringEventId: uuid("recurring_event_id")
			.notNull()
			.references(() => eventsTable.id, {
				onDelete: "cascade",
				onUpdate: "cascade",
			}),

		/**
		 * Timestamp identifying this specific instance of the recurring event.
		 * Used to identify which occurrence this exception applies to.
		 */
		instanceStartTime: timestamp("instance_start_time", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		}).notNull(),

		/**
		 * JSON object storing the field differences from the template.
		 * Only stores fields that are different from the base event.
		 * Example: { "name": "Special Meeting", "startAt": "2024-01-15T15:00:00Z" }
		 */
		exceptionData: jsonb("exception_data").notNull(),

		/**
		 * Type of exception:
		 * - SINGLE_INSTANCE: Only this specific instance is modified
		 * - THIS_AND_FUTURE: This instance and all future instances are modified
		 */
		exceptionType: exceptionTypeEnum("exception_type").notNull(),

		/**
		 * Foreign key reference to organization for data isolation.
		 */
		organizationId: uuid("organization_id")
			.notNull()
			.references(() => organizationsTable.id, {
				onDelete: "cascade",
				onUpdate: "cascade",
			}),

		/**
		 * Foreign key reference to the user who created the exception.
		 */
		creatorId: uuid("creator_id")
			.notNull()
			.references(() => usersTable.id, {
				onDelete: "set null",
				onUpdate: "cascade",
			}),

		/**
		 * Foreign key reference to the user who last updated the exception.
		 */
		updaterId: uuid("updater_id").references(() => usersTable.id, {
			onDelete: "set null",
			onUpdate: "cascade",
		}),

		/**
		 * Date time at the time the exception was created.
		 */
		createdAt: timestamp("created_at", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		})
			.notNull()
			.defaultNow(),

		/**
		 * Date time at the time the exception was last updated.
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
		// Indexes for performance
		eventInstanceIdIdx: index("ee_event_instance_id_idx").on(
			self.eventInstanceId,
		),
		recurringEventIdIdx: index("ee_recurring_event_id_idx").on(
			self.baseRecurringEventId,
		),
		instanceStartTimeIdx: index("ee_instance_start_time_idx").on(
			self.instanceStartTime,
		),
		organizationIdIdx: index("ee_organization_id_idx").on(self.organizationId),
		exceptionTypeIdx: index("ee_exception_type_idx").on(self.exceptionType),
		creatorIdIdx: index("ee_creator_id_idx").on(self.creatorId),

		// Composite index for finding exceptions for a specific recurring event and instance
		recurringEventInstanceIdx: index("ee_recurring_event_instance_idx").on(
			self.baseRecurringEventId,
			self.instanceStartTime,
		),
	}),
);

export const eventExceptionsTableRelations = relations(
	eventExceptionsTable,
	({ one }) => ({
		/**
		 * Many to one relationship from event_exceptions to events table (instance).
		 */
		eventInstance: one(eventsTable, {
			fields: [eventExceptionsTable.eventInstanceId],
			references: [eventsTable.id],
			relationName: "event_exceptions.event_instance_id:events.id",
		}),

		/**
		 * Many to one relationship from event_exceptions to events table (template).
		 */
		baseRecurringEvent: one(eventsTable, {
			fields: [eventExceptionsTable.baseRecurringEventId],
			references: [eventsTable.id],
			relationName: "event_exceptions.recurring_event_id:events.id",
		}),

		/**
		 * Many to one relationship from event_exceptions to organizations table.
		 */
		organization: one(organizationsTable, {
			fields: [eventExceptionsTable.organizationId],
			references: [organizationsTable.id],
			relationName: "event_exceptions.organization_id:organizations.id",
		}),

		/**
		 * Many to one relationship from event_exceptions to users table (creator).
		 */
		creator: one(usersTable, {
			fields: [eventExceptionsTable.creatorId],
			references: [usersTable.id],
			relationName: "event_exceptions.creator_id:users.id",
		}),

		/**
		 * Many to one relationship from event_exceptions to users table (updater).
		 */
		updater: one(usersTable, {
			fields: [eventExceptionsTable.updaterId],
			references: [usersTable.id],
			relationName: "event_exceptions.updater_id:users.id",
		}),
	}),
);

export const recurringEventExceptionsTableInsertSchema = createInsertSchema(
	eventExceptionsTable,
	{
		exceptionData: z.record(z.any()), // JSON object with any structure
		instanceStartTime: z.date(),
	},
);
