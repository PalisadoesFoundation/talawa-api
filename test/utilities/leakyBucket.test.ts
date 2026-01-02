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
			// Implementation still calls hset to initialize bucket even with 0 capacity
			expect(redisMock.hset).toHaveBeenCalledWith(
				"key",
				expect.objectContaining({
					tokens: "0", // capacity - cost = 0 - 1 = -1, but stored as 0 initially
					lastUpdate: expect.any(String),
				}),
			);
		});

		it("should reject all requests when capacity is 0 with existing bucket", async () => {
			const now = 1000000;
			vi.setSystemTime(now);

			redisMock.hgetall.mockResolvedValue({
				tokens: "5",
				lastUpdate: (now - 1000).toString(),
			});

			const result = await leakyBucket(fastify, "key", 0, 1, 1);
			expect(result).toBe(false);
			// Should not call hset since request is rejected
			expect(redisMock.hset).not.toHaveBeenCalled();
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

		it("should deplete tokens with zero refillRate on repeated requests", async () => {
			const capacity = 3;
			const key = "test-key";
			const now = 1000000;
			vi.setSystemTime(now);

			// First request - start with 3 tokens
			redisMock.hgetall.mockResolvedValue({
				tokens: "3",
				lastUpdate: now.toString(),
			});

			let result = await leakyBucket(fastify, key, capacity, 0, 1);
			expect(result).toBe(true);
			expect(redisMock.hset).toHaveBeenCalledWith(
				key,
				expect.objectContaining({
					tokens: "2", // 3 - 1 = 2
				}),
			);

			// Second request - 2 tokens left
			redisMock.hgetall.mockResolvedValue({
				tokens: "2",
				lastUpdate: now.toString(),
			});

			result = await leakyBucket(fastify, key, capacity, 0, 1);
			expect(result).toBe(true);

			// Third request - 1 token left
			redisMock.hgetall.mockResolvedValue({
				tokens: "1",
				lastUpdate: now.toString(),
			});

			result = await leakyBucket(fastify, key, capacity, 0, 1);
			expect(result).toBe(true);

			// Fourth request - 0 tokens left, should be rejected
			redisMock.hgetall.mockResolvedValue({
				tokens: "0",
				lastUpdate: now.toString(),
			});

			result = await leakyBucket(fastify, key, capacity, 0, 1);
			expect(result).toBe(false);
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

		it("should always succeed with cost 0 even when no tokens available", async () => {
			const capacity = 10;
			const key = "test-key";
			const now = 1000000;
			vi.setSystemTime(now);

			redisMock.hgetall.mockResolvedValue({
				tokens: "0",
				lastUpdate: now.toString(),
			});

			const result = await leakyBucket(fastify, key, capacity, 1, 0);

			expect(result).toBe(true);
			expect(redisMock.hset).toHaveBeenCalledWith(
				key,
				expect.objectContaining({
					tokens: "0", // 0 - 0 = 0
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
			// Implementation still calls hset to initialize bucket even with negative capacity
			expect(redisMock.hset).toHaveBeenCalledWith(
				"key",
				expect.objectContaining({
					tokens: "-5", // capacity is stored as-is
					lastUpdate: expect.any(String),
				}),
			);
		});

		it("should handle negative capacity with existing bucket", async () => {
			const now = 1000000;
			vi.setSystemTime(now);

			redisMock.hgetall.mockResolvedValue({
				tokens: "10",
				lastUpdate: now.toString(),
			});

			const result = await leakyBucket(fastify, "key", -3, 1, 1);
			expect(result).toBe(false);
			// Should not call hset since request is rejected
			expect(redisMock.hset).not.toHaveBeenCalled();
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

		it("should handle negative refillRate causing token depletion over long time", async () => {
			const now = 1000000;
			vi.setSystemTime(now);
			redisMock.hgetall.mockResolvedValue({
				tokens: "5",
				lastUpdate: (now - 10000).toString(), // 10s ago
			});
			// Refill -2 per sec. 10s elapsed. 5 + (-2 * 10) = 5 - 20 = -15.
			// Math.min(capacity=10, -15) = -15. -15 < cost(1) -> reject.
			const result = await leakyBucket(fastify, "key", 10, -2, 1);
			expect(result).toBe(false);
			// Should not call hset since request is rejected
			expect(redisMock.hset).not.toHaveBeenCalled();
		});

		it("should handle negative cost (effectively adding tokens)", async () => {
			const capacity = 10;
			const key = "test-key";
			const now = 1000000;
			vi.setSystemTime(now);

			redisMock.hgetall.mockResolvedValue({
				tokens: "5",
				lastUpdate: now.toString(),
			});

			const result = await leakyBucket(fastify, key, capacity, 1, -2);

			expect(result).toBe(true);
			expect(redisMock.hset).toHaveBeenCalledWith(
				key,
				expect.objectContaining({
					tokens: "7", // 5 - (-2) = 5 + 2 = 7
					lastUpdate: now.toString(),
				}),
			);
		});

		it("should handle negative cost with capacity capping", async () => {
			const capacity = 10;
			const key = "test-key";
			const now = 1000000;
			vi.setSystemTime(now);

			redisMock.hgetall.mockResolvedValue({
				tokens: "8",
				lastUpdate: now.toString(),
			});

			const result = await leakyBucket(fastify, key, capacity, 1, -5);

			expect(result).toBe(true);
			// 8 - (-5) = 8 + 5 = 13, but implementation doesn't cap after cost deduction
			expect(redisMock.hset).toHaveBeenCalledWith(
				key,
				expect.objectContaining({
					tokens: "13", // Not capped after cost deduction
					lastUpdate: now.toString(),
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

		it("should handle extremely large capacity with refill", async () => {
			const hugeCapacity = Number.MAX_SAFE_INTEGER;
			const now = 1000000;
			vi.setSystemTime(now);

			redisMock.hgetall.mockResolvedValue({
				tokens: "1000",
				lastUpdate: (now - 5000).toString(), // 5s ago
			});

			const result = await leakyBucket(fastify, "key", hugeCapacity, 100, 50);
			expect(result).toBe(true);
			// 1000 + (100 * 5) - 50 = 1000 + 500 - 50 = 1450
			expect(redisMock.hset).toHaveBeenCalledWith(
				"key",
				expect.objectContaining({
					tokens: "1450",
				}),
			);
		});

		it("should handle extremely large cost", async () => {
			const hugeCost = Number.MAX_SAFE_INTEGER;
			const now = 1000000;
			vi.setSystemTime(now);

			redisMock.hgetall.mockResolvedValue({
				tokens: "1000",
				lastUpdate: now.toString(),
			});

			const result = await leakyBucket(fastify, "key", 2000, 1, hugeCost);
			expect(result).toBe(false); // 1000 < hugeCost
			// Should not call hset since request is rejected
			expect(redisMock.hset).not.toHaveBeenCalled();
		});

		it("should handle floating-point refillRate correctly", async () => {
			const capacity = 10;
			const key = "test-key";
			const now = 1000000;
			vi.setSystemTime(now);

			redisMock.hgetall.mockResolvedValue({
				tokens: "2",
				lastUpdate: (now - 3000).toString(), // 3s ago
			});

			// Refill rate of 0.5 tokens per second
			const result = await leakyBucket(fastify, key, capacity, 0.5, 1);
			expect(result).toBe(true);
			// 2 + (0.5 * 3) - 1 = 2 + 1.5 - 1 = 2.5
			expect(redisMock.hset).toHaveBeenCalledWith(
				key,
				expect.objectContaining({
					tokens: "2.5",
				}),
			);
		});

		it("should handle floating-point refillRate with capacity capping", async () => {
			const capacity = 5;
			const key = "test-key";
			const now = 1000000;
			vi.setSystemTime(now);

			redisMock.hgetall.mockResolvedValue({
				tokens: "3",
				lastUpdate: (now - 10000).toString(), // 10s ago
			});

			// Refill rate of 0.3 tokens per second
			const result = await leakyBucket(fastify, key, capacity, 0.3, 1);
			expect(result).toBe(true);
			// 3 + (0.3 * 10) = 3 + 3 = 6, but capped at capacity 5
			// 5 - 1 = 4
			expect(redisMock.hset).toHaveBeenCalledWith(
				key,
				expect.objectContaining({
					tokens: "4",
				}),
			);
		});

		it("should handle floating-point cost correctly", async () => {
			const capacity = 10;
			const key = "test-key";
			const now = 1000000;
			vi.setSystemTime(now);

			redisMock.hgetall.mockResolvedValue({
				tokens: "5", // Note: parseInt will parse this as 5, not 5.7
				lastUpdate: now.toString(),
			});

			const result = await leakyBucket(fastify, key, capacity, 1, 2.3);
			expect(result).toBe(true);
			// 5 - 2.3 = 2.7
			expect(redisMock.hset).toHaveBeenCalledWith(
				key,
				expect.objectContaining({
					tokens: "2.7",
				}),
			);
		});

		it("should reject when floating-point cost exceeds available tokens", async () => {
			const capacity = 10;
			const key = "test-key";
			const now = 1000000;
			vi.setSystemTime(now);

			redisMock.hgetall.mockResolvedValue({
				tokens: "2", // parseInt will parse this as 2, not 2.1
				lastUpdate: now.toString(),
			});

			const result = await leakyBucket(fastify, key, capacity, 1, 2.5);
			expect(result).toBe(false); // 2 < 2.5
			// Should not call hset since request is rejected
			expect(redisMock.hset).not.toHaveBeenCalled();
		});

		it("should handle precision edge case with floating-point arithmetic", async () => {
			const capacity = 10;
			const key = "test-key";
			const now = 1000000;
			vi.setSystemTime(now);

			redisMock.hgetall.mockResolvedValue({
				tokens: "0", // parseInt will parse this as 0, not 0.1
				lastUpdate: (now - 1000).toString(), // 1s ago
			});

			// Test floating-point precision: 0 + 0.2 should be 0.2, but 0.2 < 0.3 so rejected
			const result = await leakyBucket(fastify, key, capacity, 0.2, 0.3);
			expect(result).toBe(false); // 0.2 < 0.3
			// Should not call hset since request is rejected
			expect(redisMock.hset).not.toHaveBeenCalled();
		});
	});

	describe("Error Handling", () => {
		it("should handle Redis hgetall failure gracefully (allow request)", async () => {
			const error = new Error("Redis connection failed");
			redisMock.hgetall.mockRejectedValue(error);

			const result = await leakyBucket(fastify, "key", 10, 1, 1);

			expect(result).toBe(true); // Fail open
			expect(logMock.error).toHaveBeenCalledWith(
				expect.objectContaining({
					key: "key",
					error,
				}),
				"Leaky bucket rate limiter encountered an error",
			);
		});

		it("should handle Redis hset failure gracefully (allow request)", async () => {
			redisMock.hgetall.mockResolvedValue(null);
			redisMock.hset.mockRejectedValue(new Error("Write failed"));

			const result = await leakyBucket(fastify, "key", 10, 1, 1);

			expect(result).toBe(true); // Fail open
			expect(logMock.error).toHaveBeenCalledWith(
				expect.objectContaining({
					key: "key",
					error: expect.any(Error),
				}),
				"Leaky bucket rate limiter encountered an error",
			);
		});
	});
});
