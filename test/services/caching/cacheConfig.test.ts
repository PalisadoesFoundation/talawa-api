import { afterEach, describe, expect, it, vi } from "vitest";

// We need to test cacheConfig in isolation to control env vars
describe("cacheConfig", () => {
	const originalEnv = process.env.CACHE_ENTITY_TTLS;

	afterEach(() => {
		// Restore original env
		if (originalEnv !== undefined) {
			process.env.CACHE_ENTITY_TTLS = originalEnv;
		} else {
			delete process.env.CACHE_ENTITY_TTLS;
		}
		vi.resetModules();
	});

	describe("defaultEntityTTL", () => {
		it("should have default TTL values", async () => {
			delete process.env.CACHE_ENTITY_TTLS;
			vi.resetModules();
			const { defaultEntityTTL } = await import(
				"~/src/services/caching/cacheConfig"
			);
			expect(defaultEntityTTL.user).toBe(300);
			expect(defaultEntityTTL.organization).toBe(300);
			expect(defaultEntityTTL.event).toBe(120);
			expect(defaultEntityTTL.post).toBe(60);
		});
	});

	describe("getTTL", () => {
		it("should return default TTL when no env override", async () => {
			delete process.env.CACHE_ENTITY_TTLS;
			vi.resetModules();
			const { getTTL } = await import("~/src/services/caching/cacheConfig");
			expect(getTTL("user")).toBe(300);
			expect(getTTL("organization")).toBe(300);
			expect(getTTL("event")).toBe(120);
			expect(getTTL("post")).toBe(60);
		});

		it("should return overridden TTL from env var", async () => {
			process.env.CACHE_ENTITY_TTLS = JSON.stringify({ user: 600, event: 240 });
			vi.resetModules();
			const { getTTL } = await import("~/src/services/caching/cacheConfig");
			expect(getTTL("user")).toBe(600);
			expect(getTTL("event")).toBe(240);
			// Non-overridden should use default
			expect(getTTL("organization")).toBe(300);
			expect(getTTL("post")).toBe(60);
		});

		it("should handle invalid JSON in env var gracefully", async () => {
			const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
			process.env.CACHE_ENTITY_TTLS = "not-valid-json{";
			vi.resetModules();
			const { getTTL } = await import("~/src/services/caching/cacheConfig");
			// Should fall back to defaults
			expect(getTTL("user")).toBe(300);
			expect(warnSpy).toHaveBeenCalledWith(
				expect.stringContaining("Failed to parse CACHE_ENTITY_TTLS as JSON"),
			);
			warnSpy.mockRestore();
		});

		it("should ignore invalid TTL values in env overrides", async () => {
			const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
			process.env.CACHE_ENTITY_TTLS = JSON.stringify({
				user: -100, // Invalid: negative
				organization: "invalid", // Invalid: string
				event: 0, // Invalid: zero
				post: null, // Invalid: null
			});
			vi.resetModules();
			const { getTTL, defaultEntityTTL } = await import(
				"~/src/services/caching/cacheConfig"
			);

			// Should use defaults for invalid values
			expect(getTTL("user")).toBe(defaultEntityTTL.user);
			expect(getTTL("organization")).toBe(defaultEntityTTL.organization);
			expect(getTTL("event")).toBe(defaultEntityTTL.event);
			expect(getTTL("post")).toBe(defaultEntityTTL.post);

			expect(warnSpy).toHaveBeenCalledTimes(4);
			expect(warnSpy).toHaveBeenCalledWith(
				expect.stringContaining('Invalid TTL for "user"'),
			);
			warnSpy.mockRestore();
		});

		it("should fall back to default for negative TTL", async () => {
			const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
			process.env.CACHE_ENTITY_TTLS = JSON.stringify({ user: -50 });
			vi.resetModules();
			const { getTTL, defaultEntityTTL } = await import(
				"~/src/services/caching/cacheConfig"
			);

			expect(getTTL("user")).toBe(defaultEntityTTL.user);
			expect(warnSpy).toHaveBeenCalledWith(
				expect.stringContaining('Invalid TTL for "user"'),
			);
			warnSpy.mockRestore();
		});

		it("should fall back to default for zero TTL", async () => {
			const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
			process.env.CACHE_ENTITY_TTLS = JSON.stringify({ event: 0 });
			vi.resetModules();
			const { getTTL, defaultEntityTTL } = await import(
				"~/src/services/caching/cacheConfig"
			);

			expect(getTTL("event")).toBe(defaultEntityTTL.event);
			expect(warnSpy).toHaveBeenCalledWith(
				expect.stringContaining('Invalid TTL for "event"'),
			);
			warnSpy.mockRestore();
		});

		it("should fall back to default for string TTL", async () => {
			const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
			process.env.CACHE_ENTITY_TTLS = JSON.stringify({
				organization: "not-a-number",
			});
			vi.resetModules();
			const { getTTL, defaultEntityTTL } = await import(
				"~/src/services/caching/cacheConfig"
			);

			expect(getTTL("organization")).toBe(defaultEntityTTL.organization);
			expect(warnSpy).toHaveBeenCalledWith(
				expect.stringContaining('Invalid TTL for "organization"'),
			);
			warnSpy.mockRestore();
		});

		it("should fall back to default for null TTL", async () => {
			const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
			process.env.CACHE_ENTITY_TTLS = JSON.stringify({ post: null });
			vi.resetModules();
			const { getTTL, defaultEntityTTL } = await import(
				"~/src/services/caching/cacheConfig"
			);

			expect(getTTL("post")).toBe(defaultEntityTTL.post);
			expect(warnSpy).toHaveBeenCalledWith(
				expect.stringContaining('Invalid TTL for "post"'),
			);
			warnSpy.mockRestore();
		});

		it("should fall back to default for missing key in override", async () => {
			process.env.CACHE_ENTITY_TTLS = JSON.stringify({ user: 600 });
			vi.resetModules();
			const { getTTL, defaultEntityTTL } = await import(
				"~/src/services/caching/cacheConfig"
			);

			// user is overridden, but organization is not in env
			expect(getTTL("user")).toBe(600);
			expect(getTTL("organization")).toBe(defaultEntityTTL.organization);
		});
	});

	describe("CacheNamespace", () => {
		it("should export the namespace constant", async () => {
			const { CacheNamespace } = await import(
				"~/src/services/caching/cacheConfig"
			);
			expect(CacheNamespace).toBe("talawa:v1");
		});
	});
});
