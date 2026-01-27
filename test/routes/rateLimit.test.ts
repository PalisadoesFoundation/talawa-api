import Fastify from "fastify";
import { describe, expect, it } from "vitest";
import errorHandlerPlugin from "~/src/fastifyPlugins/errorHandler";
import rateLimitPlugin from "~/src/fastifyPlugins/rateLimit";

class FakeRedisZ {
	private z = new Map<string, Array<{ s: number; m: string }>>();
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
		// biome-ignore lint/suspicious/noExplicitAny: mocking redis for testing
		app.decorate("redis", new FakeRedisZ() as any);
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
});
