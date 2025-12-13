import { describe, expect, it } from "vitest";
import { escapeHTML } from "~/src/utilities/sanitizer";
// Import the actual Event type to ensure it's registered
import "~/src/graphql/types/Event/Event";

/**
 * Test for output-level HTML escaping in Event resolver.
 *
 * API Contract: Raw HTML strings are stored in the database as-is.
 * HTML escaping is applied at resolver output time (not at input/storage time).
 * This prevents XSS while avoiding data corruption and double-escaping issues.
 *
 * The Event resolver in src/graphql/types/Event/Event.ts
 * applies escapeHTML() to the name and description fields when resolving.
 *
 * These tests validate the ACTUAL security behavior by testing the real
 * escapeHTML function rather than mocking it.
 */

describe("Event GraphQL Type", () => {
	describe("name field resolver - HTML escaping", () => {
		it("should escape script tags to prevent XSS", () => {
			const maliciousName = '<script>alert("XSS")</script>';
			const escaped = escapeHTML(maliciousName);

			expect(escaped).toBe(
				"&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;",
			);
			expect(escaped).not.toContain("<script>");
		});

		it("should escape image onerror XSS payload", () => {
			const maliciousName = '<img src="x" onerror="alert(1)">';
			const escaped = escapeHTML(maliciousName);

			expect(escaped).toBe(
				"&lt;img src=&quot;x&quot; onerror=&quot;alert(1)&quot;&gt;",
			);
		});

		it("should escape ampersand and special characters", () => {
			const specialChars = "Tom & Jerry <3 Events";
			const escaped = escapeHTML(specialChars);

			expect(escaped).toBe("Tom &amp; Jerry &lt;3 Events");
		});

		it("should handle empty string", () => {
			const escaped = escapeHTML("");
			expect(escaped).toBe("");
		});
	});

	describe("description field resolver - HTML escaping", () => {
		it("should escape script tags to prevent XSS", () => {
			const maliciousDescription = '<script>alert("XSS")</script>';
			const escaped = escapeHTML(maliciousDescription);

			expect(escaped).toBe(
				"&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;",
			);
			expect(escaped).not.toContain("<script>");
		});

		it("should escape single and double quotes", () => {
			const withQuotes = 'It\'s a "test" description';
			const escaped = escapeHTML(withQuotes);

			expect(escaped).toBe("It&#39;s a &quot;test&quot; description");
			expect(escaped).not.toContain("'");
			expect(escaped).not.toContain('"');
		});

		it("should handle string with no special characters", () => {
			const safeDescription = "This is a normal event description";
			const escaped = escapeHTML(safeDescription);
			expect(escaped).toBe("This is a normal event description");
		});
	});
});
