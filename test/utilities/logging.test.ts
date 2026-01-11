import type { FastifyInstance } from "fastify";
import { describe, expect, it, vi } from "vitest";
import leakyBucket from "../../src/utilities/leakyBucket";
import { createMockLogger } from "./mockLogger";

describe("structured logging", () => {
	it("logs state when rate limit checked", async () => {
		const redis = {
			hgetall: vi.fn().mockResolvedValue({
				tokens: "10",
				lastUpdate: `${Date.now() - 1000}`,
			}),
			hset: vi.fn(),
			expire: vi.fn(),
		} as unknown as FastifyInstance["redis"];

		const fastify = { redis } as unknown as FastifyInstance;
		const logger = createMockLogger();

		await leakyBucket(
			fastify,
			"rate:ip:127.0.0.1",
			5, // capacity
			1, // refill rate
			1, // cost
			logger,
		);

		expect(logger.debug).toHaveBeenCalledWith(
			expect.objectContaining({
				tokens: 10,
			}),
			"Leaky bucket state",
		);
	});
});
