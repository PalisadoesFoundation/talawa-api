import Fastify from "fastify";
import fp from "fastify-plugin";
import { describe, expect, it, vi } from "vitest";
import type { EnvConfig } from "~/src/envConfigSchema";
import type { DrizzleClient } from "~/src/fastifyPlugins/drizzleClient";
import emailQueuePlugin from "~/src/fastifyPlugins/emailQueue";
import * as emailServiceInstance from "~/src/services/ses/emailServiceInstance";

vi.mock("~/src/services/ses/emailServiceInstance", () => ({
	initializeEmailQueue: vi.fn(),
	stopEmailQueue: vi.fn(),
}));

describe("emailQueue plugin coverage", () => {
	it("initializes email queue and registers onClose hook", async () => {
		const fastify = Fastify();

		// Decorate manually to simulate context
		fastify.decorate("envConfig", {
			API_ENABLE_EMAIL_QUEUE: true,
		} as unknown as EnvConfig);

		// Register a fake drizzle plugin to satisfy dependency check
		await fastify.register(
			fp(
				async (f) => {
					f.decorate("drizzleClient", {} as unknown as DrizzleClient);
				},
				{ name: "drizzleClient" },
			),
		);

		// Register plugin
		await fastify.register(emailQueuePlugin);
		await fastify.ready();

		// Verify initialization
		expect(emailServiceInstance.initializeEmailQueue).toHaveBeenCalledWith({
			drizzleClient: fastify.drizzleClient,
			log: fastify.log,
			envConfig: fastify.envConfig,
		});

		// Trigger close to fire the hook
		await fastify.close();

		// Verify stop
		expect(emailServiceInstance.stopEmailQueue).toHaveBeenCalledWith(
			expect.anything(), // The logger instance
		);
	});
});
