/**
 * Event query utilities for GraphQL resolvers.
 *
 * This module provides clean separation between:
 * - Standalone event queries
 * - Materialized instance queries
 * - Unified queries that combine both
 *
 * Used by GraphQL resolvers in Organization.events and Query.eventsByIds
 */

export * from "./materializedInstanceQueries";
export * from "./standaloneEventQueries";
export * from "./unifiedEventQueries";

export type { GetMaterializedInstancesInput } from "./materializedInstanceQueries";

export type { GetStandaloneEventsInput } from "./standaloneEventQueries";

export type {
	EventWithAttachments,
	GetUnifiedEventsInput,
} from "./unifiedEventQueries";
