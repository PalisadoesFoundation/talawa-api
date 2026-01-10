import type { FastifyInstance, FastifyPluginAsync } from "fastify";
import { describe, expect, it, type Mock, vi } from "vitest";
import emailQueuePlugin from "~/src/fastifyPlugins/emailQueue";
import * as emailServiceInstance from "~/src/services/ses/emailServiceInstance";

vi.mock("~/src/services/ses/emailServiceInstance", () => ({
	initializeEmailQueue: vi.fn(),
	stopEmailQueue: vi.fn(),
}));

describe("emailQueue plugin coverage", () => {
	it("initializes email queue and registers onClose hook", async () => {
		const fastify = {
			drizzleClient: {},
			log: {},
			envConfig: { API_ENABLE_EMAIL_QUEUE: true },
			addHook: vi.fn(),
		} as unknown as FastifyInstance;

		// The plugin is exported wrapped with fastify-plugin
		// We need to invoke the internal function.
		// fastify-plugin returns the original function with some metadata attached.
		// Checking the type of the export might be needed, usually it's the function itself.

		// Execute the plugin function
		await (emailQueuePlugin as unknown as FastifyPluginAsync)(fastify, {});

		// Verify initialization
		expect(emailServiceInstance.initializeEmailQueue).toHaveBeenCalledWith({
			drizzleClient: fastify.drizzleClient,
			log: fastify.log,
			envConfig: fastify.envConfig,
		});

		// Verify hook registration
		expect(fastify.addHook).toHaveBeenCalledWith(
			"onClose",
			expect.any(Function),
		);

		// Trigger the hook
		const hookCallback = (fastify.addHook as unknown as Mock).mock
			.calls[0]?.[1];
		if (!hookCallback) throw new Error("hookCallback not found");
		await hookCallback(fastify);

		// Verify stop
		expect(emailServiceInstance.stopEmailQueue).toHaveBeenCalledWith(
			fastify.log,
		);
	});
});
