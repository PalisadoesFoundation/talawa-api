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
	// Clean up notification system BEFORE database reset
	try {
		// Stop email background processing
		stopEmailQueue();

		// Clear all event listeners from singleton
		notificationEventBus.removeAllListeners();

		// Wait for any pending setImmediate callbacks to complete
		await new Promise((resolve) => setImmediate(resolve));

		console.log("✅ Notification system cleaned up");
	} catch (error) {
		console.warn("⚠️ Notification cleanup failed:", error);
	}

	// Original cleanup
	await reset(server.drizzleClient, schema);
	await server.close();
};
