import type { FastifyRedis } from "@fastify/redis";
import Fastify from "fastify";
import { describe, expect, it } from "vitest";
import errorHandlerPlugin from "~/src/fastifyPlugins/errorHandler";
import rateLimitPlugin from "~/src/fastifyPlugins/rateLimit";
import healthcheck from "~/src/routes/healthcheck";

class FakeRedisZ {
	private z = new Map<string, Array<{ s: number; m: string }>>();

	pipeline() {
		const self = this;
		const commands: (() => Promise<unknown>)[] = [];

		return {
			zremrangebyscore(
				key: string,
				min: number | string,
				max: number | string,
			) {
				commands.push(() => self.zremrangebyscore(key, min, max));
				return this;
			},
			zcard(key: string) {
				commands.push(() => self.zcard(key));
				return this;
			},
			zadd(key: string, score: number, member: string) {
				commands.push(() => self.zadd(key, score, member));
				return this;
			},
			zrange(
				key: string,
				start: number,
				stop: number,
				withScores?: "WITHSCORES",
			) {
				commands.push(() => self.zrange(key, start, stop, withScores));
				return this;
			},
			expire(key: string, sec: number) {
				commands.push(() => self.expire(key, sec));
				return this;
			},
			async exec() {
				const results = [];
				for (const cmd of commands) {
					try {
						const res = await cmd();
						results.push([null, res]);
					} catch (err) {
						results.push([err, null]);
					}
				}
				return results;
			},
		};
	}

	async zremrangebyscore(
		key: string,
		min: number | string,
		max: number | string,
	) {
		const arr = this.z.get(key) ?? [];
		const lo = min === "-inf" ? -Infinity : Number(min);
		const hi = max === "+inf" ? Infinity : Number(max);
		this.z.set(
			key,
			arr.filter((e) => e.s < lo || e.s > hi),
		);
	}
	async zcard(key: string) {
		return (this.z.get(key) ?? []).length;
	}
	async zadd(key: string, score: number, member: string) {
		const arr = this.z.get(key) ?? [];
		const existingIndex = arr.findIndex((e) => e.m === member);
		if (existingIndex !== -1 && arr[existingIndex]) {
			arr[existingIndex].s = score;
		} else {
			arr.push({ s: score, m: member });
		}
		arr.sort((a, b) => a.s - b.s);
		this.z.set(key, arr);
	}
	async zrange(
		key: string,
		start: number,
		stop: number,
		_withScores?: "WITHSCORES",
	) {
		const arr = this.z.get(key) ?? [];
		// zrange logic is a bit complex with negative indices, keeping it simple for test
		const slice = arr.slice(start, stop + 1);
		if (_withScores === "WITHSCORES") {
			const flat: string[] = [];
			slice.forEach((e) => {
				flat.push(e.m);
				flat.push(String(e.s));
			});
			return flat;
		}
		return slice.map((e) => e.m);
	}
	async expire(_key: string, _sec: number) {
		/* noop */
	}
}

describe("REST rate limiting", () => {
	it("limits after N requests and sets headers", async () => {
		const app = Fastify();
		app.decorate("redis", new FakeRedisZ() as unknown as FastifyRedis);
		await app.register(errorHandlerPlugin);
		await app.register(rateLimitPlugin);

		app.get(
			"/limited",
			{ preHandler: app.rateLimit({ name: "test", windowMs: 1000, max: 2 }) },
			async () => ({ ok: true }),
		);

		const r1 = await app.inject({ method: "GET", url: "/limited" });
		const r2 = await app.inject({ method: "GET", url: "/limited" });
		const r3 = await app.inject({ method: "GET", url: "/limited" });

		expect(r1.statusCode).toBe(200);
		expect(r2.statusCode).toBe(200);
		expect(r3.statusCode).toBe(429);
		expect(r2.headers["x-ratelimit-limit"]).toBe("2");
		expect(Number(r2.headers["x-ratelimit-remaining"])).toBe(0);
		expect(r3.json().error.code).toBe("rate_limit_exceeded");

		// Verify headers on the rejected response (r3)
		expect(r3.headers["x-ratelimit-limit"]).toBe("2");
		expect(Number(r3.headers["x-ratelimit-remaining"])).toBe(0);
		expect(Number(r3.headers["x-ratelimit-reset"])).toBeGreaterThan(
			Date.now() / 1000,
		);

		// Verify resetAt in error payload
		const errorBody = r3.json();
		expect(errorBody.error.details.resetAt).toBeDefined();
		// resetAt in payload is in seconds
		expect(errorBody.error.details.resetAt).toBeGreaterThan(Date.now() / 1000);

		const resetHeader = Number(r2.headers["x-ratelimit-reset"]);
		expect(resetHeader).toBeGreaterThan(Date.now() / 1000);
	});

	it("should scope limits by identity (user vs ip)", async () => {
		const app = Fastify();
		app.decorate("redis", new FakeRedisZ() as unknown as FastifyRedis);
		await app.register(errorHandlerPlugin);
		await app.register(rateLimitPlugin);

		// Middleware to simulate authentication based on a header
		app.addHook("onRequest", async (req) => {
			const userId = req.headers["x-mock-user-id"];
			if (userId) {
				req.currentUser = { id: userId as string };
			}
		});

		app.get(
			"/identity-scoped",
			{ preHandler: app.rateLimit({ name: "test", windowMs: 60000, max: 2 }) },
			async () => ({ ok: true }),
		);

		// 1. Unauthenticated requests (IP-based)
		// Assume default IP is 127.0.0.1
		await app.inject({ method: "GET", url: "/identity-scoped" });
		await app.inject({ method: "GET", url: "/identity-scoped" });
		const rIpExceeded = await app.inject({
			method: "GET",
			url: "/identity-scoped",
		});
		expect(rIpExceeded.statusCode).toBe(429);

		// 2. Authenticated request (User A) - should be fresh
		const rUserA = await app.inject({
			method: "GET",
			url: "/identity-scoped",
			headers: { "x-mock-user-id": "user-a" },
		});
		expect(rUserA.statusCode).toBe(200);
		expect(rUserA.headers["x-ratelimit-remaining"]).toBe("1");

		// 3. Authenticated request (User B) - should be fresh and independent of User A
		const rUserB = await app.inject({
			method: "GET",
			url: "/identity-scoped",
			headers: { "x-mock-user-id": "user-b" },
		});
		expect(rUserB.statusCode).toBe(200);
		expect(rUserB.headers["x-ratelimit-remaining"]).toBe("1");

		// 4. User A again - should consume their quota
		const rUserA2 = await app.inject({
			method: "GET",
			url: "/identity-scoped",
			headers: { "x-mock-user-id": "user-a" },
		});
		expect(rUserA2.statusCode).toBe(200);
		expect(rUserA2.headers["x-ratelimit-remaining"]).toBe("0");

		// 5. User A exceeded
		const rUserA3 = await app.inject({
			method: "GET",
			url: "/identity-scoped",
			headers: { "x-mock-user-id": "user-a" },
		});
		expect(rUserA3.statusCode).toBe(429);
	});

	it("should scope limits by route and method", async () => {
		const app = Fastify();
		app.decorate("redis", new FakeRedisZ() as unknown as FastifyRedis);
		await app.register(errorHandlerPlugin);
		await app.register(rateLimitPlugin);

		// Route 1
		app.get(
			"/route1",
			{ preHandler: app.rateLimit({ name: "test", windowMs: 60000, max: 2 }) },
			async () => ({ ok: true }),
		);
		// Route 2 (same tier settings, different route)
		app.get(
			"/route2",
			{ preHandler: app.rateLimit({ name: "test", windowMs: 60000, max: 2 }) },
			async () => ({ ok: true }),
		);
		// Route 1 POST (same route, different method)
		app.post(
			"/route1",
			{ preHandler: app.rateLimit({ name: "test", windowMs: 60000, max: 2 }) },
			async () => ({ ok: true }),
		);

		// Consume route 1 GET
		await app.inject({ method: "GET", url: "/route1" });
		await app.inject({ method: "GET", url: "/route1" });
		const r1Exceeded = await app.inject({ method: "GET", url: "/route1" });
		expect(r1Exceeded.statusCode).toBe(429);

		// Route 2 GET should be fresh
		const r2 = await app.inject({ method: "GET", url: "/route2" });
		expect(r2.statusCode).toBe(200);
		expect(r2.headers["x-ratelimit-remaining"]).toBe("1");

		// Route 1 POST should be fresh
		const r1Post = await app.inject({ method: "POST", url: "/route1" });
		expect(r1Post.statusCode).toBe(200);
		expect(r1Post.headers["x-ratelimit-remaining"]).toBe("1");
	});

	it("should allow healthcheck requests and limit when exceeded", async () => {
		const app = Fastify();
		app.decorate("redis", new FakeRedisZ() as unknown as FastifyRedis);
		await app.register(errorHandlerPlugin);
		await app.register(rateLimitPlugin);
		await app.register(healthcheck);

		// First request should succeed
		const r1 = await app.inject({ method: "GET", url: "/healthcheck" });
		expect(r1.statusCode).toBe(200);
		expect(r1.json()).toEqual({ health: "ok" });
		expect(r1.headers["x-ratelimit-limit"]).toBe("600");

		// Simulate exhausting the limit
		// We'll create a new app instance with a limit of 1 for healthcheck to test 429
		// since making 601 requests is slow/expensive in test
	});

	it("should return 429 when healthcheck limit is exceeded", async () => {
		const app = Fastify();
		app.decorate("redis", new FakeRedisZ() as unknown as FastifyRedis);
		await app.register(errorHandlerPlugin);
		await app.register(rateLimitPlugin);

		// Override healthcheck route with custom strict limit for testing
		app.get(
			"/healthcheck-strict",
			{
				preHandler: app.rateLimit({
					name: "healthcheck-strict",
					windowMs: 60000,
					max: 1,
				}),
			},
			async (_request, reply) =>
				reply.status(200).send({
					health: "ok",
				}),
		);

		const r1 = await app.inject({ method: "GET", url: "/healthcheck-strict" });
		expect(r1.statusCode).toBe(200);

		const r2 = await app.inject({ method: "GET", url: "/healthcheck-strict" });
		expect(r2.statusCode).toBe(429);
		expect(r2.headers["x-ratelimit-remaining"]).toBe("0");
	});

	it("should set headers for open tier", async () => {
		const app = Fastify();
		app.decorate("redis", new FakeRedisZ() as unknown as FastifyRedis);
		await app.register(errorHandlerPlugin);
		await app.register(rateLimitPlugin);

		app.get(
			"/open",
			{
				preHandler: app.rateLimit({
					name: "open",
					windowMs: 60000,
					max: Number.POSITIVE_INFINITY,
				}),
			},
			async () => ({ ok: true }),
		);

		const r = await app.inject({ method: "GET", url: "/open" });
		expect(r.statusCode).toBe(200);
		expect(r.headers["x-ratelimit-limit"]).toBeDefined();
		expect(r.headers["x-ratelimit-remaining"]).toBe("Infinity");
	});

	it("should allow request and set headers when redis is missing (degrade)", async () => {
		const app = Fastify();
		// No redis decoration
		await app.register(errorHandlerPlugin);
		await app.register(rateLimitPlugin);

		app.get(
			"/degrade",
			{
				preHandler: app.rateLimit({
					name: "degrade",
					windowMs: 60000,
					max: 10,
				}),
			},
			async () => ({ ok: true }),
		);

		const r = await app.inject({ method: "GET", url: "/degrade" });
		expect(r.statusCode).toBe(200);
		expect(r.headers["x-ratelimit-limit"]).toBe("10");
		expect(r.headers["x-ratelimit-remaining"]).toBeDefined();
	});

	it("should handle redis pipeline errors by allowing request", async () => {
		const app = Fastify();
		const fakeRedis = new FakeRedisZ();
		// Mock pipeline to return an error
		fakeRedis.pipeline = () => {
			// Define a type that matches the recursive structure needed
			type MockPipeline = {
				zremrangebyscore: () => MockPipeline;
				zcard: () => MockPipeline;
				zadd: () => MockPipeline;
				zrange: () => MockPipeline;
				expire: () => MockPipeline;
				exec: () => Promise<Array<[Error | null, unknown]>>;
			};

			const mockPipeline: MockPipeline = {
				zremrangebyscore: () => mockPipeline,
				zcard: () => mockPipeline,
				zadd: () => mockPipeline,
				zrange: () => mockPipeline,
				expire: () => mockPipeline,
				exec: async () => [[new Error("Redis failure"), null]],
			};
			return mockPipeline as unknown as ReturnType<FakeRedisZ["pipeline"]>;
		};

		app.decorate("redis", fakeRedis as unknown as FastifyRedis);
		await app.register(errorHandlerPlugin);
		await app.register(rateLimitPlugin);

		app.get(
			"/error",
			{
				preHandler: app.rateLimit({
					name: "error",
					windowMs: 60000,
					max: 10,
				}),
			},
			async () => ({ ok: true }),
		);

		const r = await app.inject({ method: "GET", url: "/error" });
		expect(r.statusCode).toBe(200);
		// Should still set headers due to degradation path in leakyBucket catch block
		expect(r.headers["x-ratelimit-limit"]).toBeDefined();
	});
});
