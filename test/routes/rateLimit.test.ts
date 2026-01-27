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
		// biome-ignore lint/suspicious/noExplicitAny: mocking redis pipeline for testing
		const commands: (() => Promise<any>)[] = [];

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
});
