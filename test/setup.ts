import { reset } from "drizzle-seed";
import type { GlobalSetupContext } from "vitest/node";
import * as schema from "~/src/drizzle/schema";
import { notificationEventBus } from "~/src/graphql/types/Notification/EventBus/eventBus";
import { stopEmailQueue } from "~/src/services/ses/emailServiceInstance";
import { ensureCommonNotificationTemplates } from "./helpers";
import { server } from "./server";
/**
 * Function that runs before all tests are ran. It re-runs each time one or more tests or javascript modules used within them are mutated in watch mode. More information at this link: {@link https://vitest.dev/config/#globalsetup}
 */
export const setup = async (_ctx: GlobalSetupContext) => {
	await server.ready();
	// Seed common notification templates to prevent lookup errors during tests
	await ensureCommonNotificationTemplates();
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
		// Clear all rate limiting buckets from Redis
		const keys = await server.redis.keys("rate-limit:*");
		if (keys.length > 0) {
			await server.redis.del(...keys);
			console.log(`Cleared ${keys.length} rate limit buckets from Redis`);
		}
	} catch (error) {
		console.warn("Redis cleanup failed:", error);
	}

	// Original cleanup
	await reset(server.drizzleClient, schema);
	await server.close();
};
