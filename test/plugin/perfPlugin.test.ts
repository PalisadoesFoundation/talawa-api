import Fastify, { type FastifyInstance } from "fastify";
import perfPlugin from "src/fastifyPlugins/performance";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { EnvConfig } from "~/src/envConfigSchema";
import type { CacheService } from "~/src/services/caching/CacheService";

/**
 * Mock CacheService for testing.
 */
class MockCacheService implements CacheService {
	store = new Map<string, unknown>();

	async get<T>(key: string): Promise<T | null> {
		return (this.store.get(key) as T) ?? null;
	}

	async set<T>(key: string, value: T, _ttlSeconds: number): Promise<void> {
		this.store.set(key, value);
	}

	async del(_keys: string | string[]): Promise<void> {
		// No-op for tests
	}

	async clearByPattern(_pattern: string): Promise<void> {
		// No-op for tests
	}

	async mget<T>(keys: string[]): Promise<(T | null)[]> {
		return keys.map((k) => (this.store.get(k) as T) ?? null);
	}

	async mset<T>(
		entries: Array<{ key: string; value: T; ttlSeconds: number }>,
	): Promise<void> {
		for (const entry of entries) {
			await this.set(entry.key, entry.value, entry.ttlSeconds);
		}
	}
}

/**
 * Creates a properly configured Fastify test app with required decorators.
 * Includes envConfig and cache decorators that performancePlugin depends on.
 */
function createTestApp(): FastifyInstance {
	const app = Fastify({ logger: true });

	// Add required decorators for performancePlugin
	const envConfig: Partial<EnvConfig> = {};
	app.decorate("envConfig", envConfig as EnvConfig);
	app.decorate("cache", new MockCacheService());

	return app;
}

describe("perfPlugin – slow request logging", () => {
	let warn: ReturnType<typeof vi.spyOn>;
	let app: ReturnType<typeof Fastify>;

	beforeEach(() => {
		app = createTestApp();

		// Set API key to prevent the "unprotected endpoint" warning from interfering with test assertions
		process.env.API_METRICS_API_KEY = "test-api-key-for-slow-request-tests";

		vi.spyOn(app.log, "child").mockReturnValue(app.log);
		warn = vi.spyOn(app.log, "warn");
	});

	afterEach(async () => {
		await app.close();
		delete process.env.API_SLOW_REQUEST_MS;
		delete process.env.API_METRICS_API_KEY;
	});

	it("logs a warning when request duration exceeds slow threshold", async () => {
		process.env.API_SLOW_REQUEST_MS = "10";

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
		process.env.API_SLOW_REQUEST_MS = "50";

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
