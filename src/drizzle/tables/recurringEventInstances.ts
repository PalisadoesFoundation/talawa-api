import { relations, sql } from "drizzle-orm";
import {
	boolean,
	index,
	integer,
	pgTable,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { uuidv7 } from "uuidv7";
import { z } from "zod";
import { eventAttachmentsTable } from "./eventAttachments";
import { eventsTable } from "./events";
import { organizationsTable } from "./organizations";
import { recurrenceRulesTable } from "./recurrenceRules";
import { venueBookingsTable } from "./venueBookings";

/**
 * Drizzle ORM postgres table definition for recurring event event instances.
 *
 * This table stores pre-calculated instances of recurring events within a hot window
 * (typically 12-24 months ahead). Each instance represents a specific occurrence
 * of a recurring event with calculated dates and times.
 *
 * The actual event properties (name, description, etc.) are resolved at query time by:
 * 1. Inheriting from the base template event
 * 2. Applying any exceptions from the event_exceptions table
 *
 * This approach eliminates data duplication while providing fast date-range queries.
 */
export const recurringEventInstancesTable = pgTable(
	"recurring_event_instances",
	{
		/**
		 * Primary unique identifier of the recurring event instance.
		 * This is a real database ID for fast lookups and relationships.
		 */
		id: uuid("id").primaryKey().$default(uuidv7),

		/**
		 * Foreign key reference to the base recurring template event.
		 * This is the template that this instance inherits properties from.
		 */
		baseRecurringEventId: uuid("base_recurring_event_id")
			.notNull()
			.references(() => eventsTable.id, {
				onDelete: "cascade",
				onUpdate: "cascade",
			}),

		/**
		 * Foreign key reference to the recurrence rule that generated this instance.
		 * Used for tracking which pattern created this instance and for regeneration.
		 */
		recurrenceRuleId: uuid("recurrence_rule_id")
			.notNull()
			.references(() => recurrenceRulesTable.id, {
				onDelete: "cascade",
				onUpdate: "cascade",
			}),

		/**
		 * Original series ID for tracking logical event series across template splits.
		 * When "update this and following" creates a new template, all instances
		 * from the same original recurring event share this ID.
		 * This enables delete operations to work across template boundaries.
		 */
		originalSeriesId: uuid("original_series_id").notNull(),

		/**
		 * The original scheduled start time for this specific instance.
		 * This represents when this occurrence was supposed to happen according
		 * to the recurrence pattern, before any exceptions are applied.
		 * Used for matching with exceptions in the event_exceptions table.
		 */
		originalInstanceStartTime: timestamp("original_instance_start_time", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		}).notNull(),

		/**
		 * The actual start time for this recurring event instance.
		 * This is calculated from the original time plus any exceptions.
		 * Pre-calculated for fast date-range queries and sorting.
		 */
		actualStartTime: timestamp("actual_start_time", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		}).notNull(),

		/**
		 * The actual end time for this recurring event instance.
		 * Calculated based on actualStartTime and duration from template + exceptions.
		 * Pre-calculated for fast date-range queries and calendar views.
		 */
		actualEndTime: timestamp("actual_end_time", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		}).notNull(),

		/**
		 * Indicates whether this instance has been cancelled/deleted.
		 * Cancelled instances remain in the table for historical tracking
		 * but are excluded from normal queries unless explicitly requested.
		 */
		isCancelled: boolean("is_cancelled").notNull().default(false),

		/**
		 * Foreign key reference to organization for data isolation and permissions.
		 */
		organizationId: uuid("organization_id")
			.notNull()
			.references(() => organizationsTable.id, {
				onDelete: "cascade",
				onUpdate: "cascade",
			}),

		/**
		 * Date time when this recurring event instance was created by the background worker.
		 * Used for tracking recurring event freshness and debugging.
		 */
		generatedAt: timestamp("recurringEventd_at", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		})
			.notNull()
			.defaultNow(),

		/**
		 * Date time when this recurring event instance was last updated.
		 * Updated when the background worker recalculates instances due to
		 * template changes or exception modifications.
		 */
		lastUpdatedAt: timestamp("last_updated_at", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		})
			.$defaultFn(() => sql`${null}`)
			.$onUpdate(() => new Date()),

		/**
		 * Version number for tracking changes and preventing conflicts.
		 * Incremented each time the instance is recalculated by the background worker.
		 */
		version: text("version").notNull().default("1"),

		/**
		 * Sequence number of this instance in the recurring series (1, 2, 3, ...).
		 * This tells you "this is the Nth occurrence of the recurring event".
		 * Useful for displaying "Meeting #5" or "Episode 12".
		 */
		sequenceNumber: integer("sequence_number").notNull(),

		/**
		 * Total count of instances in the complete recurring series.
		 * For infinite series (no end date/count), this will be null.
		 * For finite series, this enables "5 of 20" progress indicators.
		 */
		totalCount: integer("total_count"),
	},
	(self) => ({
		// Primary performance indexes for hot queries
		baseRecurringEventIdx: index("reei_base_recurring_event_idx").on(
			self.baseRecurringEventId,
		),
		organizationDateRangeIdx: index("reei_org_date_range_idx").on(
			self.organizationId,
			self.actualStartTime,
			self.actualEndTime,
		),
		actualStartTimeIdx: index("reei_actual_start_time_idx").on(
			self.actualStartTime,
		),
		actualEndTimeIdx: index("reei_actual_end_time_idx").on(self.actualEndTime),

		// Indexes for background worker operations
		originalInstanceStartTimeIdx: index(
			"reei_original_instance_start_time_idx",
		).on(self.originalInstanceStartTime),
		recurrenceRuleIdx: index("reei_recurrence_rule_idx").on(
			self.recurrenceRuleId,
		),
		originalSeriesIdx: index("reei_original_series_idx").on(
			self.originalSeriesId,
		),

		// Indexes for filtering and status queries
		isCancelledIdx: index("reei_is_cancelled_idx").on(self.isCancelled),
		generatedAtIdx: index("reei_recurringEventd_at_idx").on(self.generatedAt),

		// Composite indexes for complex queries
		organizationActiveInstancesIdx: index("reei_org_active_instances_idx").on(
			self.organizationId,
			self.isCancelled,
			self.actualStartTime,
		),
		baseEventInstanceTimeIdx: index("reei_base_event_instance_time_idx").on(
			self.baseRecurringEventId,
			self.originalInstanceStartTime,
		),

		// Index for cleanup operations (finding old instances)
		cleanupCandidatesIdx: index("reei_cleanup_candidates_idx").on(
			self.actualEndTime,
			self.generatedAt,
		),

		// Index for sequence-based queries
		sequenceNumberIdx: index("reei_sequence_number_idx").on(
			self.baseRecurringEventId,
			self.sequenceNumber,
		),
	}),
);

export const recurringEventInstancesTableRelations = relations(
	recurringEventInstancesTable,
	({ one, many }) => ({
		/**
		 * Many to one relationship to the base recurring template event.
		 * This is where all inherited properties come from.
		 */
		baseRecurringEvent: one(eventsTable, {
			fields: [recurringEventInstancesTable.baseRecurringEventId],
			references: [eventsTable.id],
			relationName:
				"recurring_event_instances.base_recurring_event_id:events.id",
		}),

		/**
		 * Many to one relationship to the recurrence rule that generated this instance.
		 */
		recurrenceRule: one(recurrenceRulesTable, {
			fields: [recurringEventInstancesTable.recurrenceRuleId],
			references: [recurrenceRulesTable.id],
			relationName:
				"recurring_event_instances.recurrence_rule_id:recurrence_rules.id",
		}),

		/**
		 * Many to one relationship to organization for data isolation.
		 */
		organization: one(organizationsTable, {
			fields: [recurringEventInstancesTable.organizationId],
			references: [organizationsTable.id],
			relationName:
				"recurring_event_instances.organization_id:organizations.id",
		}),

		/**
		 * One to many relationship to event attachments.
		 * Instance-specific attachments (inherits from template by default).
		 */
		attachmentsForRecurringEventInstance: many(eventAttachmentsTable, {
			relationName:
				"event_attachments.recurring_event_instance_id:recurring_event_instances.id",
		}),

		/**
		 * One to many relationship to venue bookings.
		 * Each recurring event instance can have its own venue booking.
		 */
		venueBookingsForRecurringEventInstance: many(venueBookingsTable, {
			relationName:
				"venue_bookings.recurring_event_instance_id:recurring_event_instances.id",
		}),
	}),
);

export const recurringEventInstancesTableInsertSchema = createInsertSchema(
	recurringEventInstancesTable,
	{
		baseRecurringEventId: z.string().uuid(),
		recurrenceRuleId: z.string().uuid(),
		originalSeriesId: z.string().uuid(),
		originalInstanceStartTime: z.date(),
		actualStartTime: z.date(),
		actualEndTime: z.date(),
		isCancelled: z.boolean().optional(),
		organizationId: z.string().uuid(),
		version: z.string().optional(),
		sequenceNumber: z.number().int().min(1),
		totalCount: z.number().int().min(1).nullable().optional(),
	},
);

/**
 * Type representing a fully resolved recurring event event instance.
 * This includes all inherited properties from the template plus any exceptions applied.
 */
export type ResolvedRecurringEventInstance = {
	// Core instance metadata
	id: string;
	baseRecurringEventId: string;
	recurrenceRuleId: string;
	originalSeriesId: string;
	originalInstanceStartTime: Date;
	actualStartTime: Date;
	actualEndTime: Date;
	isCancelled: boolean;
	organizationId: string;
	generatedAt: Date;
	lastUpdatedAt: Date | null;
	version: string;

	// Sequence metadata for recurring series
	sequenceNumber: number;
	totalCount: number | null;

	// Resolved event properties (inherited from template + exceptions)
	name: string;
	description: string | null;
	location: string | null;
	allDay: boolean;
	isPublic: boolean;
	isRegisterable: boolean;
	isInviteOnly: boolean;
	creatorId: string | null;
	updaterId: string | null;
	createdAt: Date;
	updatedAt: Date | null;

	// Exception metadata (if any exceptions were applied)
	hasExceptions: boolean;
	appliedExceptionData: Record<string, unknown> | null;
	exceptionCreatedBy: string | null;
	exceptionCreatedAt: Date | null;
};

/**
 * Input type for creating new recurring event instances.
 */
export type CreateRecurringEventInstanceInput = {
	baseRecurringEventId: string;
	recurrenceRuleId: string;
	originalSeriesId: string;
	originalInstanceStartTime: Date;
	actualStartTime: Date;
	actualEndTime: Date;
	organizationId: string;
	isCancelled?: boolean;
	sequenceNumber: number;
	totalCount?: number | null;
};

/**
 * Input type for batch creating recurring event instances.
 */
export type BatchCreateRecurringEventInstancesInput = {
	instances: CreateRecurringEventInstanceInput[];
	organizationId: string;
};
