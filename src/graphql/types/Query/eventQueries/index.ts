/**
 * This file serves as the central export point for all event query utilities,
 * providing a clean and organized way to access queries for standalone events,
 * materialized instances, and unified event data. It is used by GraphQL resolvers
 * to fetch event-related information from the database.
 *
 */

export * from "./recurringEventInstanceQueries";
// Export the new function for getting recurring events by base ID
export { getRecurringEventInstanceByBaseId } from "./recurringEventInstanceQueries";
export type { GetStandaloneEventsInput } from "./standaloneEventQueries";
export * from "./standaloneEventQueries";

export type {
	EventWithAttachments,
	GetUnifiedEventsInput,
} from "./unifiedEventQueries";
export * from "./unifiedEventQueries";
