import { describe, expect, it } from "vitest";
import { pluginIdSchema } from "../../src/utilities/validators";

describe("pluginIdSchema", () => {
	describe("valid plugin IDs", () => {
		it("should accept a simple lowercase plugin ID", () => {
			expect(pluginIdSchema.parse("myplugin")).toBe("myplugin");
		});

		it("should accept a camelCase plugin ID", () => {
			expect(pluginIdSchema.parse("myPlugin")).toBe("myPlugin");
		});

		it("should accept a PascalCase plugin ID", () => {
			expect(pluginIdSchema.parse("MyPlugin")).toBe("MyPlugin");
		});

		it("should accept plugin ID with underscores", () => {
			expect(pluginIdSchema.parse("my_plugin")).toBe("my_plugin");
		});

		it("should accept plugin ID with hyphens", () => {
			expect(pluginIdSchema.parse("my-plugin")).toBe("my-plugin");
		});

		it("should accept plugin ID with numbers", () => {
			expect(pluginIdSchema.parse("plugin123")).toBe("plugin123");
		});

		it("should accept single letter plugin ID", () => {
			expect(pluginIdSchema.parse("a")).toBe("a");
		});

		it("should accept plugin ID at max length (100 chars)", () => {
			const longId = "a".repeat(100);
			expect(pluginIdSchema.parse(longId)).toBe(longId);
		});
	});

	describe("invalid plugin IDs - command injection prevention", () => {
		it("should reject plugin ID starting with number", () => {
			expect(() => pluginIdSchema.parse("123plugin")).toThrow();
		});

		it("should reject plugin ID starting with hyphen", () => {
			expect(() => pluginIdSchema.parse("-plugin")).toThrow();
		});

		it("should reject plugin ID with spaces", () => {
			expect(() => pluginIdSchema.parse("my plugin")).toThrow();
		});

		it("should reject plugin ID with special characters", () => {
			expect(() => pluginIdSchema.parse("plugin$")).toThrow();
			expect(() => pluginIdSchema.parse("plugin;")).toThrow();
			expect(() => pluginIdSchema.parse("plugin|")).toThrow();
			expect(() => pluginIdSchema.parse("plugin&")).toThrow();
		});

		it("should reject plugin ID with path traversal attempts", () => {
			expect(() => pluginIdSchema.parse("../malicious")).toThrow();
			expect(() => pluginIdSchema.parse("plugin/../../etc")).toThrow();
		});

		it("should reject plugin ID with shell metacharacters", () => {
			expect(() => pluginIdSchema.parse("plugin`whoami`")).toThrow();
			expect(() => pluginIdSchema.parse("plugin$(id)")).toThrow();
			expect(() => pluginIdSchema.parse("plugin;rm -rf /")).toThrow();
		});

		it("should reject empty plugin ID", () => {
			expect(() => pluginIdSchema.parse("")).toThrow();
		});

		it("should reject plugin ID exceeding max length", () => {
			const tooLongId = "a".repeat(101);
			expect(() => pluginIdSchema.parse(tooLongId)).toThrow();
		});

		it("should reject plugin ID starting with underscore", () => {
			expect(() => pluginIdSchema.parse("_plugin")).toThrow();
		});
	});

	describe("safeParse behavior", () => {
		it("should return success for valid plugin ID", () => {
			const result = pluginIdSchema.safeParse("validPlugin");
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data).toBe("validPlugin");
			}
		});

		it("should return error for invalid plugin ID", () => {
			const result = pluginIdSchema.safeParse("invalid plugin");
			expect(result.success).toBe(false);
		});
	});
});
