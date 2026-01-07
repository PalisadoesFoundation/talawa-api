import type { DrizzleClient } from "~/src/fastifyPlugins/drizzleClient";
import type { CacheService } from "~/src/services/caching";
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
 * When a cache service is provided, DataLoaders use cache-first lookup strategy.
 *
 * @param db - The Drizzle client instance for database operations.
 * @param cache - Optional cache service for cache-first lookups. Pass null to disable caching.
 * @returns An object containing all DataLoaders.
 *
 * @example
 * ```typescript
 * const dataloaders = createDataloaders(drizzleClient, cacheService);
 * const user = await dataloaders.user.load(userId);
 * const organization = await dataloaders.organization.load(orgId);
 * ```
 */
export function createDataloaders(
	db: DrizzleClient,
	cache: CacheService | null,
): Dataloaders {
	return {
		user: createUserLoader(db, cache),
		organization: createOrganizationLoader(db, cache),
		event: createEventLoader(db, cache),
		actionItem: createActionItemLoader(db, cache),
	};
}

// Re-export types for convenience
export type { UserRow, OrganizationRow, EventRow, ActionItemRow };
