import { beforeEach, describe, expect, it } from "vitest";
import { MockCacheService } from "./performanceTestUtils";

describe("MockCacheService", () => {
	let cache: MockCacheService;

	beforeEach(() => {
		cache = new MockCacheService();
	});

	describe("clearByPattern", () => {
		it("should clear keys matching prefix wildcard pattern", async () => {
			await cache.set("metrics:agg:123", "value1", 300);
			await cache.set("metrics:agg:456", "value2", 300);
			await cache.set("other:key", "value3", 300);

			await cache.clearByPattern("metrics:agg:*");

			expect(await cache.get("metrics:agg:123")).toBeNull();
			expect(await cache.get("metrics:agg:456")).toBeNull();
			expect(await cache.get("other:key")).toBe("value3");
		});

		it("should clear keys matching suffix wildcard pattern", async () => {
			await cache.set("prefix:key1", "value1", 300);
			await cache.set("other:key1", "value2", 300);
			await cache.set("prefix:key2", "value3", 300);

			await cache.clearByPattern("*:key1");

			expect(await cache.get("prefix:key1")).toBeNull();
			expect(await cache.get("other:key1")).toBeNull();
			expect(await cache.get("prefix:key2")).toBe("value3");
		});

		it("should clear keys matching middle wildcard pattern", async () => {
			await cache.set("start:middle1:end", "value1", 300);
			await cache.set("start:middle2:end", "value2", 300);
			await cache.set("start:middle1:other", "value3", 300);

			await cache.clearByPattern("start:*:end");

			expect(await cache.get("start:middle1:end")).toBeNull();
			expect(await cache.get("start:middle2:end")).toBeNull();
			expect(await cache.get("start:middle1:other")).toBe("value3");
		});

		it("should clear keys matching multiple wildcards", async () => {
			await cache.set("a:b:c:d", "value1", 300);
			await cache.set("a:x:c:y", "value2", 300);
			await cache.set("a:b:z:d", "value3", 300);

			await cache.clearByPattern("a:*:c:*");

			expect(await cache.get("a:b:c:d")).toBeNull();
			expect(await cache.get("a:x:c:y")).toBeNull();
			expect(await cache.get("a:b:z:d")).toBe("value3");
		});

		it("should handle regex metacharacters in key names correctly", async () => {
			// Keys containing regex special chars: . + ^ $ { } ( ) | [ ] \
			await cache.set("key.with.dots", "value1", 300);
			await cache.set("key+with+plus", "value2", 300);
			await cache.set("key^with^caret", "value3", 300);
			await cache.set("key$with$dollar", "value4", 300);
			await cache.set("key{with}braces", "value5", 300);
			await cache.set("key(with)parens", "value6", 300);
			await cache.set("keywithoutspecial", "value7", 300);

			// Pattern with metachar should only match that specific key
			await cache.clearByPattern("key.with.dots");

			expect(await cache.get("key.with.dots")).toBeNull();
			// Without proper escaping, "." would match any char
			expect(await cache.get("key+with+plus")).toBe("value2");
			expect(await cache.get("keywithoutspecial")).toBe("value7");
		});

		it("should handle regex metacharacters with wildcards", async () => {
			await cache.set("prefix.test:value1", "v1", 300);
			await cache.set("prefix.test:value2", "v2", 300);
			await cache.set("prefix-test:value1", "v3", 300);

			// Pattern "prefix.test:*" - the dot should be literal
			await cache.clearByPattern("prefix.test:*");

			expect(await cache.get("prefix.test:value1")).toBeNull();
			expect(await cache.get("prefix.test:value2")).toBeNull();
			// Without escaping, "." would match "-" too
			expect(await cache.get("prefix-test:value1")).toBe("v3");
		});

		it("should clear all keys with single wildcard", async () => {
			await cache.set("key1", "value1", 300);
			await cache.set("key2", "value2", 300);
			await cache.set("other", "value3", 300);

			await cache.clearByPattern("*");

			expect(await cache.get("key1")).toBeNull();
			expect(await cache.get("key2")).toBeNull();
			expect(await cache.get("other")).toBeNull();
		});
	});

	describe("mset", () => {
		it("should set multiple entries in one call", async () => {
			const entries = [
				{ key: "key1", value: "value1", ttlSeconds: 100 },
				{ key: "key2", value: "value2", ttlSeconds: 200 },
				{ key: "key3", value: "value3", ttlSeconds: 300 },
			];

			await cache.mset(entries);

			expect(await cache.get("key1")).toBe("value1");
			expect(await cache.get("key2")).toBe("value2");
			expect(await cache.get("key3")).toBe("value3");
		});

		it("should retrieve multiple entries with mget", async () => {
			const entries = [
				{ key: "a", value: { data: 1 }, ttlSeconds: 100 },
				{ key: "b", value: { data: 2 }, ttlSeconds: 200 },
				{ key: "c", value: { data: 3 }, ttlSeconds: 300 },
			];

			await cache.mset(entries);

			const results = await cache.mget<{ data: number }>(["a", "b", "c", "d"]);

			expect(results).toEqual([
				{ data: 1 },
				{ data: 2 },
				{ data: 3 },
				null, // "d" doesn't exist
			]);
		});

		it("should handle empty entries array", async () => {
			await cache.mset([]);
			// Should not throw and store should remain empty
			expect(cache.store.size).toBe(0);
		});

		it("should overwrite existing keys", async () => {
			await cache.set("key1", "original", 300);

			await cache.mset([
				{ key: "key1", value: "updated", ttlSeconds: 100 },
				{ key: "key2", value: "new", ttlSeconds: 200 },
			]);

			expect(await cache.get("key1")).toBe("updated");
			expect(await cache.get("key2")).toBe("new");
		});
	});
});
