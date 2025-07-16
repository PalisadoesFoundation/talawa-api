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
import { organizationsTable } from "./organizations";
import { usersTable } from "./users";

/**
 * Drizzle ORM postgres table definition for event materialization window configuration.
 *
 * This table stores configuration settings for the materialization hot window
 * per organization. It controls how far ahead the background worker should
 * pre-calculate and store event instances.
 */
export const eventMaterializationWindowsTable = pgTable(
	"event_materialization_windows",
	{
		/**
		 * Primary unique identifier of the window configuration.
		 */
		id: uuid("id").primaryKey().$default(uuidv7),

		/**
		 * Foreign key reference to organization.
		 * Each organization can have its own materialization settings.
		 */
		organizationId: uuid("organization_id")
			.notNull()
			.references(() => organizationsTable.id, {
				onDelete: "cascade",
				onUpdate: "cascade",
			}),

		/**
		 * How many months ahead should we maintain materialized instances.
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
		 * The furthest future date for which we have materialized instances.
		 * Updated by the background worker as it progresses.
		 */
		currentWindowEndDate: timestamp("current_window_end_date", {
			mode: "date",
			precision: 3,
			withTimezone: true,
		}).notNull(),

		/**
		 * The earliest past date for which we retain materialized instances.
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
		 * Whether materialization is enabled for this organization.
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
		organizationIdIdx: index("emw_organization_id_unique_idx").on(
			self.organizationId,
		),

		// Indexes for background worker queries
		enabledWindowsIdx: index("emw_enabled_windows_idx").on(
			self.isEnabled,
			self.processingPriority,
		),
		lastProcessedAtIdx: index("emw_last_processed_at_idx").on(
			self.lastProcessedAt,
		),
		currentWindowEndDateIdx: index("emw_current_window_end_date_idx").on(
			self.currentWindowEndDate,
		),

		// Index for cleanup operations
		retentionStartDateIdx: index("emw_retention_start_date_idx").on(
			self.retentionStartDate,
		),

		// Composite index for worker priority processing
		workerProcessingIdx: index("emw_worker_processing_idx").on(
			self.isEnabled,
			self.processingPriority,
			self.lastProcessedAt,
		),
	}),
);

export const eventMaterializationWindowsTableRelations = relations(
	eventMaterializationWindowsTable,
	({ one }) => ({
		/**
		 * Many to one relationship to organization.
		 */
		organization: one(organizationsTable, {
			fields: [eventMaterializationWindowsTable.organizationId],
			references: [organizationsTable.id],
			relationName:
				"event_materialization_windows.organization_id:organizations.id",
		}),

		/**
		 * Many to one relationship to the user who created this configuration.
		 */
		createdBy: one(usersTable, {
			fields: [eventMaterializationWindowsTable.createdById],
			references: [usersTable.id],
			relationName: "event_materialization_windows.created_by_id:users.id",
		}),

		/**
		 * Many to one relationship to the user who last updated this configuration.
		 */
		lastUpdatedBy: one(usersTable, {
			fields: [eventMaterializationWindowsTable.lastUpdatedById],
			references: [usersTable.id],
			relationName: "event_materialization_windows.last_updated_by_id:users.id",
		}),
	}),
);

export const eventMaterializationWindowsTableInsertSchema = createInsertSchema(
	eventMaterializationWindowsTable,
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
export type MaterializationWindowConfig = {
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
 * Input for creating a new materialization window configuration.
 */
export type CreateMaterializationWindowInput = {
	organizationId: string;
	hotWindowMonthsAhead?: number;
	historyRetentionMonths?: number;
	processingPriority?: number;
	maxInstancesPerRun?: number;
	configurationNotes?: string;
	createdById: string;
};

/**
 * Input for updating materialization window configuration.
 */
export type UpdateMaterializationWindowInput = {
	windowId: string;
	hotWindowMonthsAhead?: number;
	historyRetentionMonths?: number;
	processingPriority?: number;
	maxInstancesPerRun?: number;
	isEnabled?: boolean;
	configurationNotes?: string;
	lastUpdatedById: string;
};
