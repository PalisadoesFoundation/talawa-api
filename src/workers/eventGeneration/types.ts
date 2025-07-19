import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type { FastifyBaseLogger } from "fastify";
import type * as schema from "~/src/drizzle/schema";

/**
 * Core dependencies and configuration types for the materialization system
 */

export interface WorkerDependencies {
	drizzleClient: NodePgDatabase<typeof schema>;
	logger: FastifyBaseLogger;
}

export interface ProcessingMetrics {
	startTime: number;
	endTime: number;
	instancesCreated: number;
	eventsProcessed: number;
	organizationsProcessed: number;
	errorsEncountered: number;
}

export interface ResourceUsage {
	memoryUsageMB: number;
	cpuUsagePercent: number;
	databaseConnections: number;
	processingThroughput: number;
}

export interface BatchProcessingConfig {
	batchSize: number;
	maxConcurrentBatches: number;
	timeoutMs: number;
	retryAttempts: number;
}

export interface ProcessingResult<T> {
	success: boolean;
	data: T | null;
	error?: string;
	metrics: ProcessingMetrics;
	resourceUsage: ResourceUsage;
}
