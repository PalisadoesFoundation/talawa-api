import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type { FastifyBaseLogger } from "fastify";
import type * as schema from "~/src/drizzle/schema";
import type { eventAttachmentsTable } from "~/src/drizzle/tables/eventAttachments";
import type { eventsTable } from "~/src/drizzle/tables/events";
import type { recurrenceRulesTable } from "~/src/drizzle/tables/recurrenceRules";
import type { eventExceptionsTable } from "~/src/drizzle/tables/recurringEventExceptions";
import type { recurringEventInstancesTable } from "~/src/drizzle/tables/recurringEventInstances";

/**
 * Input for getting generated instances within a date range
 */
export interface GetGeneratedInstancesInput {
	organizationId: string;
	startDate: Date;
	endDate: Date;
	includeCancelled?: boolean;
	limit?: number;
}

/**
 * Input for generating instances for a recurring event
 */
export interface GenerateInstancesInput {
	baseRecurringEventId: string;
	windowStartDate: Date;
	windowEndDate: Date;
	organizationId: string;
}

/**
 * Configuration for occurrence calculation
 */
export interface OccurrenceCalculationConfig {
	recurrenceRule: typeof recurrenceRulesTable.$inferSelect;
	baseEvent: typeof eventsTable.$inferSelect;
	windowStart: Date;
	windowEnd: Date;
	exceptions: (typeof eventExceptionsTable.$inferSelect)[];
}

/**
 * Result of occurrence calculation
 */
export interface CalculatedOccurrence {
	originalStartTime: Date;
	actualStartTime: Date;
	actualEndTime: Date;
	isCancelled: boolean;
	sequenceNumber: number;
	totalCount: number | null;
}

/**
 * Event template with attachments
 */
export type EventTemplateWithAttachments = typeof eventsTable.$inferSelect & {
	attachments: (typeof eventAttachmentsTable.$inferSelect)[];
};

/**
 * Input for resolving instance with inheritance
 */
export interface ResolveInstanceInput {
	generatedInstance: typeof recurringEventInstancesTable.$inferSelect;
	baseTemplate: EventTemplateWithAttachments;
	exception?: typeof eventExceptionsTable.$inferSelect;
}

/**
 * Configuration for window management
 */
export interface WindowManagerConfig {
	organizationId: string;
	hotWindowMonthsAhead?: number;
	historyRetentionMonths?: number;
	processingPriority?: number;
	maxInstancesPerRun?: number;
}

/**
 * Service dependencies that need to be injected
 */
export interface ServiceDependencies {
	drizzleClient: NodePgDatabase<typeof schema>;
	logger: FastifyBaseLogger;
}

/**
 * Recurrence calculation context
 */
export interface RecurrenceContext {
	eventDuration: number;
	totalCount: number | null;
	shouldCalculateTotalCount: boolean;
	isNeverEnding: boolean;
	exceptionsByTime: Map<string, typeof eventExceptionsTable.$inferSelect>;
	maxIterations: number;
}
