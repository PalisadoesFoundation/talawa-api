import { reset } from "drizzle-seed";
import type { GlobalSetupContext } from "vitest/node";
import * as schema from "~/src/drizzle/schema";
import { notificationEventBus } from "~/src/graphql/types/Notification/EventBus/eventBus";
import { stopEmailQueue } from "~/src/services/ses/emailServiceInstance";
import { server } from "./server";
/**
 * Function that runs before all tests are ran. It re-runs each time one or more tests or javascript modules used within them are mutated in watch mode. More information at this link: {@link https://vitest.dev/config/#globalsetup}
 */
export const setup = async (_ctx: GlobalSetupContext) => {
	await server.ready();
};

/**
 * Function that runs after all tests are ran. It re-runs each time one or more tests or javascript modules used within them are mutated in watch mode. More information at this link: {@link https://vitest.dev/config/#globalsetup}
 */
export const teardown = async () => {
	// Wrap entire teardown in try-catch to prevent any unhandled errors from causing process exit
	try {
		// Clean up notification system
		try {
			stopEmailQueue();
			notificationEventBus.removeAllListeners();
			await new Promise((resolve) => setImmediate(resolve));
			console.log("Notification system cleaned up");
		} catch (error) {
			console.warn("Notification cleanup failed:", error);
		}

		// Clean up Redis rate limiting state
		// Note: We do this BEFORE closing the server to avoid connection state issues
		try {
			// Check if Redis is available and connected before attempting cleanup
			// Check connection status: 'ready', 'connect', 'connecting' are valid states
			// 'end', 'close', 'closing' mean connection is already closed
			if (
				server.redis &&
				typeof server.redis.keys === "function" &&
				server.redis.status &&
				!["end", "close", "closing"].includes(server.redis.status)
			) {
				// Add timeout to prevent hanging if Redis is unavailable
				const cleanupPromise = (async () => {
					try {
						const keys = await server.redis.keys("rate-limit:*");
						if (keys.length > 0) {
							await server.redis.del(...keys);
							console.log(
								`Cleared ${keys.length} rate limit buckets from Redis`,
							);
						}
					} catch (_err) {
						// Ignore errors during key cleanup - connection might close during operation
					}
				})();

				// Wait max 2 seconds for Redis cleanup
				await Promise.race([
					cleanupPromise,
					new Promise((_, reject) =>
						setTimeout(() => reject(new Error("Redis cleanup timeout")), 2000),
					),
				]).catch(() => {
					// Ignore timeout errors
				});
			}
		} catch (error) {
			// Silently ignore Redis cleanup errors - Redis might not be available
			console.warn(
				"Redis cleanup failed (this is OK if Redis is not running):",
				error,
			);
		}

		// Original cleanup
		try {
			await reset(server.drizzleClient, schema);
		} catch (error) {
			console.warn("Database reset failed:", error);
		}

		// Close server (this will handle Redis cleanup through @fastify/redis plugin's onClose hook)
		// Use a more robust approach to handle Redis connection state and prevent errors from causing process exit
		try {
			// Check Redis connection status before closing
			const redisStatus = server.redis?.status;
			const isRedisClosed =
				redisStatus && ["end", "close", "closing"].includes(redisStatus);

			// If Redis is already closed, temporarily remove it to prevent @fastify/redis from trying to close it
			if (isRedisClosed && server.redis) {
				const originalRedis = server.redis;
				delete (server as { redis?: unknown }).redis;
				try {
					await server.close();
				} catch (_error) {
					// Silently ignore any errors during server close when Redis is already closed
					// Don't log to avoid noise in test output
				} finally {
					// Restore redis reference (though it's already closed)
					(server as { redis?: unknown }).redis = originalRedis;
				}
			} else {
				// Redis is still open, let server.close() handle it normally
				// Use a timeout to prevent hanging, and catch all errors
				const closePromise = server.close();
				const timeoutPromise = new Promise<void>((_, reject) =>
					setTimeout(() => reject(new Error("Server close timeout")), 5000),
				);

				await Promise.race([closePromise, timeoutPromise]).catch((error) => {
					// Completely suppress Redis "Connection is closed" errors - these are expected
					// during teardown when Redis connection state is inconsistent
					if (
						error instanceof Error &&
						(error.message.includes("Connection is closed") ||
							error.message.includes("connection is closed") ||
							error.message.includes("Server close timeout"))
					) {
						// Silently ignore - this is a cleanup issue, not a test failure
						return;
					}
					// Only log truly unexpected errors (but don't throw to prevent process exit)
					if (
						error instanceof Error &&
						!error.message.includes("Connection is closed") &&
						!error.message.includes("connection is closed")
					) {
						console.warn("Server close failed:", error);
					}
				});
			}
		} catch (error) {
			// Catch any errors from the server.close() logic itself
			// Completely suppress Redis connection errors to prevent process exit
			if (
				error instanceof Error &&
				(error.message.includes("Connection is closed") ||
					error.message.includes("connection is closed"))
			) {
				// Silently ignore Redis connection errors - don't log or throw
			} else {
				// Only log non-Redis errors for debugging
				console.warn("Server teardown error:", error);
			}
		}
	} catch (error) {
		// Final catch-all to prevent any unhandled errors from causing process exit
		console.warn("Unexpected error during teardown:", error);
	}
};
