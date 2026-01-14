import Fastify from "fastify";
import type { EnvConfig } from "src/envConfigSchema";
import perfPlugin from "src/fastifyPlugins/performance";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Minimal envConfig interface for performance plugin tests.
 * Contains only the properties that the performance plugin actually accesses.
 * The plugin uses optional chaining, so other properties are not required.
 */
interface PerformancePluginTestEnvConfig {
	METRICS_SNAPSHOT_RETENTION_COUNT: number;
	API_SLOW_REQUEST_MS: number;
}

/**
 * Factory function that creates a fresh test envConfig for each test.
 * This prevents test pollution when tests modify config values.
 * The plugin only accesses METRICS_SNAPSHOT_RETENTION_COUNT and API_SLOW_REQUEST_MS,
 * both with optional chaining and default values, so this minimal config is sufficient.
 */
const createTestEnvConfig = (): PerformancePluginTestEnvConfig => ({
	METRICS_SNAPSHOT_RETENTION_COUNT: 1000,
	API_SLOW_REQUEST_MS: 500,
});

describe("perfPlugin – slow request logging", () => {
	let warn: ReturnType<typeof vi.spyOn>;
	let app: ReturnType<typeof Fastify>;

	beforeEach(() => {
		app = Fastify({ logger: true });

		// Decorate envConfig before registering the performance plugin
		// The plugin depends on envConfig for configuration values
		// Using a type-safe minimal mock that includes only the properties the plugin accesses
		// The plugin uses optional chaining (app.envConfig?.PROPERTY), so this is safe
		// Using a factory function ensures each test gets a fresh config object
		const testEnvConfig = createTestEnvConfig();
		app.decorate("envConfig", testEnvConfig as unknown as EnvConfig);

		vi.spyOn(app.log, "child").mockReturnValue(app.log);
		warn = vi.spyOn(app.log, "warn");
	});

	afterEach(async () => {
		await app.close();
	});

	it("logs a warning when request duration exceeds slow threshold", async () => {
		// Update envConfig with test value
		app.envConfig.API_SLOW_REQUEST_MS = 10;

		await app.register(perfPlugin);

		app.get("/slow", async () => {
			await new Promise((r) => setTimeout(r, 20));
			return { ok: true };
		});

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
		// Update envConfig with test value
		app.envConfig.API_SLOW_REQUEST_MS = 50;

		await app.register(perfPlugin);

		app.get("/fast", async () => {
			await new Promise((r) => setTimeout(r, 5));
			return { ok: true };
		});

		await app.inject({ method: "GET", url: "/fast" });

		expect(warn).not.toHaveBeenCalled();
	});

	it("uses default threshold (500ms) when env is not set", async () => {
		await app.register(perfPlugin);

		app.get("/default", async () => {
			await new Promise((r) => setTimeout(r, 20));
			return { ok: true };
		});

		await app.inject({ method: "GET", url: "/default" });

		expect(warn).not.toHaveBeenCalled();
	});

	it("logs slow request when exceeding default 500ms threshold", async () => {
		await app.register(perfPlugin);

		app.get("/very-slow", async () => {
			await new Promise((r) => setTimeout(r, 520));
			return { ok: true };
		});

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
