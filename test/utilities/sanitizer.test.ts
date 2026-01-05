import { describe, expect, it } from "vitest";
import {
	escapeHTML,
	isSanitizedInput,
	sanitizedStringSchema,
	sanitizeInput,
} from "../../src/utilities/sanitizer";

describe("sanitizer", () => {
	describe("escapeHTML", () => {
		it("should escape HTML characters", () => {
			const input = '<script>alert("xss")</script>';
			const expected = "&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;";
			expect(escapeHTML(input)).toBe(expected);
		});

		it("should escape single quotes", () => {
			const input = "'";
			const expected = "&#39;";
			expect(escapeHTML(input)).toBe(expected);
		});

		it("should escape ampersands", () => {
			const input = "Me & You";
			const expected = "Me &amp; You";
			expect(escapeHTML(input)).toBe(expected);
		});

		it("should return original string if no HTML characters present", () => {
			const input = "Hello World";
			expect(escapeHTML(input)).toBe(input);
		});

		it("should handle null input", () => {
			expect(escapeHTML(null)).toBeNull();
		});

		it("should handle undefined input", () => {
			expect(escapeHTML(undefined)).toBeUndefined();
		});
	});

	describe("sanitizeInput", () => {
		it("should trim whitespace", () => {
			const input = "  hello  ";
			expect(sanitizeInput(input)).toBe("hello");
		});

		it("should handle null input", () => {
			expect(sanitizeInput(null)).toBeNull();
		});

		it("should handle undefined input", () => {
			expect(sanitizeInput(undefined)).toBeUndefined();
		});

		it("should NOT escape HTML (only trims)", () => {
			const input = "<b>bold</b>";
			expect(sanitizeInput(input)).toBe("<b>bold</b>");
		});

		it("should handle empty string", () => {
			expect(sanitizeInput("")).toBe("");
		});

		it("should handle string with only whitespace", () => {
			expect(sanitizeInput("   ")).toBe("");
		});
	});

	describe("isSanitizedInput", () => {
		it("should return true for trimmed strings", () => {
			expect(isSanitizedInput("hello")).toBe(true);
		});

		it("should return false for strings with leading whitespace", () => {
			expect(isSanitizedInput("  hello")).toBe(false);
		});

		it("should return false for strings with trailing whitespace", () => {
			expect(isSanitizedInput("hello  ")).toBe(false);
		});

		it("should return false for non-strings", () => {
			expect(isSanitizedInput(123)).toBe(false);
			expect(isSanitizedInput(null)).toBe(false);
			expect(isSanitizedInput(undefined)).toBe(false);
			expect(isSanitizedInput({})).toBe(false);
		});

		it("should return true for empty string", () => {
			expect(isSanitizedInput("")).toBe(true);
		});
	});

	describe("sanitizedStringSchema", () => {
		it("should trim whitespace", () => {
			const input = "  hello  ";
			expect(sanitizedStringSchema.parse(input)).toBe("hello");
		});

		it("should NOT escape HTML (storage should be raw)", () => {
			const input = "<b>bold</b>";
			// Expect raw string, not escaped
			expect(sanitizedStringSchema.parse(input)).toBe("<b>bold</b>");
		});
	});
});
