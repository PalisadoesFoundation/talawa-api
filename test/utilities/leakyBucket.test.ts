import type { FastifyInstance } from "fastify";
import {
	afterEach,
	beforeEach,
	describe,
	expect,
	it,
	type Mock,
	vi,
} from "vitest";
import leakyBucket from "../../src/utilities/leakyBucket";

describe("leakyBucket", () => {
	let fastify: FastifyInstance;
	let redisMock: { hgetall: Mock; hset: Mock };
	let logMock: { debug: Mock; error: Mock };

	beforeEach(() => {
		// Mock Redis
		redisMock = {
			hgetall: vi.fn(),
			hset: vi.fn(),
		};

		// Mock Logger
		logMock = {
			debug: vi.fn(),
			error: vi.fn(),
		};

		fastify = {
			redis: redisMock,
			log: logMock,
		} as unknown as FastifyInstance;

		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.restoreAllMocks();
		vi.useRealTimers();
	});

	it("should initialize a new bucket if one does not exist", async () => {
		redisMock.hgetall.mockResolvedValue(null); // No bucket exists
		const capacity = 10;
		const refillRate = 1;
		const cost = 1;
		const key = "test-key";

		const result = await leakyBucket(fastify, key, capacity, refillRate, cost);

		expect(result).toBe(true);
		expect(redisMock.hgetall).toHaveBeenCalledWith(key);
		expect(redisMock.hset).toHaveBeenCalledWith(
			key,
			expect.objectContaining({
				tokens: expect.any(String),
				lastUpdate: expect.any(String),
			}),
		);
		expect(logMock.debug).toHaveBeenCalledWith(
			expect.objectContaining({
				tokens: expect.any(Number),
				lastUpdate: expect.any(Number),
			}),
			"Leaky bucket state",
		);
	});

	it("should refill tokens based on elapsed time", async () => {
		const capacity = 10;
		const refillRate = 1; // 1 token per second
		const cost = 1;
		const key = "test-key";
		const now = 1000000;
		const lastUpdate = now - 5000; // 5 seconds ago

		vi.setSystemTime(now);

		redisMock.hgetall.mockResolvedValue({
			tokens: "0",
			lastUpdate: lastUpdate.toString(),
		});

		const result = await leakyBucket(fastify, key, capacity, refillRate, cost);

		// Should have refilled 5 tokens (5s * 1/s) -> 5 tokens total. Cost 1 -> 4 tokens left.
		expect(result).toBe(true);
		expect(redisMock.hset).toHaveBeenCalledWith(
			key,
			expect.objectContaining({
				tokens: "4", // 0 + 5 - 1 = 4
				lastUpdate: now.toString(),
			}),
		);
	});

	it("should reject request if insufficient tokens", async () => {
		const capacity = 10;
		const refillRate = 1;
		const cost = 5;
		const key = "test-key";
		const now = 1000000;

		vi.setSystemTime(now);

		redisMock.hgetall.mockResolvedValue({
			tokens: "2",
			lastUpdate: now.toString(), // No time elapsed
		});

		const result = await leakyBucket(fastify, key, capacity, refillRate, cost);

		expect(result).toBe(false);
		expect(redisMock.hset).not.toHaveBeenCalled(); // Should not update if rejected
	});

	it("should cap tokens at capacity", async () => {
		const capacity = 10;
		const refillRate = 1;
		const cost = 1;
		const key = "test-key";
		const now = 1000000;
		const lastUpdate = now - 20000; // 20 seconds ago

		vi.setSystemTime(now);

		redisMock.hgetall.mockResolvedValue({
			tokens: "5",
			lastUpdate: lastUpdate.toString(),
		});

		// Refill: 5 + 20 = 25. Capped at 10. Cost 1 -> 9.
		const result = await leakyBucket(fastify, key, capacity, refillRate, cost);

		expect(result).toBe(true);
		expect(redisMock.hset).toHaveBeenCalledWith(
			key,
			expect.objectContaining({
				tokens: "9",
				lastUpdate: now.toString(),
			}),
		);
	});

	it("should handle existing bucket parsing", async () => {
		const capacity = 10;
		const key = "test-key";

		redisMock.hgetall.mockResolvedValue({
			tokens: "8",
			lastUpdate: Date.now().toString(),
		});

		await leakyBucket(fastify, key, capacity, 1, 1);

		expect(logMock.debug).toHaveBeenCalledWith(
			expect.objectContaining({
				tokens: 8,
			}),
			"Leaky bucket state",
		);
	});

	it("should handle empty bucket object (parse fallbacks)", async () => {
		// Simulating hgetall returning empty object or weird state if that happens
		redisMock.hgetall.mockResolvedValue({});
		// The code checks `!bucket || Object.keys(bucket).length === 0`

		const now = Date.now();
		vi.setSystemTime(now);

		await leakyBucket(fastify, "key", 10, 1, 1);

		// Should initialize
		expect(redisMock.hset).toHaveBeenCalledWith(
			"key",
			expect.objectContaining({
				tokens: "9", // 10 - 1
				lastUpdate: now.toString(),
			}),
		);
	});

	describe("Boundary Values", () => {
		it("should reject all requests when capacity is 0", async () => {
			redisMock.hgetall.mockResolvedValue(null);
			const result = await leakyBucket(fastify, "key", 0, 1, 1);
			expect(result).toBe(false);
		});

		it("should never refill tokens when refillRate is 0", async () => {
			const capacity = 10;
			const key = "test-key";
			const now = 1000000;

			vi.setSystemTime(now);

			// Start with 1 token, long time elapsed
			redisMock.hgetall.mockResolvedValue({
				tokens: "1",
				lastUpdate: (now - 100000).toString(),
			});

			const result = await leakyBucket(fastify, key, capacity, 0, 1);

			// 1 token in bucket. Refill 0. Cost 1.
			// Should succeed once, leaving 0.
			expect(result).toBe(true);

			expect(redisMock.hset).toHaveBeenCalledWith(
				key,
				expect.objectContaining({
					tokens: "0",
					lastUpdate: now.toString(),
				}),
			);
		});

		it("should always succeed (token count unchanged) when cost is 0", async () => {
			const capacity = 10;
			const key = "test-key";
			const now = 1000000;
			vi.setSystemTime(now);

			redisMock.hgetall.mockResolvedValue({
				tokens: "5",
				lastUpdate: now.toString(),
			});

			const result = await leakyBucket(fastify, key, capacity, 1, 0);

			expect(result).toBe(true);
			expect(redisMock.hset).toHaveBeenCalledWith(
				key,
				expect.objectContaining({
					tokens: "5", // 5 - 0 = 5
					lastUpdate: now.toString(),
				}),
			);
		});

		it("should handle negative capacity (treat as 0/small max)", async () => {
			// If capacity is negative, logic `Math.min(capacity, ...)` forces tokens to be negative or low.
			// Math.min(-5, ...) -> -5.
			// -5 < cost(1) -> reject.
			redisMock.hgetall.mockResolvedValue(null);
			const result = await leakyBucket(fastify, "key", -5, 1, 1);
			expect(result).toBe(false);
		});

		it("should handle negative refillRate (deplete tokens over time)", async () => {
			const now = 1000000;
			vi.setSystemTime(now);
			redisMock.hgetall.mockResolvedValue({
				tokens: "10",
				lastUpdate: (now - 1000).toString(), // 1s ago
			});
			// Refill -1 per sec. 1s elapsed. 10 + (-1) = 9.
			const result = await leakyBucket(fastify, "key", 10, -1, 1);
			expect(result).toBe(true);
			expect(redisMock.hset).toHaveBeenCalledWith(
				"key",
				expect.objectContaining({
					tokens: "8", // 9 - 1 = 8
				}),
			);
		});

		it("should handle extremely large values correctly", async () => {
			const huge = Number.MAX_SAFE_INTEGER;
			const now = 1000000;
			vi.setSystemTime(now);
			redisMock.hgetall.mockResolvedValue({
				tokens: huge.toString(),
				lastUpdate: now.toString(),
			});

			const result = await leakyBucket(fastify, "key", huge, 1, 1);
			expect(result).toBe(true);
			// huge - 1
			expect(redisMock.hset).toHaveBeenCalledWith(
				"key",
				expect.objectContaining({
					tokens: (huge - 1).toString(),
				}),
			);
		});
	});

	describe("Error Handling", () => {
		it("should handle Redis hgetall failure gracefully (allow request)", async () => {
			const error = new Error("Redis connection failed");
			redisMock.hgetall.mockRejectedValue(error);

			const result = await leakyBucket(fastify, "key", 10, 1, 1);

			expect(result).toBe(true); // Fail open
			expect(logMock.debug).not.toHaveBeenCalled(); // Should not reach debug log
			// We might expect an error log if implemented
		});

		it("should handle Redis hset failure gracefully (allow request)", async () => {
			redisMock.hgetall.mockResolvedValue(null);
			redisMock.hset.mockRejectedValue(new Error("Write failed"));

			const result = await leakyBucket(fastify, "key", 10, 1, 1);

			expect(result).toBe(true); // Fail open
		});
	});
});
