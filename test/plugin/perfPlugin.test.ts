import type { FastifyInstance } from "fastify";
import perfPlugin from "src/fastifyPlugins/performance";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createTestApp } from "../helpers/performanceTestUtils";

describe("perfPlugin – slow request logging", () => {
	let warn: ReturnType<typeof vi.spyOn>;
	let app: FastifyInstance;

	afterEach(async () => {
		if (app) {
			await app.close();
		}
	});

	it("logs a warning when request duration exceeds slow threshold", async () => {
		// Pass config via envConfig to avoid warning log about unprotected endpoint
		app = createTestApp({
			loggerEnabled: true,
			envConfig: {
				API_METRICS_SLOW_REQUEST_MS: 10,
				API_METRICS_API_KEY: "test-api-key-for-slow-request-tests",
			},
		});

		vi.spyOn(app.log, "child").mockReturnValue(app.log);
		warn = vi.spyOn(app.log, "warn");

		app.get("/slow", async () => {
			await new Promise((r) => setTimeout(r, 20));
			return { ok: true };
		});

		await app.register(perfPlugin);
		await app.ready();

		await app.inject({ method: "GET", url: "/slow" });

		expect(warn).toHaveBeenCalledTimes(1);
		expect(warn).toHaveBeenCalledWith(
			expect.objectContaining({
				msg: "Slow request",
				method: "GET",
				path: "/slow",
				slowThresholdMs: 10,
			}),
		);
	});

	it("does not log a warning for fast requests", async () => {
		app = createTestApp({
			loggerEnabled: true,
			envConfig: {
				API_METRICS_SLOW_REQUEST_MS: 50,
				API_METRICS_API_KEY: "test-api-key-for-slow-request-tests",
			},
		});

		vi.spyOn(app.log, "child").mockReturnValue(app.log);
		warn = vi.spyOn(app.log, "warn");

		app.get("/fast", async () => {
			await new Promise((r) => setTimeout(r, 5));
			return { ok: true };
		});

		await app.register(perfPlugin);
		await app.ready();

		await app.inject({ method: "GET", url: "/fast" });

		expect(warn).not.toHaveBeenCalled();
	});

	it("uses default threshold (500ms) when env is not set", async () => {
		app = createTestApp({
			loggerEnabled: true,
			envConfig: {
				API_METRICS_API_KEY: "test-api-key-for-slow-request-tests",
			},
		});

		vi.spyOn(app.log, "child").mockReturnValue(app.log);
		warn = vi.spyOn(app.log, "warn");

		app.get("/default", async () => {
			await new Promise((r) => setTimeout(r, 20));
			return { ok: true };
		});

		await app.register(perfPlugin);
		await app.ready();

		await app.inject({ method: "GET", url: "/default" });

		expect(warn).not.toHaveBeenCalled();
	});

	it("logs slow request when exceeding default 500ms threshold", async () => {
		app = createTestApp({
			loggerEnabled: true,
			envConfig: {
				API_METRICS_API_KEY: "test-api-key-for-slow-request-tests",
			},
		});

		vi.spyOn(app.log, "child").mockReturnValue(app.log);
		warn = vi.spyOn(app.log, "warn");

		app.get("/very-slow", async () => {
			await new Promise((r) => setTimeout(r, 520));
			return { ok: true };
		});

		await app.register(perfPlugin);
		await app.ready();

		await app.inject({ method: "GET", url: "/very-slow" });

		expect(warn).toHaveBeenCalledTimes(1);
		expect(warn).toHaveBeenCalledWith(
			expect.objectContaining({
				msg: "Slow request",
				method: "GET",
				path: "/very-slow",
				slowThresholdMs: 500,
			}),
		);
	});
});
