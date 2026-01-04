import type { DrizzleClient } from "~/src/fastifyPlugins/drizzleClient";
import type { PerformanceTracker } from "~/src/utilities/metrics/performanceTracker";
import { type ActionItemRow, createActionItemLoader } from "./actionItemLoader";
import { createEventLoader, type EventRow } from "./eventLoader";
import {
	createOrganizationLoader,
	type OrganizationRow,
} from "./organizationLoader";
import { createUserLoader, type UserRow } from "./userLoader";

/**
 * Type representing all available DataLoaders for the application.
 * These loaders provide batched, request-scoped data loading to prevent N+1 queries.
 */
export type Dataloaders = {
	/**
	 * DataLoader for fetching users by ID.
	 */
	user: ReturnType<typeof createUserLoader>;
	/**
	 * DataLoader for fetching organizations by ID.
	 */
	organization: ReturnType<typeof createOrganizationLoader>;
	/**
	 * DataLoader for fetching events by ID.
	 */
	event: ReturnType<typeof createEventLoader>;
	/**
	 * DataLoader for fetching action items by ID.
	 */
	actionItem: ReturnType<typeof createActionItemLoader>;
};

/**
 * Creates all DataLoaders for a request context.
 * Each loader is request-scoped to ensure proper caching and isolation.
 *
 * @param db - The Drizzle client instance for database operations.
 * @param perf - Optional performance tracker for monitoring database operations.
 * @returns An object containing all DataLoaders.
 *
 * @example
 * ```typescript
 * const dataloaders = createDataloaders(drizzleClient, req.perf);
 * const user = await dataloaders.user.load(userId);
 * const organization = await dataloaders.organization.load(orgId);
 * ```
 */
export function createDataloaders(
	db: DrizzleClient,
	perf?: PerformanceTracker,
): Dataloaders {
	return {
		user: createUserLoader(db, perf),
		organization: createOrganizationLoader(db, perf),
		event: createEventLoader(db, perf),
		actionItem: createActionItemLoader(db, perf),
	};
}

// Re-export types for convenience
export type { UserRow, OrganizationRow, EventRow, ActionItemRow };
