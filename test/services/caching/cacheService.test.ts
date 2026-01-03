import { beforeEach, describe, expect, it, vi } from "vitest";
import { RedisCacheService } from "~/src/services/caching/RedisCacheService";

/**
 * FakeRedis mock that simulates Redis behavior for testing.
 * Supports TTL expiration and basic SCAN/MATCH pattern matching.
 */
class FakeRedis {
	store = new Map<string, { v: string; expAt?: number }>();

	async get(k: string): Promise<string | null> {
		const e = this.store.get(k);
		if (!e) return null;
		if (e.expAt && Date.now() > e.expAt) {
			this.store.delete(k);
			return null;
		}
		return e.v;
	}

	async setex(k: string, ttl: number, v: string): Promise<void> {
		this.store.set(k, { v, expAt: Date.now() + ttl * 1000 });
	}

	async del(...keys: string[]): Promise<number> {
		let count = 0;
		for (const k of keys) {
			if (this.store.delete(k)) count++;
		}
		return count;
	}

	async scan(
		_cursor: string,
		_match: string,
		pattern: string,
		_count: string,
		_countValue: number,
	): Promise<[string, string[]]> {
		// Convert glob pattern to regex (simple * support)
		const regex = new RegExp(`^${pattern.replace(/\*/g, ".*")}$`);
		const keys = Array.from(this.store.keys()).filter((k) => regex.test(k));
		// Naive single-page scan - return all matching keys and cursor "0" to indicate done
		return ["0", keys];
	}

	async mget(...keys: string[]): Promise<(string | null)[]> {
		return Promise.all(keys.map((k) => this.get(k)));
	}
}

/**
 * Mock logger for testing.
 */
const mockLogger = {
	debug: vi.fn(),
	warn: vi.fn(),
	error: vi.fn(),
};

describe("RedisCacheService", () => {
	let redis: FakeRedis;
	let cache: RedisCacheService;

	beforeEach(() => {
		redis = new FakeRedis();
		cache = new RedisCacheService(redis as never, mockLogger);
		vi.clearAllMocks();
	});

	describe("get/set", () => {
		it("should store and retrieve values", async () => {
			await cache.set("key1", { name: "test" }, 300);
			const result = await cache.get<{ name: string }>("key1");
			expect(result).toEqual({ name: "test" });
		});

		it("should return null for non-existent keys", async () => {
			const result = await cache.get("nonexistent");
			expect(result).toBeNull();
		});

		it("should respect TTL expiration", async () => {
			vi.useFakeTimers();
			await cache.set("expiring", { value: 1 }, 1); // 1 second TTL
			expect(await cache.get("expiring")).toEqual({ value: 1 });

			// Advance time to expire TTL
			vi.advanceTimersByTime(1100);

			expect(await cache.get("expiring")).toBeNull();
			vi.useRealTimers();
		});

		it("should handle complex objects", async () => {
			const complex = {
				id: "123",
				nested: { array: [1, 2, 3], map: { a: "b" } },
				date: "2024-01-01",
			};
			await cache.set("complex", complex, 300);
			expect(await cache.get("complex")).toEqual(complex);
		});
	});

	describe("del", () => {
		it("should delete a single key", async () => {
			await cache.set("toDelete", { value: 1 }, 300);
			expect(await cache.get("toDelete")).toEqual({ value: 1 });

			await cache.del("toDelete");
			expect(await cache.get("toDelete")).toBeNull();
		});

		it("should delete multiple keys", async () => {
			await cache.set("key1", "a", 300);
			await cache.set("key2", "b", 300);
			await cache.set("key3", "c", 300);

			await cache.del(["key1", "key2"]);

			expect(await cache.get("key1")).toBeNull();
			expect(await cache.get("key2")).toBeNull();
			expect(await cache.get("key3")).toBe("c");
		});

		it("should handle empty array gracefully", async () => {
			await expect(cache.del([])).resolves.not.toThrow();
		});
	});

	describe("clearByPattern", () => {
		it("should clear keys matching pattern", async () => {
			await cache.set("talawa:v1:user:1", { id: 1 }, 300);
			await cache.set("talawa:v1:user:2", { id: 2 }, 300);
			await cache.set("talawa:v1:org:1", { id: 1 }, 300);

			await cache.clearByPattern("talawa:v1:user:*");

			expect(await cache.get("talawa:v1:user:1")).toBeNull();
			expect(await cache.get("talawa:v1:user:2")).toBeNull();
			expect(await cache.get("talawa:v1:org:1")).toEqual({ id: 1 });
		});

		it("should handle list key patterns", async () => {
			await cache.set("talawa:v1:org:list:abc123", [1, 2], 300);
			await cache.set("talawa:v1:org:list:def456", [3, 4], 300);
			await cache.set("talawa:v1:org:1", { id: 1 }, 300);

			await cache.clearByPattern("talawa:v1:org:list:*");

			expect(await cache.get("talawa:v1:org:list:abc123")).toBeNull();
			expect(await cache.get("talawa:v1:org:list:def456")).toBeNull();
			expect(await cache.get("talawa:v1:org:1")).toEqual({ id: 1 });
		});
	});

	describe("mget", () => {
		it("should batch get multiple keys", async () => {
			await cache.set("m1", { id: 1 }, 300);
			await cache.set("m2", { id: 2 }, 300);
			await cache.set("m3", { id: 3 }, 300);

			const results = await cache.mget<{ id: number }>(["m1", "m3", "m4"]);

			expect(results).toEqual([{ id: 1 }, { id: 3 }, null]);
		});

		it("should return empty array for empty keys", async () => {
			const results = await cache.mget([]);
			expect(results).toEqual([]);
		});
	});

	describe("mset", () => {
		it("should batch set multiple entries", async () => {
			await cache.mset([
				{ key: "b1", value: { id: 1 }, ttlSeconds: 300 },
				{ key: "b2", value: { id: 2 }, ttlSeconds: 300 },
			]);

			expect(await cache.get("b1")).toEqual({ id: 1 });
			expect(await cache.get("b2")).toEqual({ id: 2 });
		});

		it("should handle empty entries gracefully", async () => {
			await expect(cache.mset([])).resolves.not.toThrow();
		});
	});

	describe("graceful degradation", () => {
		it("should log warning on get error and return null", async () => {
			const failingRedis = {
				get: vi.fn().mockRejectedValue(new Error("connection failed")),
			};
			const failCache = new RedisCacheService(
				failingRedis as never,
				mockLogger,
			);

			const result = await failCache.get("key");

			expect(result).toBeNull();
			expect(mockLogger.warn).toHaveBeenCalled();
		});

		it("should log warning on set error and not throw", async () => {
			const failingRedis = {
				setex: vi.fn().mockRejectedValue(new Error("connection failed")),
			};
			const failCache = new RedisCacheService(
				failingRedis as never,
				mockLogger,
			);

			await expect(failCache.set("key", "value", 300)).resolves.not.toThrow();
			expect(mockLogger.warn).toHaveBeenCalled();
		});

		it("should log warning on del error and not throw", async () => {
			const failingRedis = {
				del: vi.fn().mockRejectedValue(new Error("connection failed")),
			};
			const failCache = new RedisCacheService(
				failingRedis as never,
				mockLogger,
			);

			await expect(failCache.del("key")).resolves.not.toThrow();
			expect(mockLogger.warn).toHaveBeenCalled();
		});

		it("should log warning on clearByPattern error and not throw", async () => {
			const failingRedis = {
				scan: vi.fn().mockRejectedValue(new Error("connection failed")),
			};
			const failCache = new RedisCacheService(
				failingRedis as never,
				mockLogger,
			);

			await expect(
				failCache.clearByPattern("pattern:*"),
			).resolves.not.toThrow();
			expect(mockLogger.warn).toHaveBeenCalled();
		});

		it("should log warning on mget error and return nulls", async () => {
			const failingRedis = {
				mget: vi.fn().mockRejectedValue(new Error("connection failed")),
			};
			const failCache = new RedisCacheService(
				failingRedis as never,
				mockLogger,
			);

			const result = await failCache.mget(["key1", "key2"]);

			expect(result).toEqual([null, null]);
			expect(mockLogger.warn).toHaveBeenCalled();
		});

		it("should log warning on mset error and not throw", async () => {
			const failingRedis = {
				setex: vi.fn().mockRejectedValue(new Error("connection failed")),
			};
			const failCache = new RedisCacheService(
				failingRedis as never,
				mockLogger,
			);

			await expect(
				failCache.mset([{ key: "k1", value: "v1", ttlSeconds: 300 }]),
			).resolves.not.toThrow();
			expect(mockLogger.warn).toHaveBeenCalled();
		});

		it("should handle invalid JSON in mget response gracefully", async () => {
			const badJsonRedis = {
				mget: vi.fn().mockResolvedValue(["not-valid-json{", '{"valid":true}']),
			};
			const badJsonCache = new RedisCacheService(
				badJsonRedis as never,
				mockLogger,
			);

			const result = await badJsonCache.mget(["key1", "key2"]);

			// Invalid JSON should return null, valid should parse
			expect(result).toEqual([null, { valid: true }]);
		});
		it("should log warning or return null when get receives invalid JSON", async () => {
			const invalidJsonRedis = {
				get: vi.fn().mockResolvedValue("invalid-json{"),
			};
			const invalidJsonCache = new RedisCacheService(
				invalidJsonRedis as never,
				mockLogger,
			);

			const result = await invalidJsonCache.get("key");

			expect(result).toBeNull();
			// JSON.parse error is caught
			expect(mockLogger.warn).toHaveBeenCalledWith(
				expect.objectContaining({ msg: "cache get failed" }),
			);
		});

		it("should log warning on mset unexpected error (e.g. serialization)", async () => {
			const circular: { self?: unknown } = {};
			circular.self = circular;

			await expect(
				cache.mset([{ key: "k1", value: circular, ttlSeconds: 300 }]),
			).resolves.not.toThrow();

			expect(mockLogger.warn).toHaveBeenCalledWith(
				expect.objectContaining({ msg: "cache mset failed" }),
			);
		});
	});
});
