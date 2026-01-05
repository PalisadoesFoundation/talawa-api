import { testEnvConfig } from "test/envConfigSchema";
import { describe, expect, it } from "vitest";
import { createServer } from "~/src/createServer";

describe("Server-Timing header", () => {
	it("includes db, cache, total", async () => {
		const app = await createServer({
			envConfig: {
				API_POSTGRES_HOST: testEnvConfig.API_POSTGRES_TEST_HOST,
				API_REDIS_HOST: testEnvConfig.API_REDIS_TEST_HOST,
				API_MINIO_END_POINT: testEnvConfig.API_MINIO_TEST_END_POINT,
			},
		});

		// Create a simple test route
		app.get("/test-timing", async () => ({ ok: true }));

		const res = await app.inject({ method: "GET", url: "/test-timing" });

		const st = res.headers["server-timing"] as string;

		// Verify Server-Timing header exists and has correct format
		expect(st).toBeDefined();
		expect(st).toMatch(/db;dur=\d+/);
		expect(st).toMatch(/cache;desc="hit:\d+\|miss:\d+"/);
		expect(st).toMatch(/total;dur=\d+/);
	});

	it("includes metrics on GraphQL requests", async () => {
		const app = await createServer({
			envConfig: {
				API_POSTGRES_HOST: testEnvConfig.API_POSTGRES_TEST_HOST,
				API_REDIS_HOST: testEnvConfig.API_REDIS_TEST_HOST,
				API_MINIO_END_POINT: testEnvConfig.API_MINIO_TEST_END_POINT,
			},
		});

		const res = await app.inject({
			method: "POST",
			url: "/graphql",
			payload: {
				query: "{ __typename }",
			},
		});

		const st = res.headers["server-timing"] as string;

		// Verify Server-Timing header exists on GraphQL endpoint
		expect(st).toBeDefined();
		expect(st).toMatch(/db;dur=\d+/);
		expect(st).toMatch(/cache;desc="hit:\d+\|miss:\d+"/);
		expect(st).toMatch(/total;dur=\d+/);
	});

	it("includes metrics on /metrics/perf endpoint", async () => {
		const app = await createServer({
			envConfig: {
				API_POSTGRES_HOST: testEnvConfig.API_POSTGRES_TEST_HOST,
				API_REDIS_HOST: testEnvConfig.API_REDIS_TEST_HOST,
				API_MINIO_END_POINT: testEnvConfig.API_MINIO_TEST_END_POINT,
			},
		});

		const res = await app.inject({
			method: "GET",
			url: "/metrics/perf",
		});

		const st = res.headers["server-timing"] as string;

		// Verify Server-Timing header exists even on the metrics endpoint itself
		expect(st).toBeDefined();
		expect(st).toMatch(/db;dur=\d+/);
		expect(st).toMatch(/cache;desc="hit:\d+\|miss:\d+"/);
		expect(st).toMatch(/total;dur=\d+/);

		// Verify response body contains recent snapshots
		expect(res.statusCode).toBe(200);
		const body = JSON.parse(res.body);
		expect(body).toHaveProperty("recent");
		expect(Array.isArray(body.recent)).toBe(true);
	});

	it("/metrics/perf returns performance snapshots", async () => {
		const app = await createServer({
			envConfig: {
				API_POSTGRES_HOST: testEnvConfig.API_POSTGRES_TEST_HOST,
				API_REDIS_HOST: testEnvConfig.API_REDIS_TEST_HOST,
				API_MINIO_END_POINT: testEnvConfig.API_MINIO_TEST_END_POINT,
			},
		});

		// Make a few requests to populate snapshots
		app.get("/test-perf-1", async () => ({ ok: true }));
		await app.inject({ method: "GET", url: "/test-perf-1" });
		await app.inject({ method: "GET", url: "/test-perf-1" });

		// Request metrics
		const res = await app.inject({
			method: "GET",
			url: "/metrics/perf",
		});

		expect(res.statusCode).toBe(200);

		const body = JSON.parse(res.body);

		expect(body).toHaveProperty("recent");
		expect(Array.isArray(body.recent)).toBe(true);

		// Should have at least the 2 test requests (plus the metrics request itself)
		expect(body.recent.length).toBeGreaterThanOrEqual(2);

		// Verify snapshot structure
		if (body.recent.length > 0) {
			const snapshot = body.recent[0];
			expect(snapshot).toHaveProperty("totalMs");
			expect(snapshot).toHaveProperty("cacheHits");
			expect(snapshot).toHaveProperty("cacheMisses");
			expect(snapshot).toHaveProperty("ops");
			expect(typeof snapshot.totalMs).toBe("number");
			expect(typeof snapshot.cacheHits).toBe("number");
			expect(typeof snapshot.cacheMisses).toBe("number");
			expect(typeof snapshot.ops).toBe("object");
		}
	});

	it("/metrics/perf limits returned snapshots to 50", async () => {
		const app = await createServer({
			envConfig: {
				API_POSTGRES_HOST: testEnvConfig.API_POSTGRES_TEST_HOST,
				API_REDIS_HOST: testEnvConfig.API_REDIS_TEST_HOST,
				API_MINIO_END_POINT: testEnvConfig.API_MINIO_TEST_END_POINT,
			},
		});

		// Create a test route
		app.get("/test-many", async () => ({ ok: true }));

		// Make 60 requests to exceed the 50 snapshot limit
		for (let i = 0; i < 60; i++) {
			await app.inject({ method: "GET", url: "/test-many" });
		}

		// Request metrics
		const res = await app.inject({
			method: "GET",
			url: "/metrics/perf",
		});

		const body = JSON.parse(res.body);

		// Should return at most 50 snapshots
		expect(body.recent.length).toBeLessThanOrEqual(50);
	});

	it("Server-Timing header has reasonable total duration", async () => {
		const app = await createServer({
			envConfig: {
				API_POSTGRES_HOST: testEnvConfig.API_POSTGRES_TEST_HOST,
				API_REDIS_HOST: testEnvConfig.API_REDIS_TEST_HOST,
				API_MINIO_END_POINT: testEnvConfig.API_MINIO_TEST_END_POINT,
			},
		});

		app.get("/test-duration", async () => {
			// Simulate some work
			await new Promise((resolve) => setTimeout(resolve, 10));
			return { ok: true };
		});

		const res = await app.inject({ method: "GET", url: "/test-duration" });

		const st = res.headers["server-timing"] as string;

		// Extract total duration from header
		const totalMatch = st.match(/total;dur=(\d+)/);
		expect(totalMatch).not.toBeNull();

		if (totalMatch?.[1]) {
			const totalDur = Number.parseInt(totalMatch[1], 10);
			// Should be at least 10ms due to our delay
			expect(totalDur).toBeGreaterThanOrEqual(10);
		}
	});

	describe("/metrics/perf authentication", () => {
		it("should allow access without auth when no API key or IPs configured", async () => {
			const app = await createServer({
				envConfig: {
					API_POSTGRES_HOST: testEnvConfig.API_POSTGRES_TEST_HOST,
					API_REDIS_HOST: testEnvConfig.API_REDIS_TEST_HOST,
					API_MINIO_END_POINT: testEnvConfig.API_MINIO_TEST_END_POINT,
					METRICS_API_KEY: undefined,
					METRICS_ALLOWED_IPS: undefined,
				},
			});

			const res = await app.inject({
				method: "GET",
				url: "/metrics/perf",
			});

			expect(res.statusCode).toBe(200);
		});

		it("should require API key when METRICS_API_KEY is set", async () => {
			const app = await createServer({
				envConfig: {
					API_POSTGRES_HOST: testEnvConfig.API_POSTGRES_TEST_HOST,
					API_REDIS_HOST: testEnvConfig.API_REDIS_TEST_HOST,
					API_MINIO_END_POINT: testEnvConfig.API_MINIO_TEST_END_POINT,
					METRICS_API_KEY: "test-api-key-123",
					METRICS_ALLOWED_IPS: undefined,
				},
			});

			const res = await app.inject({
				method: "GET",
				url: "/metrics/perf",
			});

			expect(res.statusCode).toBe(401);
			const body = JSON.parse(res.body);
			expect(body.error).toBe("Unauthorized");
			expect(body.message).toBe("Missing Authorization header");
		});

		it("should accept valid API key in Authorization header", async () => {
			const app = await createServer({
				envConfig: {
					API_POSTGRES_HOST: testEnvConfig.API_POSTGRES_TEST_HOST,
					API_REDIS_HOST: testEnvConfig.API_REDIS_TEST_HOST,
					API_MINIO_END_POINT: testEnvConfig.API_MINIO_TEST_END_POINT,
					METRICS_API_KEY: "test-api-key-123",
					METRICS_ALLOWED_IPS: undefined,
				},
			});

			const res = await app.inject({
				method: "GET",
				url: "/metrics/perf",
				headers: {
					authorization: "test-api-key-123",
				},
			});

			expect(res.statusCode).toBe(200);
		});

		it("should accept valid API key in Bearer format", async () => {
			const app = await createServer({
				envConfig: {
					API_POSTGRES_HOST: testEnvConfig.API_POSTGRES_TEST_HOST,
					API_REDIS_HOST: testEnvConfig.API_REDIS_TEST_HOST,
					API_MINIO_END_POINT: testEnvConfig.API_MINIO_TEST_END_POINT,
					METRICS_API_KEY: "test-api-key-123",
					METRICS_ALLOWED_IPS: undefined,
				},
			});

			const res = await app.inject({
				method: "GET",
				url: "/metrics/perf",
				headers: {
					authorization: "Bearer test-api-key-123",
				},
			});

			expect(res.statusCode).toBe(200);
		});

		it("should reject invalid API key", async () => {
			const app = await createServer({
				envConfig: {
					API_POSTGRES_HOST: testEnvConfig.API_POSTGRES_TEST_HOST,
					API_REDIS_HOST: testEnvConfig.API_REDIS_TEST_HOST,
					API_MINIO_END_POINT: testEnvConfig.API_MINIO_TEST_END_POINT,
					METRICS_API_KEY: "test-api-key-123",
					METRICS_ALLOWED_IPS: undefined,
				},
			});

			const res = await app.inject({
				method: "GET",
				url: "/metrics/perf",
				headers: {
					authorization: "wrong-key",
				},
			});

			expect(res.statusCode).toBe(403);
			const body = JSON.parse(res.body);
			expect(body.error).toBe("Forbidden");
			expect(body.message).toBe("Invalid API key");
		});

		it("should allow access from allowed IP", async () => {
			const app = await createServer({
				envConfig: {
					API_POSTGRES_HOST: testEnvConfig.API_POSTGRES_TEST_HOST,
					API_REDIS_HOST: testEnvConfig.API_REDIS_TEST_HOST,
					API_MINIO_END_POINT: testEnvConfig.API_MINIO_TEST_END_POINT,
					METRICS_API_KEY: undefined,
					METRICS_ALLOWED_IPS: "127.0.0.1",
				},
			});

			const res = await app.inject({
				method: "GET",
				url: "/metrics/perf",
			});

			expect(res.statusCode).toBe(200);
		});

		it("should allow access from IP in CIDR range", async () => {
			const app = await createServer({
				envConfig: {
					API_POSTGRES_HOST: testEnvConfig.API_POSTGRES_TEST_HOST,
					API_REDIS_HOST: testEnvConfig.API_REDIS_TEST_HOST,
					API_MINIO_END_POINT: testEnvConfig.API_MINIO_TEST_END_POINT,
					METRICS_API_KEY: undefined,
					METRICS_ALLOWED_IPS: "127.0.0.0/8",
				},
			});

			const res = await app.inject({
				method: "GET",
				url: "/metrics/perf",
			});

			expect(res.statusCode).toBe(200);
		});

		it("should reject access from IP not in allowed list", async () => {
			const app = await createServer({
				envConfig: {
					API_POSTGRES_HOST: testEnvConfig.API_POSTGRES_TEST_HOST,
					API_REDIS_HOST: testEnvConfig.API_REDIS_TEST_HOST,
					API_MINIO_END_POINT: testEnvConfig.API_MINIO_TEST_END_POINT,
					METRICS_API_KEY: undefined,
					METRICS_ALLOWED_IPS: "192.168.1.1",
				},
			});

			const res = await app.inject({
				method: "GET",
				url: "/metrics/perf",
			});

			expect(res.statusCode).toBe(403);
			const body = JSON.parse(res.body);
			expect(body.error).toBe("Forbidden");
		});

		it("should allow access when IP matches one of multiple allowed IPs", async () => {
			const app = await createServer({
				envConfig: {
					API_POSTGRES_HOST: testEnvConfig.API_POSTGRES_TEST_HOST,
					API_REDIS_HOST: testEnvConfig.API_REDIS_TEST_HOST,
					API_MINIO_END_POINT: testEnvConfig.API_MINIO_TEST_END_POINT,
					METRICS_API_KEY: undefined,
					METRICS_ALLOWED_IPS: "192.168.1.1,127.0.0.1,10.0.0.1",
				},
			});

			const res = await app.inject({
				method: "GET",
				url: "/metrics/perf",
			});

			expect(res.statusCode).toBe(200);
		});

		it("should prioritize IP check over API key when both are configured", async () => {
			const app = await createServer({
				envConfig: {
					API_POSTGRES_HOST: testEnvConfig.API_POSTGRES_TEST_HOST,
					API_REDIS_HOST: testEnvConfig.API_REDIS_TEST_HOST,
					API_MINIO_END_POINT: testEnvConfig.API_MINIO_TEST_END_POINT,
					METRICS_API_KEY: "test-api-key-123",
					METRICS_ALLOWED_IPS: "127.0.0.1",
				},
			});

			// Should allow access from allowed IP without API key
			const res = await app.inject({
				method: "GET",
				url: "/metrics/perf",
			});

			expect(res.statusCode).toBe(200);
		});
	});
});
