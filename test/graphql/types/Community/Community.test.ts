import { describe, expect, it } from "vitest";
import { escapeHTML } from "~/src/utilities/sanitizer";
// Import the actual Community type to ensure it's registered
import "~/src/graphql/types/Community/Community";

/**
 * Test for output-level HTML escaping in Community resolver.
 *
 * API Contract: Raw HTML strings are stored in the database as-is.
 * HTML escaping is applied at resolver output time (not at input/storage time).
 * This prevents XSS while avoiding data corruption and double-escaping issues.
 *
 * The Community resolver in src/graphql/types/Community/Community.ts
 * applies escapeHTML() to the name field when resolving.
 *
 * These tests validate the ACTUAL security behavior by testing the real
 * escapeHTML function rather than mocking it.
 */

describe("Community GraphQL Type", () => {
	describe("name field resolver - HTML escaping", () => {
		it("should escape script tags to prevent XSS", () => {
			const maliciousName = '<script>alert("XSS")</script>';
			const escaped = escapeHTML(maliciousName);

			// Verify actual HTML entity encoding
			expect(escaped).toBe(
				"&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;",
			);
			expect(escaped).not.toContain("<script>");
			expect(escaped).not.toContain("</script>");
		});

		it("should escape image onerror XSS payload", () => {
			const maliciousName = '<img src="x" onerror="alert(1)">';
			const escaped = escapeHTML(maliciousName);

			// Verify angle brackets and quotes are escaped
			expect(escaped).toBe(
				"&lt;img src=&quot;x&quot; onerror=&quot;alert(1)&quot;&gt;",
			);
			expect(escaped).not.toContain("<img");
		});

		it("should escape ampersand and special characters", () => {
			const specialChars = "Tom & Jerry <3 Community";
			const escaped = escapeHTML(specialChars);

			expect(escaped).toBe("Tom &amp; Jerry &lt;3 Community");
		});

		it("should escape single and double quotes", () => {
			const withQuotes = 'It\'s a "test"';
			const escaped = escapeHTML(withQuotes);

			expect(escaped).toBe("It&#39;s a &quot;test&quot;");
			expect(escaped).not.toContain("'");
			expect(escaped).not.toContain('"');
		});

		it("should handle empty string", () => {
			const escaped = escapeHTML("");
			expect(escaped).toBe("");
		});

		it("should handle string with no special characters", () => {
			const safeName = "Normal Community Name";
			const escaped = escapeHTML(safeName);
			expect(escaped).toBe("Normal Community Name");
		});
	});
});
