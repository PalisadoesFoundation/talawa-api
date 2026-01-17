import { relations, sql } from "drizzle-orm";
import {
	index,
	integer,
	pgEnum,
	pgTable,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { uuidv7 } from "uuidv7";
import { z } from "zod";
import { recurrenceFrequencyEnum as frequencyZodEnum } from "~/src/drizzle/enums/recurrenceFrequency";
import { eventsTable } from "./events";
import { organizationsTable } from "./organizations";
import { usersTable } from "./users";

/**
 * Enum for recurrence frequency
 */
export const recurrenceFrequencyEnum = pgEnum("frequency", [
	"DAILY",
	"WEEKLY",
	"MONTHLY",
	"YEARLY",
]);

/**
 * Drizzle ORM postgres table definition for recurrence rules.
 * This table stores the recurrence patterns (RRULE) for recurring events.
 */
export const recurrenceRulesTable = pgTable(
	"recurrence_rules",
	{
		/**
		 * Primary unique identifier of the recurrence rule.
		 */
		id: uuid("id").primaryKey().$default(uuidv7),

		/**
		 * Complete RRULE string following RFC 5545 standard.
		 * Example: "RRULE:FREQ=WEEKLY;BYDAY=MO,WE,FR;UNTIL=20250630T000000Z"
		 */
		recurrenceRuleString: text("recurrence_rule_string").notNull(),

		/**
		 * Frequency of recurrence (DAILY, WEEKLY, MONTHLY, YEARLY).
		 * Stored separately for faster querying without parsing RRULE string.
		 */
		frequency: recurrenceFrequencyEnum("frequency").notNull(),

		/**
		 * Interval between recurrences (e.g., 2 for every 2 weeks).
		 */
		interval: integer("interval").notNull().default(1),

		/**
		 * The moment when the pattern begins.
		 * All instance calculations start from this point.
		 */
		recurrenceStartDate: timestamp("recurrence_start_date", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		}).notNull(),

		/**
		 * Optional field that marks when to stop generating instances.
		 * Without this, events could recur forever.
		 */
		recurrenceEndDate: timestamp("recurrence_end_date", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		}),

		/**
		 * Alternative to end date - "repeat N times" instead of "repeat until date X."
		 */
		count: integer("count"),

		/**
		 * Sliding window tracker - tells us the furthest point in time for which
		 * we've already generated instances. When background job runs, it checks
		 * this date and generates new instances beyond it.
		 */
		latestInstanceDate: timestamp("latest_instance_date", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		}).notNull(),

		/**
		 * Days of the week for weekly/monthly patterns.
		 * Examples: ["MO", "WE", "FR"] or ["2MO"] for "second Monday of month"
		 */
		byDay: text("by_day").array(),

		/**
		 * Months for yearly patterns.
		 * Example: [1, 6, 12] for January, June, and December.
		 */
		byMonth: integer("by_month").array(),

		/**
		 * Days of the month.
		 * Example: [1, 15, -1] for 1st, 15th, and last day of the month.
		 */
		byMonthDay: integer("by_month_day").array(),

		/**
		 * Foreign key reference to the template event in events table.
		 * This template holds the default title, description, location, etc.
		 */
		baseRecurringEventId: uuid("base_recurring_event_id")
			.notNull()
			.references(() => eventsTable.id, {
				onDelete: "cascade",
				onUpdate: "cascade",
			}),

		/**
		 * Original series ID for tracking logical event series across template splits.
		 * When "update this and following" creates a new template, the new recurrence rule
		 * inherits this ID from the original series.
		 */
		originalSeriesId: uuid("original_series_id"),

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
		 * Foreign key reference to the user who created the rule.
		 */
		creatorId: uuid("creator_id")
			.notNull()
			.references(() => usersTable.id, {
				onDelete: "set null",
				onUpdate: "cascade",
			}),

		/**
		 * Foreign key reference to the user who last updated the rule.
		 */
		updaterId: uuid("updater_id").references(() => usersTable.id, {
			onDelete: "set null",
			onUpdate: "cascade",
		}),

		/**
		 * Date time at the time the rule was created.
		 */
		createdAt: timestamp("created_at", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		})
			.notNull()
			.defaultNow(),

		/**
		 * Date time at the time the rule was last updated.
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
		// Indexes for performance on frequently queried fields
		latestInstanceDateIdx: index("rr_latest_instance_date_idx").on(
			self.latestInstanceDate,
		), // Background job queries this
		organizationIdIdx: index("rr_organization_id_idx").on(self.organizationId), // Most queries filter by org
		baseRecurringEventIdIdx: index("rr_base_recurring_event_id_idx").on(
			self.baseRecurringEventId,
		), // Link to base event
		frequencyIdx: index("rr_frequency_idx").on(self.frequency), // Filter by frequency type
		creatorIdIdx: index("rr_creator_id_idx").on(self.creatorId), // Filter by creator
		recurrenceStartDateIdx: index("rr_recurrence_start_date_idx").on(
			self.recurrenceStartDate,
		), // Date range queries
		recurrenceEndDateIdx: index("rr_recurrence_end_date_idx").on(
			self.recurrenceEndDate,
		), // Date range queries
	}),
);

export const recurrenceRulesTableRelations = relations(
	recurrenceRulesTable,
	({ one }) => ({
		/**
		 * Many to one relationship from recurrence_rules to events table.
		 */
		baseRecurringEvent: one(eventsTable, {
			fields: [recurrenceRulesTable.baseRecurringEventId],
			references: [eventsTable.id],
			relationName: "recurrence_rules.base_recurring_event_id:events.id",
		}),

		/**
		 * Many to one relationship from recurrence_rules to organizations table.
		 */
		organization: one(organizationsTable, {
			fields: [recurrenceRulesTable.organizationId],
			references: [organizationsTable.id],
			relationName: "recurrence_rules.organization_id:organizations.id",
		}),

		/**
		 * Many to one relationship from recurrence_rules to users table (creator).
		 */
		creator: one(usersTable, {
			fields: [recurrenceRulesTable.creatorId],
			references: [usersTable.id],
			relationName: "recurrence_rules.creator_id:users.id",
		}),

		/**
		 * Many to one relationship from recurrence_rules to users table (updater).
		 */
		updater: one(usersTable, {
			fields: [recurrenceRulesTable.updaterId],
			references: [usersTable.id],
			relationName: "recurrence_rules.updater_id:users.id",
		}),
	}),
);

export const recurrenceRulesTableInsertSchema = createInsertSchema(
	recurrenceRulesTable,
	{
		recurrenceRuleString: (schema) => schema.min(1).max(512),
		frequency: frequencyZodEnum,
		interval: (schema) => schema.min(1).max(999),
		byDay: z.array(z.string().min(2).max(3)).optional(),
		byMonth: z.array(z.number().min(1).max(12)).optional(),
		// RFC 5545: BYMONTHDAY values range from -31 to 31, excluding 0
		byMonthDay: z
			.array(
				z
					.number()
					.min(-31)
					.max(31)
					.refine((n) => n !== 0, {
						message: "BYMONTHDAY value cannot be 0 per RFC 5545",
					}),
			)
			.optional(),
	},
);
