import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

/**
 * Normalize DB returning() / select results to a single object or throw a TalawaGraphQLError.
 * - rows can be T[] | T | null | undefined depending on driver/ORM.
 * - On empty result, throws a TalawaGraphQLError with an extensions.code you can assert in tests.
 */
export function firstOrThrow<T>(
	rows: T[] | T | null | undefined,
	message = "Unexpected DB operation failure",
	code: "unexpected" = "unexpected",
): T {
	const row = Array.isArray(rows) ? rows[0] : rows;
	if (!row) {
		throw new TalawaGraphQLError({
			message,
			extensions: {
				code,
			},
		});
	}
	return row as T;
}

