import type { FastifyRedis } from "@fastify/redis";
import Fastify, { type FastifyInstance } from "fastify";
import fastifyPlugin from "fastify-plugin";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { cacheService } from "~/src/fastifyPlugins/cacheService";
import { RedisCacheService } from "~/src/services/caching";

/**
 * Create a mock Redis client for testing.
 * Uses double type assertion to bypass strict FastifyRedis typing.
 */
function createMockRedis(): FastifyRedis {
	return {
		get: vi.fn(),
		setex: vi.fn(),
		del: vi.fn(),
		scan: vi.fn(),
		mget: vi.fn(),
	} as unknown as FastifyRedis;
}

async function registerRedisPlugin(
	fastify: FastifyInstance,
	redis?: FastifyRedis,
): Promise<void> {
	await fastify.register(
		fastifyPlugin(
			async (instance) => {
				if (redis) {
					instance.decorate("redis", redis);
				}
			},
			{ name: "@fastify/redis" },
		),
	);
}

describe("cacheService plugin", () => {
	let fastify: FastifyInstance;

	beforeEach(() => {
		fastify = Fastify();
	});

	it("should fail to register when redis dependency is missing", async () => {
		await expect(fastify.register(cacheService)).rejects.toThrowError(
			/@fastify\/redis/,
		);
	});

	describe("when Redis is available", () => {
		it("should register RedisCacheService when redis client exists", async () => {
			const mockRedis = createMockRedis();

			await registerRedisPlugin(fastify, mockRedis);

			await fastify.register(cacheService);

			expect(fastify.cache).toBeDefined();
			expect(fastify.cache).toBeInstanceOf(RedisCacheService);
		});

		it("should log info message when cache is registered", async () => {
			const mockRedis = createMockRedis();

			const logInfoSpy = vi.spyOn(fastify.log, "info");
			await registerRedisPlugin(fastify, mockRedis);

			await fastify.register(cacheService);

			expect(logInfoSpy).toHaveBeenCalledWith({
				msg: "CacheService registered",
			});
		});
	});

	describe("when Redis is not available", () => {
		it("should register noop cache when redis is undefined", async () => {
			// Don't decorate with redis - simulates redis not being available
			const logWarnSpy = vi.spyOn(fastify.log, "warn");

			await registerRedisPlugin(fastify);

			await fastify.register(cacheService);

			expect(fastify.cache).toBeDefined();
			expect(logWarnSpy).toHaveBeenCalledWith(
				"Redis instance not found; cache will noop via pass-through adapter.",
			);
		});

		it("should provide noop get that returns null", async () => {
			await registerRedisPlugin(fastify);
			await fastify.register(cacheService);

			const result = await fastify.cache.get("any-key");
			expect(result).toBeNull();
		});

		it("should provide noop set that does nothing", async () => {
			await registerRedisPlugin(fastify);
			await fastify.register(cacheService);

			await expect(
				fastify.cache.set("key", "value", 300),
			).resolves.toBeUndefined();
		});

		it("should provide noop del that does nothing", async () => {
			await registerRedisPlugin(fastify);
			await fastify.register(cacheService);

			await expect(fastify.cache.del("key")).resolves.toBeUndefined();
		});

		it("should provide noop clearByPattern that does nothing", async () => {
			await registerRedisPlugin(fastify);
			await fastify.register(cacheService);

			await expect(
				fastify.cache.clearByPattern("pattern:*"),
			).resolves.toBeUndefined();
		});

		it("should provide noop mget that returns nulls", async () => {
			await registerRedisPlugin(fastify);
			await fastify.register(cacheService);

			const result = await fastify.cache.mget(["k1", "k2", "k3"]);
			expect(result).toEqual([null, null, null]);
		});

		it("should provide noop mset that does nothing", async () => {
			await registerRedisPlugin(fastify);
			await fastify.register(cacheService);

			await expect(
				fastify.cache.mset([{ key: "k1", value: "v1", ttlSeconds: 300 }]),
			).resolves.toBeUndefined();
		});
	});
});
