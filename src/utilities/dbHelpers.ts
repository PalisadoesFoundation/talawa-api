import { TalawaGraphQLError } from "./TalawaGraphQLError";

/**
 * Normalizes database query results to ensure a single row is returned or throws an error.
 * This helper ensures consistent behavior when dealing with database operations that may
 * return arrays, single objects, null, or undefined.
 *
 * @param rows - Database query result (array, single object, null, or undefined)
 * @param errorMessage - Optional custom error message
 * @returns The first row from the result, or throws if no row exists
 * @throws TalawaGraphQLError with code "unexpected" if no row is found
 *
 * @example
 * const rows = await db.insert(table).values({...}).returning();
 * const created = await firstOrThrow(rows, "Failed to create record");
 */
export function firstOrThrow<T>(
	rows: T[] | T | null | undefined,
	errorMessage = "Unexpected DB operation failure",
): T {
	const row = Array.isArray(rows) ? rows[0] : (rows as T | null | undefined);
	if (!row) {
		throw new TalawaGraphQLError({
			extensions: {
				code: "unexpected",
			},
			message: errorMessage,
		});
	}
	return row;
}
