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
	// Clean up notification system
	try {
		stopEmailQueue();
		notificationEventBus.removeAllListeners();
		await new Promise((resolve) => setImmediate(resolve));
		console.log("Notification system cleaned up");
	} catch (error) {
		console.warn("Notification cleanup failed:", error);
	}

	// *** NEW: Clean up Redis rate limiting state ***
	try {
		// Check if Redis is available and connected before attempting cleanup
		if (server.redis && typeof server.redis.keys === "function") {
			// Add timeout to prevent hanging if Redis is unavailable
			const cleanupPromise = (async () => {
				const keys = await server.redis.keys("rate-limit:*");
				if (keys.length > 0) {
					await server.redis.del(...keys);
					console.log(`Cleared ${keys.length} rate limit buckets from Redis`);
				}
			})();

			// Wait max 2 seconds for Redis cleanup
			await Promise.race([
				cleanupPromise,
				new Promise((_, reject) =>
					setTimeout(() => reject(new Error("Redis cleanup timeout")), 2000),
				),
			]);
		}
	} catch (error) {
		// Silently ignore Redis cleanup errors - Redis might not be available
		console.warn(
			"Redis cleanup failed (this is OK if Redis is not running):",
			error,
		);
	}

	// Close Redis connection if available
	try {
		if (server.redis && typeof server.redis.quit === "function") {
			await Promise.race([
				server.redis.quit(),
				new Promise((_, reject) =>
					setTimeout(() => reject(new Error("Redis quit timeout")), 1000),
				),
			]);
		}
	} catch (error) {
		// Silently ignore - Redis might already be closed or unavailable
		console.warn("Redis connection close failed (this is OK):", error);
	}

	// Original cleanup
	try {
		await reset(server.drizzleClient, schema);
	} catch (error) {
		console.warn("Database reset failed:", error);
	}

	try {
		await server.close();
	} catch (error) {
		console.warn("Server close failed:", error);
	}
};
