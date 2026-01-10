import Fastify from "fastify";
import fp from "fastify-plugin";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { EnvConfig } from "~/src/envConfigSchema";
import type { DrizzleClient } from "~/src/fastifyPlugins/drizzleClient";
import emailQueuePlugin from "~/src/fastifyPlugins/emailQueue";
import * as emailServiceInstance from "~/src/services/ses/emailServiceInstance";

vi.mock("~/src/services/ses/emailServiceInstance", () => ({
	initializeEmailQueue: vi.fn(),
	stopEmailQueue: vi.fn(),
}));

describe("emailQueue plugin coverage", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("initializes email queue and registers onClose hook when enabled", async () => {
		const fastify = Fastify({ logger: { level: "silent" } });

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
		expect(emailServiceInstance.initializeEmailQueue).toHaveBeenCalledTimes(1);
		expect(emailServiceInstance.initializeEmailQueue).toHaveBeenCalledWith({
			drizzleClient: fastify.drizzleClient,
			log: fastify.log,
			envConfig: fastify.envConfig,
		});

		// Trigger close to fire the hook
		await fastify.close();

		// Verify stop
		expect(emailServiceInstance.stopEmailQueue).toHaveBeenCalledTimes(1);
		expect(emailServiceInstance.stopEmailQueue).toHaveBeenCalledWith(
			fastify.log, // The logger instance
		);
	});

	it("does not initialize email queue when disabled", async () => {
		const fastify = Fastify({ logger: { level: "silent" } });

		// Decorate manually to simulate context
		fastify.decorate("envConfig", {
			API_ENABLE_EMAIL_QUEUE: false,
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

		// Verify NO initialization
		expect(emailServiceInstance.initializeEmailQueue).not.toHaveBeenCalled();

		// Trigger close
		await fastify.close();

		// Verify NO stop
		expect(emailServiceInstance.stopEmailQueue).not.toHaveBeenCalled();
	});
});
