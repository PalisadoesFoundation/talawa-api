import { describe, expect, it } from "vitest";
import {
	entityKey,
	listKey,
	stableStringify,
} from "~/src/services/caching/cacheKeyGenerator";

describe("cacheKeyGenerator", () => {
	describe("entityKey", () => {
		it("should generate correct key format with string ID", () => {
			const key = entityKey("user", "abc123");
			expect(key).toBe("talawa:v1:user:abc123");
		});

		it("should generate correct key format with number ID", () => {
			const key = entityKey("organization", 456);
			expect(key).toBe("talawa:v1:organization:456");
		});

		it("should handle different entity types", () => {
			expect(entityKey("event", "e1")).toBe("talawa:v1:event:e1");
			expect(entityKey("post", "p1")).toBe("talawa:v1:post:p1");
			expect(entityKey("action_item", "ai1")).toBe("talawa:v1:action_item:ai1");
		});
	});

	describe("stableStringify", () => {
		it("should produce consistent output regardless of key order", () => {
			const obj1 = { b: 2, a: 1 };
			const obj2 = { a: 1, b: 2 };

			expect(stableStringify(obj1)).toBe(stableStringify(obj2));
		});

		it("should handle nested objects consistently", () => {
			const obj1 = { outer: { z: 3, y: 2, x: 1 } };
			const obj2 = { outer: { x: 1, y: 2, z: 3 } };

			expect(stableStringify(obj1)).toBe(stableStringify(obj2));
		});

		it("should preserve arrays in order", () => {
			const obj = { items: [3, 1, 2] };
			const result = stableStringify(obj);
			expect(result).toBe('{"items":[3,1,2]}');
		});

		it("should handle primitive values", () => {
			expect(stableStringify("string")).toBe('"string"');
			expect(stableStringify(123)).toBe("123");
			expect(stableStringify(null)).toBe("null");
			expect(stableStringify(true)).toBe("true");
		});
		it("should handle undefined properties by omitting them", () => {
			const obj1 = { a: 1, b: undefined };
			const obj2 = { a: 1 };
			expect(stableStringify(obj1)).toBe(stableStringify(obj2));
			expect(stableStringify(obj1)).toBe('{"a":1}');
		});

		it("should serialize Date objects to ISO string", () => {
			const date = new Date("2024-01-01T00:00:00.000Z");
			expect(stableStringify({ d: date })).toBe(
				'{"d":"2024-01-01T00:00:00.000Z"}',
			);
		});

		it("should throw TypeError for BigInt inputs", () => {
			// standard JSON.stringify behavior
			expect(() => stableStringify({ b: 1n })).toThrow(TypeError);
		});
	});

	describe("listKey", () => {
		it("should generate list key with hash", () => {
			const key = listKey("organization", { limit: 10, offset: 0 });
			expect(key).toMatch(/^talawa:v1:organization:list:[a-f0-9]{40}$/);
		});

		it("should produce same hash for same args", () => {
			const args = { filter: "active", limit: 20 };
			const key1 = listKey("user", args);
			const key2 = listKey("user", args);

			expect(key1).toBe(key2);
		});

		it("should produce same hash regardless of key order", () => {
			const key1 = listKey("event", { b: 2, a: 1 });
			const key2 = listKey("event", { a: 1, b: 2 });

			expect(key1).toBe(key2);
		});

		it("should produce different hash for different args", () => {
			const key1 = listKey("post", { limit: 10 });
			const key2 = listKey("post", { limit: 20 });

			expect(key1).not.toBe(key2);
		});

		it("should produce different hash for different entities", () => {
			const args = { limit: 10 };
			const key1 = listKey("user", args);
			const key2 = listKey("organization", args);

			// Same hash suffix but different entity prefix
			expect(key1).not.toBe(key2);
			expect(key1.split(":list:")[1]).toBe(key2.split(":list:")[1]);
		});
	});
});
