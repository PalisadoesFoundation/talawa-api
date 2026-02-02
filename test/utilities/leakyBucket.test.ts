import { faker } from "@faker-js/faker";
import type { FastifyBaseLogger, FastifyInstance } from "fastify";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	complexityLeakyBucket,
	leakyBucket,
} from "../../src/utilities/leakyBucket";
import type { AppLogger } from "../../src/utilities/logging/logger";

/**
 * FakeRedisZ mock that simulates Redis sorted set operations for testing.
 * Used for testing the sliding window rate limiter (leakyBucket function).
 */
class FakeRedisZ {
	private z = new Map<string, Array<{ s: number; m: string }>>();
	private shouldFailPipeline = false;
	private shouldReturnNullPipeline = false;
	private shouldFailPipelineCommand = false;
	private pipelineExecutionCount = 0;
	private shouldReturnNullPipelineOnSecondExec = false;
	private shouldFailPipelineCommandOnSecondExec = false;
	private shouldReturnEmptyZRange = false;

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
				self.pipelineExecutionCount++;

				if (
					self.shouldReturnNullPipeline ||
					(self.shouldReturnNullPipelineOnSecondExec &&
						self.pipelineExecutionCount === 2)
				) {
					return null;
				}

				const results = [];
				for (const cmd of commands) {
					try {
						const res = await cmd();
						if (
							self.shouldFailPipelineCommand ||
							(self.shouldFailPipelineCommandOnSecondExec &&
								self.pipelineExecutionCount === 2)
						) {
							results.push([new Error("Pipeline command error"), null]);
							self.shouldFailPipelineCommand = false;
							self.shouldFailPipelineCommandOnSecondExec = false;
						} else {
							results.push([null, res]);
						}
					} catch (err) {
						results.push([err, null]);
					}
				}

				if (self.shouldFailPipeline) {
					throw new Error("Pipeline execution failed");
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
		const lo = min === "-inf" ? -Number.POSITIVE_INFINITY : Number(min);
		const hi = max === "+inf" ? Number.POSITIVE_INFINITY : Number(max);
		this.z.set(
			key,
			arr.filter((e) => e.s < lo || e.s > hi),
		);
		return arr.length - (this.z.get(key) ?? []).length;
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
		return 1;
	}

	async zrange(
		key: string,
		start: number,
		stop: number,
		_withScores?: "WITHSCORES",
	) {
		const arr = this.z.get(key) ?? [];
		if (this.shouldReturnEmptyZRange) {
			return [];
		}
		const slice = arr.slice(start, stop + 1);
		if (_withScores === "WITHSCORES") {
			const flat: string[] = [];
			for (const e of slice) {
				flat.push(e.m);
				flat.push(String(e.s));
			}
			return flat;
		}
		return slice.map((e) => e.m);
	}

	async expire(_key: string, _sec: number) {
		return 1;
	}

	// Helper methods for testing
	populate(key: string, entries: Array<{ timestamp: number; id: string }>) {
		const arr = this.z.get(key) ?? [];
		for (const entry of entries) {
			arr.push({ s: entry.timestamp, m: entry.id });
		}
		arr.sort((a, b) => a.s - b.s);
		this.z.set(key, arr);
	}

	setFailPipeline(shouldFail: boolean) {
		this.shouldFailPipeline = shouldFail;
	}

	setReturnNullPipeline(shouldReturnNull: boolean) {
		this.shouldReturnNullPipeline = shouldReturnNull;
	}

	setFailPipelineCommand(shouldFail: boolean) {
		this.shouldFailPipelineCommand = shouldFail;
	}

	setReturnNullPipelineOnSecondExec(shouldReturnNull: boolean) {
		this.shouldReturnNullPipelineOnSecondExec = shouldReturnNull;
	}

	setFailPipelineCommandOnSecondExec(shouldFail: boolean) {
		this.shouldFailPipelineCommandOnSecondExec = shouldFail;
	}

	resetPipelineExecutionCount() {
		this.pipelineExecutionCount = 0;
	}

	setReturnEmptyZRange(shouldReturnEmpty: boolean) {
		this.shouldReturnEmptyZRange = shouldReturnEmpty;
	}

	clear() {
		this.z.clear();
		this.pipelineExecutionCount = 0;
		this.shouldReturnEmptyZRange = false;
	}
}

/**
 * FakeRedisHash mock that simulates Redis hash operations for testing.
 * Used for testing the token bucket rate limiter (complexityLeakyBucket function).
 */
class FakeRedisHash {
	private hashes = new Map<string, Record<string, string>>();

	async hgetall(key: string): Promise<Record<string, string>> {
		return this.hashes.get(key) ?? {};
	}

	async hset(key: string, values: Record<string, string>): Promise<number> {
		const existing = this.hashes.get(key) ?? {};
		this.hashes.set(key, { ...existing, ...values });
		return Object.keys(values).length;
	}

	clear() {
		this.hashes.clear();
	}

	// Helper method to set specific values for testing
	setHash(key: string, values: Record<string, string>) {
		this.hashes.set(key, values);
	}
}

describe("leakyBucket", () => {
	let redis: FakeRedisZ;
	let logger: FastifyBaseLogger;
	let testKeyPrefix: string;
	const NOW = 1625097600000;

	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(NOW);
		redis = new FakeRedisZ();
		testKeyPrefix = faker.string.uuid();
		logger = {
			debug: vi.fn(),
			info: vi.fn(),
			warn: vi.fn(),
			error: vi.fn(),
			fatal: vi.fn(),
			trace: vi.fn(),
			child: vi.fn(),
		} as unknown as FastifyBaseLogger;
	});

	afterEach(() => {
		redis.clear();
		vi.clearAllMocks();
		vi.useRealTimers();
	});

	describe("successful rate limiting - empty bucket", () => {
		it("should allow the first request when bucket is empty", async () => {
			const result = await leakyBucket(
				redis,
				`${testKeyPrefix}-1`,
				10,
				60000,
				logger,
			);

			expect(result.allowed).toBe(true);
			expect(result.remaining).toBe(9);
			expect(result.resetAt).toBeGreaterThan(Date.now());
		});

		it("should allow request without logger", async () => {
			const result = await leakyBucket(redis, `${testKeyPrefix}-2`, 10, 60000);

			expect(result.allowed).toBe(true);
			expect(result.remaining).toBe(9);
		});
	});

	describe("successful rate limiting - within limit", () => {
		it("should allow requests within the limit", async () => {
			const now = Date.now();
			redis.populate(`${testKeyPrefix}-3`, [
				{ timestamp: now - 1000, id: "req-1" },
				{ timestamp: now - 500, id: "req-2" },
			]);

			const result = await leakyBucket(
				redis,
				`${testKeyPrefix}-3`,
				10,
				60000,
				logger,
			);

			expect(result.allowed).toBe(true);
			expect(result.remaining).toBe(7);
		});

		it("should calculate remaining correctly when approaching limit", async () => {
			const now = Date.now();
			redis.populate(`${testKeyPrefix}-4`, [
				{ timestamp: now - 5000, id: "req-1" },
				{ timestamp: now - 4000, id: "req-2" },
				{ timestamp: now - 3000, id: "req-3" },
				{ timestamp: now - 2000, id: "req-4" },
				{ timestamp: now - 1000, id: "req-5" },
			]);

			const result = await leakyBucket(
				redis,
				`${testKeyPrefix}-4`,
				10,
				60000,
				logger,
			);

			expect(result.allowed).toBe(true);
			expect(result.remaining).toBe(4);
		});
	});

	describe("rate limit exceeded", () => {
		it("should reject request when at exact limit", async () => {
			const now = Date.now();
			const entries: Array<{ timestamp: number; id: string }> = [];
			for (let i = 0; i < 10; i++) {
				entries.push({ timestamp: now - (10 - i) * 100, id: `req-${i}` });
			}
			redis.populate(`${testKeyPrefix}-5`, entries);

			const result = await leakyBucket(
				redis,
				`${testKeyPrefix}-5`,
				10,
				60000,
				logger,
			);

			expect(result.allowed).toBe(false);
			expect(result.remaining).toBe(0);
			expect(result.resetAt).toBeGreaterThan(Date.now());
		});

		it("should reject request when over limit", async () => {
			const now = Date.now();
			const entries: Array<{ timestamp: number; id: string }> = [];
			for (let i = 0; i < 15; i++) {
				entries.push({ timestamp: now - (15 - i) * 100, id: `req-${i}` });
			}
			redis.populate(`${testKeyPrefix}-6`, entries);

			const result = await leakyBucket(
				redis,
				`${testKeyPrefix}-6`,
				10,
				60000,
				logger,
			);

			expect(result.allowed).toBe(false);
			expect(result.remaining).toBe(0);
		});

		it("should calculate correct resetAt when limit exceeded", async () => {
			const now = Date.now();
			const windowMs = 60000;
			const oldestTimestamp = now - 5000;

			redis.populate(`${testKeyPrefix}-7`, [
				{ timestamp: oldestTimestamp, id: "req-1" },
				{ timestamp: now - 4000, id: "req-2" },
				{ timestamp: now - 3000, id: "req-3" },
				{ timestamp: now - 2000, id: "req-4" },
				{ timestamp: now - 1000, id: "req-5" },
			]);

			const result = await leakyBucket(
				redis,
				`${testKeyPrefix}-7`,
				5,
				windowMs,
				logger,
			);

			expect(result.allowed).toBe(false);
			expect(result.resetAt).toBe(oldestTimestamp + windowMs);
		});
	});

	describe("sliding window behavior", () => {
		it("should remove expired entries from the window", async () => {
			const now = Date.now();
			const windowMs = 60000;

			// Add some old entries that should be removed
			redis.populate(`${testKeyPrefix}-8`, [
				{ timestamp: now - 70000, id: "old-req-1" }, // Outside window
				{ timestamp: now - 65000, id: "old-req-2" }, // Outside window
				{ timestamp: now - 5000, id: "recent-req-1" },
				{ timestamp: now - 1000, id: "recent-req-2" },
			]);

			const result = await leakyBucket(
				redis,
				`${testKeyPrefix}-8`,
				10,
				windowMs,
				logger,
			);

			expect(result.allowed).toBe(true);
			// Should only count the 2 recent requests + 1 new = 3 total, so remaining = 7
			expect(result.remaining).toBe(7);
		});

		it("should allow request after old entries expire", async () => {
			const now = Date.now();
			const windowMs = 1000; // 1 second window

			// Fill bucket to limit with old requests
			const entries: Array<{ timestamp: number; id: string }> = [];
			for (let i = 0; i < 5; i++) {
				entries.push({ timestamp: now - 2000, id: `old-req-${i}` }); // 2 seconds old
			}
			redis.populate(`${testKeyPrefix}-9`, entries);

			const result = await leakyBucket(
				redis,
				`${testKeyPrefix}-9`,
				5,
				windowMs,
				logger,
			);

			// Old entries should be expired, so request allowed
			expect(result.allowed).toBe(true);
			expect(result.remaining).toBe(4);
		});
	});

	describe("error handling - pipeline null", () => {
		it("should degrade gracefully when pipeline returns null", async () => {
			redis.setReturnNullPipeline(true);

			const result = await leakyBucket(
				redis,
				`${testKeyPrefix}-10`,
				10,
				60000,
				logger,
			);

			expect(result.allowed).toBe(true);
			expect(result.remaining).toBe(10);
			expect(logger.warn).toHaveBeenCalledWith(
				expect.objectContaining({
					msg: "leakyBucket failure; allowing request",
					key: `${testKeyPrefix}-10`,
				}),
			);
		});
	});

	describe("error handling - pipeline command errors", () => {
		it("should handle errors in pipeline command results", async () => {
			redis.setFailPipelineCommand(true);

			const result = await leakyBucket(
				redis,
				`${testKeyPrefix}-11`,
				10,
				60000,
				logger,
			);

			expect(result.allowed).toBe(true);
			expect(result.remaining).toBe(10);
			expect(logger.warn).toHaveBeenCalledWith(
				expect.objectContaining({
					msg: "leakyBucket failure; allowing request",
					key: `${testKeyPrefix}-11`,
				}),
			);
		});
	});

	describe("error handling - Redis unavailable", () => {
		it("should degrade gracefully when Redis throws error", async () => {
			redis.setFailPipeline(true);

			const result = await leakyBucket(
				redis,
				`${testKeyPrefix}-12`,
				10,
				60000,
				logger,
			);

			expect(result.allowed).toBe(true);
			expect(result.remaining).toBe(10);
			expect(logger.warn).toHaveBeenCalledWith(
				expect.objectContaining({
					msg: "leakyBucket failure; allowing request",
					key: `${testKeyPrefix}-12`,
					err: expect.any(Error),
				}),
			);
		});

		it("should degrade gracefully without logger when Redis fails", async () => {
			redis.setFailPipeline(true);

			const result = await leakyBucket(redis, `${testKeyPrefix}-13`, 5, 30000);

			expect(result.allowed).toBe(true);
			expect(result.remaining).toBe(5);
		});
	});

	describe("error handling - second pipeline failures", () => {
		it("should degrade gracefully when second pipeline returns null", async () => {
			redis.setReturnNullPipelineOnSecondExec(true);

			const result = await leakyBucket(
				redis,
				`${testKeyPrefix}-14a`,
				10,
				60000,
				logger,
			);

			expect(result.allowed).toBe(true);
			expect(result.remaining).toBe(10);
			expect(logger.warn).toHaveBeenCalledWith(
				expect.objectContaining({
					msg: "leakyBucket failure; allowing request",
					key: `${testKeyPrefix}-14a`,
				}),
			);
		});

		it("should degrade gracefully when second pipeline command has errors", async () => {
			redis.setFailPipelineCommandOnSecondExec(true);

			const result = await leakyBucket(
				redis,
				`${testKeyPrefix}-14b`,
				10,
				60000,
				logger,
			);

			expect(result.allowed).toBe(true);
			expect(result.remaining).toBe(10);
			expect(logger.warn).toHaveBeenCalledWith(
				expect.objectContaining({
					msg: "leakyBucket failure; allowing request",
					key: `${testKeyPrefix}-14b`,
					err: expect.any(Error),
				}),
			);
		});
	});

	describe("edge cases", () => {
		it("should handle limit of 1", async () => {
			const result = await leakyBucket(
				redis,
				`${testKeyPrefix}-14`,
				1,
				60000,
				logger,
			);

			expect(result.allowed).toBe(true);
			expect(result.remaining).toBe(0);
		});

		it("should handle very short window", async () => {
			const result = await leakyBucket(
				redis,
				`${testKeyPrefix}-15`,
				10,
				100,
				logger,
			);

			expect(result.allowed).toBe(true);
			expect(result.remaining).toBe(9);
		});

		it("should handle large limit", async () => {
			const result = await leakyBucket(
				redis,
				`${testKeyPrefix}-16`,
				1000,
				60000,
				logger,
			);

			expect(result.allowed).toBe(true);
			expect(result.remaining).toBe(999);
		});

		it("should calculate resetAt correctly for allowed request", async () => {
			const windowMs = 60000;

			const result = await leakyBucket(
				redis,
				`${testKeyPrefix}-17`,
				10,
				windowMs,
				logger,
			);

			expect(result.allowed).toBe(true);
			expect(result.resetAt).toBe(NOW + windowMs);
		});

		it("should handle empty zrange result when calculating resetAt", async () => {
			const now = Date.now();
			const windowMs = 60000;

			// Enable empty zrange simulation
			redis.setReturnEmptyZRange(true);

			const result = await leakyBucket(
				redis,
				`${testKeyPrefix}-18`,
				10,
				windowMs,
				logger,
			);

			expect(result.allowed).toBe(true);
			expect(result.resetAt).toBeGreaterThan(now);
		});
	});
});

describe("complexityLeakyBucket", () => {
	let redis: FakeRedisHash;
	let fastify: FastifyInstance;
	let logger: AppLogger;
	let testKeyPrefix: string;
	const NOW = 1625097600000;

	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(NOW);
		redis = new FakeRedisHash();
		testKeyPrefix = faker.string.uuid();
		fastify = {
			redis,
		} as unknown as FastifyInstance;
		logger = {
			debug: vi.fn(),
			info: vi.fn(),
			warn: vi.fn(),
			error: vi.fn(),
		} as unknown as AppLogger;
	});

	afterEach(() => {
		redis.clear();
		vi.clearAllMocks();
		vi.useRealTimers();
	});

	describe("bucket initialization", () => {
		it("should initialize new bucket with full capacity", async () => {
			const result = await complexityLeakyBucket(
				fastify,
				`${testKeyPrefix}-1`,
				100,
				10,
				5,
				logger,
			);

			expect(result).toBe(true);
			expect(logger.debug).toHaveBeenCalledWith(
				expect.objectContaining({
					tokens: 100,
				}),
				"Leaky bucket state",
			);

			// Verify bucket was stored in Redis
			const bucket = await redis.hgetall(`${testKeyPrefix}-1`);
			expect(bucket.tokens).toBeDefined();
			expect(bucket.lastUpdate).toBeDefined();
			expect(Number.parseFloat(bucket.tokens ?? "0")).toBe(95); // 100 - 5
		});

		it("should initialize bucket when hgetall returns empty object", async () => {
			redis.setHash(`${testKeyPrefix}-2`, {});

			const result = await complexityLeakyBucket(
				fastify,
				`${testKeyPrefix}-2`,
				100,
				10,
				5,
				logger,
			);

			expect(result).toBe(true);
		});
	});

	describe("token refill behavior", () => {
		it("should refill tokens based on elapsed time", async () => {
			const now = Date.now();
			const lastUpdate = now - 5000; // 5 seconds ago

			redis.setHash(`${testKeyPrefix}-3`, {
				tokens: "50",
				lastUpdate: lastUpdate.toString(),
			});

			// refillRate = 10 tokens/sec, elapsed = 5 sec → refill 50 tokens
			// 50 + 50 = 100 (at capacity)
			const result = await complexityLeakyBucket(
				fastify,
				`${testKeyPrefix}-3`,
				100,
				10,
				5,
				logger,
			);

			expect(result).toBe(true);
			expect(logger.debug).toHaveBeenCalledWith(
				expect.objectContaining({
					tokens: expect.any(Number),
					lastUpdate: lastUpdate,
				}),
				"Leaky bucket state",
			);
		});

		it("should cap refilled tokens at capacity", async () => {
			const now = Date.now();
			const lastUpdate = now - 20000; // 20 seconds ago

			redis.setHash(`${testKeyPrefix}-4`, {
				tokens: "50",
				lastUpdate: lastUpdate.toString(),
			});

			// refillRate = 10 tokens/sec, elapsed = 20 sec → would refill 200 tokens
			// But should cap at capacity (100)
			const result = await complexityLeakyBucket(
				fastify,
				`${testKeyPrefix}-4`,
				100,
				10,
				5,
				logger,
			);

			expect(result).toBe(true);

			const bucket = await redis.hgetall(`${testKeyPrefix}-4`);
			expect(Number.parseFloat(bucket.tokens ?? "0")).toBe(95); // capped at 100, then - 5
		});

		it("should handle zero refill rate", async () => {
			const now = Date.now();
			const lastUpdate = now - 5000;

			redis.setHash(`${testKeyPrefix}-5`, {
				tokens: "50",
				lastUpdate: lastUpdate.toString(),
			});

			const result = await complexityLeakyBucket(
				fastify,
				`${testKeyPrefix}-5`,
				100,
				0, // No refill
				5,
				logger,
			);

			expect(result).toBe(true);

			const bucket = await redis.hgetall(`${testKeyPrefix}-5`);
			expect(Number.parseFloat(bucket.tokens ?? "0")).toBe(45); // 50 - 5, no refill
		});
	});

	describe("request allowed (sufficient tokens)", () => {
		it("should allow request when sufficient tokens available", async () => {
			redis.setHash(`${testKeyPrefix}-6`, {
				tokens: "100",
				lastUpdate: Date.now().toString(),
			});

			const result = await complexityLeakyBucket(
				fastify,
				`${testKeyPrefix}-6`,
				100,
				10,
				20,
				logger,
			);

			expect(result).toBe(true);

			const bucket = await redis.hgetall(`${testKeyPrefix}-6`);
			expect(Number.parseFloat(bucket.tokens ?? "0")).toBe(80); // 100 - 20
		});

		it("should allow request with exact token count", async () => {
			redis.setHash(`${testKeyPrefix}-7`, {
				tokens: "50",
				lastUpdate: Date.now().toString(),
			});

			const result = await complexityLeakyBucket(
				fastify,
				`${testKeyPrefix}-7`,
				100,
				10,
				50, // Exact match
				logger,
			);

			expect(result).toBe(true);

			const bucket = await redis.hgetall(`${testKeyPrefix}-7`);
			expect(Number.parseFloat(bucket.tokens ?? "0")).toBe(0);
		});

		it("should allow request with zero cost", async () => {
			redis.setHash(`${testKeyPrefix}-8`, {
				tokens: "50",
				lastUpdate: Date.now().toString(),
			});

			const result = await complexityLeakyBucket(
				fastify,
				`${testKeyPrefix}-8`,
				100,
				10,
				0, // Zero cost
				logger,
			);

			expect(result).toBe(true);

			const bucket = await redis.hgetall(`${testKeyPrefix}-8`);
			expect(Number.parseFloat(bucket.tokens ?? "0")).toBe(50); // No deduction
		});
	});

	describe("request rejected (insufficient tokens)", () => {
		it("should reject request when insufficient tokens", async () => {
			redis.setHash(`${testKeyPrefix}-9`, {
				tokens: "10",
				lastUpdate: Date.now().toString(),
			});

			const result = await complexityLeakyBucket(
				fastify,
				`${testKeyPrefix}-9`,
				100,
				10,
				20, // Need 20, have 10
				logger,
			);

			expect(result).toBe(false);

			// Token count should NOT be updated
			const bucket = await redis.hgetall(`${testKeyPrefix}-9`);
			expect(Number.parseFloat(bucket.tokens ?? "0")).toBe(10); // Unchanged
		});

		it("should reject request when cost exceeds capacity", async () => {
			const result = await complexityLeakyBucket(
				fastify,
				`${testKeyPrefix}-10`,
				100,
				10,
				150, // Cost exceeds capacity
				logger,
			);

			expect(result).toBe(false);
		});

		it("should reject when tokens just below cost", async () => {
			redis.setHash(`${testKeyPrefix}-11`, {
				tokens: "19.9",
				lastUpdate: Date.now().toString(),
			});

			const result = await complexityLeakyBucket(
				fastify,
				`${testKeyPrefix}-11`,
				100,
				10,
				20,
				logger,
			);

			expect(result).toBe(false);
		});
	});

	describe("edge cases - invalid bucket data", () => {
		it("should handle missing tokens field", async () => {
			redis.setHash(`${testKeyPrefix}-12`, {
				lastUpdate: Date.now().toString(),
			});

			const result = await complexityLeakyBucket(
				fastify,
				`${testKeyPrefix}-12`,
				100,
				10,
				5,
				logger,
			);

			expect(result).toBe(true);
		});

		it("should handle missing lastUpdate field", async () => {
			redis.setHash(`${testKeyPrefix}-13`, {
				tokens: "50",
			});

			const result = await complexityLeakyBucket(
				fastify,
				`${testKeyPrefix}-13`,
				100,
				10,
				5,
				logger,
			);

			expect(result).toBe(true);
		});

		it("should handle non-numeric tokens value", async () => {
			redis.setHash(`${testKeyPrefix}-14`, {
				tokens: "invalid",
				lastUpdate: Date.now().toString(),
			});

			const result = await complexityLeakyBucket(
				fastify,
				`${testKeyPrefix}-14`,
				100,
				10,
				5,
				logger,
			);

			// "invalid" parses to NaN, falls back to 0.
			// With 0 tokens and minimal elapsed time, request should be rejected (cost 5 > tokens 0).

			expect(result).toBe(false);
		});

		it("should handle non-numeric lastUpdate value", async () => {
			redis.setHash(`${testKeyPrefix}-15`, {
				tokens: "50",
				lastUpdate: "invalid",
			});

			const result = await complexityLeakyBucket(
				fastify,
				`${testKeyPrefix}-15`,
				100,
				10,
				5,
				logger,
			);

			// Should use current time as fallback
			expect(result).toBe(true);
		});
	});

	describe("timestamp and state updates", () => {
		it("should update lastUpdate timestamp after request", async () => {
			const oldTimestamp = Date.now() - 10000;
			redis.setHash(`${testKeyPrefix}-16`, {
				tokens: "100",
				lastUpdate: oldTimestamp.toString(),
			});

			await complexityLeakyBucket(
				fastify,
				`${testKeyPrefix}-16`,
				100,
				10,
				5,
				logger,
			);

			const bucket = await redis.hgetall(`${testKeyPrefix}-16`);
			const newTimestamp = Number.parseInt(bucket.lastUpdate ?? "0", 10);
			expect(newTimestamp).toBeGreaterThan(oldTimestamp);
			expect(newTimestamp).toBeLessThanOrEqual(Date.now());
		});

		it("should maintain accurate token count across multiple requests", async () => {
			// First request
			await complexityLeakyBucket(
				fastify,
				`${testKeyPrefix}-17`,
				100,
				10,
				20,
				logger,
			);
			let bucket = await redis.hgetall(`${testKeyPrefix}-17`);
			expect(Number.parseFloat(bucket.tokens ?? "0")).toBe(80);

			// Second request (no time elapsed)
			await complexityLeakyBucket(
				fastify,
				`${testKeyPrefix}-17`,
				100,
				10,
				30,
				logger,
			);
			bucket = await redis.hgetall(`${testKeyPrefix}-17`);
			expect(Number.parseFloat(bucket.tokens ?? "0")).toBe(50);

			// Third request
			await complexityLeakyBucket(
				fastify,
				`${testKeyPrefix}-17`,
				100,
				10,
				10,
				logger,
			);
			bucket = await redis.hgetall(`${testKeyPrefix}-17`);
			expect(Number.parseFloat(bucket.tokens ?? "0")).toBe(40);
		});
	});

	describe("logger calls", () => {
		it("should log bucket state on each call", async () => {
			await complexityLeakyBucket(
				fastify,
				`${testKeyPrefix}-18`,
				100,
				10,
				5,
				logger,
			);

			expect(logger.debug).toHaveBeenCalledWith(
				{
					tokens: expect.any(Number),
					lastUpdate: expect.any(Number),
				},
				"Leaky bucket state",
			);
		});

		it("should log state for both allowed and rejected requests", async () => {
			// Allowed request
			await complexityLeakyBucket(
				fastify,
				`${testKeyPrefix}-19`,
				100,
				10,
				50,
				logger,
			);
			expect(logger.debug).toHaveBeenCalled();

			vi.clearAllMocks();

			// Rejected request
			redis.setHash(`${testKeyPrefix}-19`, {
				tokens: "10",
				lastUpdate: Date.now().toString(),
			});
			await complexityLeakyBucket(
				fastify,
				`${testKeyPrefix}-19`,
				100,
				10,
				50,
				logger,
			);
			expect(logger.debug).toHaveBeenCalled();
		});
	});
});
