import { z } from "zod";

/**
 * Core reusable Zod validators for consistent input validation across GraphQL and REST APIs.
 *
 * This module provides shared validation schemas that eliminate duplicated validation logic
 * and ensure consistency in handling common patterns like IDs, dates, pagination, etc.
 */

// ============================================================================
// Basic Scalars
// ============================================================================

/**
 * String schema that automatically trims whitespace.
 * Use as a base for other string validators to avoid hidden whitespace bugs.
 */
export const trimmedString = z.string().trim();

/**
 * Non-empty string after trimming whitespace.
 * Rejects strings that are empty or contain only whitespace.
 */
export const nonEmptyString = z.string().trim().min(1, "Must not be empty");

/**
 * Validated email address (trimmed).
 */
export const email = z.string().trim().email("Must be a valid email");

/**
 * Validated URL (trimmed).
 */
export const url = z.string().trim().url("Must be a valid URL");

/**
 * UUID v4 or v7 validator.
 * Ensures IDs are valid UUIDs.
 */
export const uuid = z.string().trim().uuid("Must be a valid UUID");

/**
 * ULID validator.
 * Ensures IDs follow the ULID format (26 uppercase alphanumeric characters).
 */
export const ulid = z
	.string()
	.trim()
	.regex(/^[0-9A-HJKMNP-TV-Z]{26}$/, "Must be a valid ULID");

// ============================================================================
// Date/Time Validators
// ============================================================================

/**
 * ISO date string in YYYY-MM-DD format.
 */
export const isoDateString = z
	.string()
	.trim()
	.pipe(z.iso.date({ error: "Invalid ISO date" }));

/**
 * ISO 8601 datetime string in UTC (with Z suffix).
 * Format: YYYY-MM-DDTHH:mm:ssZ (milliseconds optional)
 *
 * Uses `z.iso.datetime` internally, which accepts varying fractional-second precision.
 */
export const isoDateTimeString = z
	.string()
	.trim()
	.pipe(z.iso.datetime({ error: "Invalid ISO datetime" }));

/**
 * Coerce input to a Date object.
 * Accepts Date objects, timestamps, and ISO strings.
 */
export const coerceDate = z.coerce.date();

// ============================================================================
// ID Validators (Semantic)
// ============================================================================

/**
 * Generic GraphQL ID validator.
 * GraphQL ID is an opaque string - we just ensure it's non-empty.
 */
export const id = nonEmptyString;

/**
 * Organization UUID validator.
 * Use this for all organization ID fields to ensure consistency.
 */
export const orgId = uuid.describe("Organization UUID");

/**
 * User UUID validator.
 * Use this for all user ID fields to ensure consistency.
 */
export const userId = uuid.describe("User UUID");

/**
 * Event UUID validator.
 * Use this for all event ID fields to ensure consistency.
 */
export const eventId = uuid.describe("Event UUID");

/**
 * Post UUID validator.
 * Use this for all post ID fields to ensure consistency.
 */
export const postId = uuid.describe("Post UUID");

// ============================================================================
// Enums and Common Values
// ============================================================================

/**
 * Sort order enum for queries.
 */
export const sortOrder = z.enum(["asc", "desc"]);

/**
 * Post sorting options.
 */
export const postSort = z.enum(["NEW", "TOP"]);

// ============================================================================
// Pagination
// ============================================================================

/**
 * Unified pagination schema with sensible defaults and bounds.
 *
 * Defaults:
 * - limit: 20
 * - cursor: null
 *
 * Constraints:
 * - limit must be between 1 and 100 (inclusive)
 * - cursor is optional and nullable
 */
export const pagination = z.object({
	limit: z.coerce
		.number()
		.int("limit must be an integer")
		.min(1, "limit must be >= 1")
		.max(100, "limit must be <= 100")
		.default(20),
	cursor: z
		.string()
		.trim()
		.nullish()
		.transform((v) => v ?? null),
});

/**
 * TypeScript type inferred from the pagination schema.
 */
export type Pagination = z.infer<typeof pagination>;

// ============================================================================
// Common Input Shapes
// ============================================================================

/**
 * Common pattern for queries/mutations that accept an organization ID.
 */
export const organizationIdArg = z.object({ id: orgId });

/**
 * Common pattern for queries/mutations that accept a user ID.
 */
export const userIdArg = z.object({ id: userId });

/**
 * Common pattern for queries/mutations that accept an event ID.
 */
export const eventIdArg = z.object({ id: eventId });

/**
 * Common pattern for queries/mutations that accept a post ID.
 */
export const postIdArg = z.object({ id: postId });
