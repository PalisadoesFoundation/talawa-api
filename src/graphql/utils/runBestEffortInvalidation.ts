import type { FastifyBaseLogger } from "fastify";

/**
 * Executes a list of cache invalidation promises and logs any failures using the provided logger.
 * This is a "best-effort" operation: it waits for all promises to settle and does not throw if any fail.
 *
 * @param promises - An array of promises returned by cache invalidation functions (e.g. invalidateEntity).
 * @param entity - The name of the entity being invalidated (e.g. "organization", "post").
 * @param logger - The logger instance (e.g. ctx.log) to record errors.
 * @returns {Promise<void>} Resolves after all invalidation promises have settled.
 */
export async function runBestEffortInvalidation(
	promises: Promise<unknown>[],
	entity: string,
	logger: FastifyBaseLogger,
): Promise<void> {
	const results = await Promise.allSettled(promises);

	for (let i = 0; i < results.length; i++) {
		const settled = results[i];
		if (settled && settled.status === "rejected") {
			logger.error(
				{ err: settled.reason, entity, opIndex: i },
				"Cache invalidation failed",
			);
		}
	}
}
