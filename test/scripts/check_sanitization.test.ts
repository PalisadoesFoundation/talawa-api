import * as fs from "node:fs/promises";
import { glob } from "glob";
import {
	afterEach,
	beforeEach,
	describe,
	expect,
	it,
	type Mock,
	vi,
} from "vitest";
import {
	checkSanitization,
	validateFileContent,
} from "../../scripts/check_sanitization";

// Mocks
vi.mock("node:fs/promises");
vi.mock("glob");

describe("check_sanitization", () => {
	describe("validateFileContent", () => {
		it("should pass files with escapeHTML import and usage", () => {
			const content = `
        import { escapeHTML } from "~/src/utilities/sanitizer";
        import { t } from "graphql";

        t.string({
          resolve: () => escapeHTML("foo")
        });
      `;
			const result = validateFileContent("test.ts", content);
			expect(result.isValid).toBe(true);
			expect(result.errors).toHaveLength(0);
		});

		it("should fail files with string resolvers but no escapeHTML import", () => {
			const content = `
        import { t } from "graphql";

        t.string({
          resolve: () => "foo"
        });
      `;
			const result = validateFileContent("test.ts", content);
			expect(result.isValid).toBe(false);
			expect(result.errors).toContain(
				"The file defines 1 string resolver(s) but does not import 'escapeHTML'.",
			);
		});

		it("should fail files with escapeHTML import but no usage", () => {
			const content = `
        import { escapeHTML } from "~/src/utilities/sanitizer";
        import { t } from "graphql";

        t.string({
          resolve: () => "foo"
        });
      `;
			const result = validateFileContent("test.ts", content);
			expect(result.isValid).toBe(false);
			expect(result.errors).toContain(
				"The file has 1 of 1 string resolver(s) missing escapeHTML sanitization.",
			);
		});

		it("should skip files with disable comment", () => {
			const content = `
        // check-sanitization-disable: test fixture for disable comment validation
        import { t } from "graphql";

        t.string({
          resolve: () => "foo"
        });
      `;
			const result = validateFileContent("test.ts", content);
			expect(result.isValid).toBe(true);
		});

		it("should flag t.field with type String", () => {
			const content = `
        import { t } from "graphql";

        t.field({
          type: "String",
          resolve: () => "foo"
        });
      `;
			const result = validateFileContent("test.ts", content);
			expect(result.isValid).toBe(false);
		});

		it("should not flag t.field with other types", () => {
			const content = `
        import { t } from "graphql";

        t.field({
          type: "Int",
          resolve: () => 123
        });
      `;
			const result = validateFileContent("test.ts", content);
			expect(result.isValid).toBe(true);
		});

		it("should not flag t.exposeString", () => {
			const content = `
        import { t } from "graphql";

        t.exposeString("name");
      `;
			const result = validateFileContent("test.ts", content);
			expect(result.isValid).toBe(true);
		});

		it("should pass nested resolvers with escapeHTML", () => {
			const content = `
        import { escapeHTML } from "~/src/utilities/sanitizer";
        import { t } from "graphql";

        t.string({
          resolve: () => {
            return escapeHTML("nested");
          }
        });
      `;
			const result = validateFileContent("test.ts", content);
			expect(result.isValid).toBe(true);
		});

		it("should support namespaced imports", () => {
			const content = `
        import * as sanitizer from "~/src/utilities/sanitizer";
        import { t } from "graphql";

        t.string({
          resolve: () => sanitizer.escapeHTML("foo")
        });
      `;
			const result = validateFileContent("test.ts", content);
			expect(result.isValid).toBe(true);
		});

		it("should support aliased imports", () => {
			const content = `
        import { escapeHTML as escape } from "~/src/utilities/sanitizer";
        import { t } from "graphql";

        t.string({
          resolve: () => escape("foo")
        });
      `;
			const result = validateFileContent("test.ts", content);
			expect(result.isValid).toBe(true);
			expect(result.errors).toHaveLength(0);
		});

		it("should reject usage of escapeHTML from wrong namespace", () => {
			const content = `
        import * as wrongNamespace from "~/src/utilities/sanitizer";
        import { t } from "graphql";

        t.string({
          resolve: () => otherNamespace.escapeHTML("foo")
        });
      `;
			const result = validateFileContent("test.ts", content);
			expect(result.isValid).toBe(false);
			expect(result.errors).toContain(
				"The file has 1 of 1 string resolver(s) missing escapeHTML sanitization.",
			);
		});

		it("should fail if one resolver is sanitized but another is not", () => {
			const content = `
        import { escapeHTML } from "~/src/utilities/sanitizer";
        import { t } from "graphql";

        t.string({
          resolve: () => escapeHTML("safe")
        });

        t.string({
          resolve: () => "unsafe"
        });
      `;
			const result = validateFileContent("test.ts", content);
			expect(result.isValid).toBe(false);
			expect(result.errors).toContain(
				"The file has 1 of 2 string resolver(s) missing escapeHTML sanitization.",
			);
		});

		it("should detect escapeHTML in separately defined resolver functions", () => {
			const content = `
        import { escapeHTML } from "~/src/utilities/sanitizer";
        import { t } from "graphql";

        const myResolver = async () => {
          return escapeHTML("safe");
        };

        t.field({
          type: "String",
          resolve: myResolver
        });
      `;
			const result = validateFileContent("test.ts", content);
			expect(result.isValid).toBe(true);
			expect(result.errors).toHaveLength(0);
		});

		it("should fail when separately defined resolver function doesn't use escapeHTML", () => {
			const content = `
        import { escapeHTML } from "~/src/utilities/sanitizer";
        import { t } from "graphql";

        const myResolver = async () => {
          return "unsafe";
        };

        t.field({
          type: "String",
          resolve: myResolver
        });
      `;
			const result = validateFileContent("test.ts", content);
			expect(result.isValid).toBe(false);
			expect(result.errors).toContain(
				"The file has 1 of 1 string resolver(s) missing escapeHTML sanitization.",
			);
		});
	});

	describe("checkSanitization (main function)", () => {
		// Save original console methods
		const originalConsoleLog = console.log;
		const originalConsoleError = console.error;

		// Mock implementations
		const mockLog = vi.fn();
		const mockError = vi.fn();

		beforeEach(() => {
			vi.resetAllMocks();

			// Setup console mocks
			console.log = mockLog;
			console.error = mockError;

			// Default glob mock to return empty list
			(glob as unknown as Mock).mockResolvedValue([]);
		});

		afterEach(() => {
			// Restore original methods
			console.log = originalConsoleLog;
			console.error = originalConsoleError;
		});

		it("should return true if no files found", async () => {
			(glob as unknown as Mock).mockResolvedValue([]);

			const result = await checkSanitization();

			expect(result).toBe(true);
			expect(mockLog).toHaveBeenCalledWith(
				expect.stringContaining("Scanning 0 files"),
			);
			expect(mockLog).toHaveBeenCalledWith(
				expect.stringContaining("Sanitization check passed"),
			);
		});

		it("should return true if valid file found", async () => {
			(glob as unknown as Mock).mockResolvedValue(["src/valid.ts"]);
			(fs.readFile as Mock).mockResolvedValue(`
        import { escapeHTML } from "~/src/utilities/sanitizer";
        import { t } from "graphql";
        t.string({ resolve: () => escapeHTML("foo") });
      `);

			const result = await checkSanitization();

			expect(result).toBe(true);
			expect(mockLog).toHaveBeenCalledWith(
				expect.stringContaining("Scanning 1 files"),
			);
			expect(mockLog).toHaveBeenCalledWith(
				expect.stringContaining("Sanitization check passed"),
			);
		});

		it("should return false if invalid file found", async () => {
			(glob as unknown as Mock).mockResolvedValue(["src/invalid.ts"]);
			(fs.readFile as Mock).mockResolvedValue(`
        import { t } from "graphql";
        t.string({ resolve: () => "foo" });
      `);

			const result = await checkSanitization();

			expect(result).toBe(false);
			expect(mockError).toHaveBeenCalledWith(
				expect.stringContaining("[ERROR] Potential unsafe string resolver"),
			);
			expect(mockError).toHaveBeenCalledWith(
				expect.stringContaining("Sanitization check failed"),
			);
		});

		it("should return false and report all invalid files", async () => {
			(glob as unknown as Mock).mockResolvedValue([
				"src/valid.ts",
				"src/invalid.ts",
			]);
			(fs.readFile as Mock)
				.mockResolvedValueOnce(`
                import { escapeHTML } from "~/src/utilities/sanitizer";
                import { t } from "graphql";
                t.string({ resolve: () => escapeHTML("foo") });
            `)
				.mockResolvedValueOnce(`
                import { t } from "graphql";
                t.string({ resolve: () => "foo" });
            `);

			const result = await checkSanitization();

			expect(result).toBe(false);
			expect(mockError).toHaveBeenCalledWith(
				expect.stringContaining("src/invalid.ts"),
			);
		});

		it("should fail gracefully if fs.readFile rejects", async () => {
			(glob as unknown as Mock).mockResolvedValue(["src/valid.ts"]);
			(fs.readFile as Mock).mockRejectedValue(new Error("File read error"));

			const result = await checkSanitization();

			expect(result).toBe(false);
			expect(mockError).toHaveBeenCalledWith(
				"Error during sanitization check:",
				expect.objectContaining({ message: "File read error" }),
			);
		});

		it("should fail gracefully if glob rejects", async () => {
			(glob as unknown as Mock).mockRejectedValue(new Error("Glob error"));

			const result = await checkSanitization();

			expect(result).toBe(false);
			expect(mockError).toHaveBeenCalledWith(
				"Error during sanitization check:",
				expect.objectContaining({ message: "Glob error" }),
			);
		});
	});
});
