import { describe, expect, it } from "vitest";
import {
	escapeHTML,
	sanitizedStringSchema,
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
