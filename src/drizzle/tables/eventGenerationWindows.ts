import { relations, sql } from "drizzle-orm";
import {
	boolean,
	index,
	integer,
	pgTable,
	text,
	timestamp,
	unique,
	uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { uuidv7 } from "uuidv7";
import { z } from "zod";
import { organizationsTable } from "./organizations";
import { usersTable } from "./users";

/**
 * Drizzle ORM postgres table definition for event generation window configuration.
 *
 * This table stores configuration settings for the generation hot window
 * per organization. It controls how far ahead the background worker should
 * pre-calculate and store event instances.
 */
export const eventGenerationWindowsTable = pgTable(
	"event_generation_windows",
	{
		/**
		 * Primary unique identifier of the window configuration.
		 */
		id: uuid("id").primaryKey().$default(uuidv7),

		/**
		 * Foreign key reference to organization.
		 * Each organization can have its own generatino settings.
		 */
		organizationId: uuid("organization_id")
			.notNull()
			.references(() => organizationsTable.id, {
				onDelete: "cascade",
				onUpdate: "cascade",
			}),

		/**
		 * How many months ahead should we maintain generated instances.
		 * Default: 12 months (1 year ahead)
		 */
		hotWindowMonthsAhead: integer("hot_window_months_ahead")
			.notNull()
			.default(12),

		/**
		 * How many months of past instances should we keep for historical queries.
		 * Default: 3 months of history
		 */
		historyRetentionMonths: integer("history_retention_months")
			.notNull()
			.default(3),

		/**
		 * The furthest future date for which we have generated instances.
		 * Updated by the background worker as it progresses.
		 */
		currentWindowEndDate: timestamp("current_window_end_date", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		}).notNull(),

		/**
		 * The earliest past date for which we retain generated instances.
		 * Instances older than this are candidates for cleanup.
		 */
		retentionStartDate: timestamp("retention_start_date", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		}).notNull(),

		/**
		 * Date when this window configuration was last processed by background worker.
		 * Used to determine which organizations need instance generation.
		 */
		lastProcessedAt: timestamp("last_processed_at", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		})
			.notNull()
			.defaultNow(),

		/**
		 * How many instances were processed during the last background worker run.
		 * Useful for monitoring and performance tracking.
		 */
		lastProcessedInstanceCount: integer("last_processed_instance_count")
			.notNull()
			.default(0),

		/**
		 * Whether generatino is enabled for this organization.
		 * Can be disabled to fall back to virtual instances for specific organizations.
		 */
		isEnabled: boolean("is_enabled").notNull().default(true),

		/**
		 * Priority level for background processing (1-10, higher = more priority).
		 * Organizations with more events might get higher priority.
		 */
		processingPriority: integer("processing_priority").notNull().default(5),

		/**
		 * Maximum number of instances to generate per background worker run.
		 * Prevents runaway generation for organizations with many recurring events.
		 */
		maxInstancesPerRun: integer("max_instances_per_run")
			.notNull()
			.default(1000),

		/**
		 * Configuration notes or comments about this window setup.
		 */
		configurationNotes: text("configuration_notes"),

		/**
		 * Foreign key reference to the user who created this configuration.
		 */
		createdById: uuid("created_by_id")
			.notNull()
			.references(() => usersTable.id, {
				onDelete: "set null",
				onUpdate: "cascade",
			}),

		/**
		 * Foreign key reference to the user who last updated this configuration.
		 */
		lastUpdatedById: uuid("last_updated_by_id").references(
			() => usersTable.id,
			{
				onDelete: "set null",
				onUpdate: "cascade",
			},
		),

		/**
		 * Date time when this configuration was created.
		 */
		createdAt: timestamp("created_at", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		})
			.notNull()
			.defaultNow(),

		/**
		 * Date time when this configuration was last updated.
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
		// Unique constraint: one window config per organization
		organizationIdUnique: unique("egw_organization_id_unique").on(
			self.organizationId,
		),

		// Indexes for background worker queries
		enabledWindowsIdx: index("egw_enabled_windows_idx").on(
			self.isEnabled,
			self.processingPriority,
		),
		lastProcessedAtIdx: index("egw_last_processed_at_idx").on(
			self.lastProcessedAt,
		),
		currentWindowEndDateIdx: index("egw_current_window_end_date_idx").on(
			self.currentWindowEndDate,
		),

		// Index for cleanup operations
		retentionStartDateIdx: index("egw_retention_start_date_idx").on(
			self.retentionStartDate,
		),

		// Composite index for worker priority processing
		workerProcessingIdx: index("egw_worker_processing_idx").on(
			self.isEnabled,
			self.processingPriority,
			self.lastProcessedAt,
		),
	}),
);

export const eventGenerationWindowsTableRelations = relations(
	eventGenerationWindowsTable,
	({ one }) => ({
		/**
		 * Many to one relationship to organization.
		 */
		organization: one(organizationsTable, {
			fields: [eventGenerationWindowsTable.organizationId],
			references: [organizationsTable.id],
			relationName: "event_generation_windows.organization_id:organizations.id",
		}),

		/**
		 * Many to one relationship to the user who created this configuration.
		 */
		createdBy: one(usersTable, {
			fields: [eventGenerationWindowsTable.createdById],
			references: [usersTable.id],
			relationName: "event_generation_windows.created_by_id:users.id",
		}),

		/**
		 * Many to one relationship to the user who last updated this configuration.
		 */
		lastUpdatedBy: one(usersTable, {
			fields: [eventGenerationWindowsTable.lastUpdatedById],
			references: [usersTable.id],
			relationName: "event_generation_windows.last_updated_by_id:users.id",
		}),
	}),
);

export const eventGenerationWindowsTableInsertSchema = createInsertSchema(
	eventGenerationWindowsTable,
	{
		organizationId: z.string().uuid(),
		hotWindowMonthsAhead: z.number().min(1).max(60), // 1 month to 5 years
		historyRetentionMonths: z.number().min(0).max(60),
		currentWindowEndDate: z.date(),
		retentionStartDate: z.date(),
		lastProcessedInstanceCount: z.number().min(0),
		isEnabled: z.boolean().optional(),
		processingPriority: z.number().min(1).max(10),
		maxInstancesPerRun: z.number().min(10).max(10000),
		configurationNotes: z.string().max(1024).optional(),
		createdById: z.string().uuid(),
		lastUpdatedById: z.string().uuid().optional(),
	},
);

/**
 * Type for window configuration with calculated dates.
 */
export type GenerationWindowConfig = {
	id: string;
	organizationId: string;
	hotWindowMonthsAhead: number;
	historyRetentionMonths: number;
	currentWindowEndDate: Date;
	retentionStartDate: Date;
	lastProcessedAt: Date;
	lastProcessedInstanceCount: number;
	isEnabled: boolean;
	processingPriority: number;
	maxInstancesPerRun: number;
	configurationNotes: string | null;
	createdById: string;
	lastUpdatedById: string | null;
	createdAt: Date;
	updatedAt: Date | null;
};

/**
 * Input for creating a new generation window configuration.
 */
export type CreateGenerationWindowInput = {
	organizationId: string;
	hotWindowMonthsAhead?: number;
	historyRetentionMonths?: number;
	processingPriority?: number;
	maxInstancesPerRun?: number;
	configurationNotes?: string;
	createdById: string;
};

/**
 * Input for updating generation window configuration.
 */
export type UpdateGenerationWindowInput = {
	windowId: string;
	hotWindowMonthsAhead?: number;
	historyRetentionMonths?: number;
	processingPriority?: number;
	maxInstancesPerRun?: number;
	isEnabled?: boolean;
	configurationNotes?: string;
	lastUpdatedById: string;
};
