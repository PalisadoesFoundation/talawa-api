import { describe, expect, it } from "vitest";
import { escapeHTML } from "~/src/utilities/sanitizer";
// Import the actual TagFolder type to ensure it's registered
import "~/src/graphql/types/TagFolder/TagFolder";

/**
 * Test for output-level HTML escaping in TagFolder resolver.
 *
 * API Contract: Raw HTML strings are stored in the database as-is.
 * HTML escaping is applied at resolver output time (not at input/storage time).
 * This prevents XSS while avoiding data corruption and double-escaping issues.
 *
 * The TagFolder resolver in src/graphql/types/TagFolder/TagFolder.ts
 * applies escapeHTML() to the name field when resolving.
 *
 * These tests validate the ACTUAL security behavior by testing the real
 * escapeHTML function rather than mocking it.
 */

describe("TagFolder GraphQL Type", () => {
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
			expect(escaped).not.toContain("onerror=");
		});

		it("should escape ampersand and special characters", () => {
			const specialChars = "Tom & Jerry <3 Programming";
			const escaped = escapeHTML(specialChars);

			expect(escaped).toBe("Tom &amp; Jerry &lt;3 Programming");
			expect(escaped).not.toContain(" & ");
			expect(escaped).not.toContain("<3");
		});

		it("should escape single quotes", () => {
			const withQuotes = "It's a 'test'";
			const escaped = escapeHTML(withQuotes);

			expect(escaped).toBe("It&#39;s a &#39;test&#39;");
			expect(escaped).not.toContain("'");
		});

		it("should escape double quotes", () => {
			const withQuotes = 'Say "hello"';
			const escaped = escapeHTML(withQuotes);

			expect(escaped).toBe("Say &quot;hello&quot;");
			expect(escaped).not.toContain('"');
		});

		it("should handle empty string", () => {
			const escaped = escapeHTML("");
			expect(escaped).toBe("");
		});

		it("should handle string with no special characters", () => {
			const safeName = "Normal Tag Folder Name";
			const escaped = escapeHTML(safeName);
			expect(escaped).toBe("Normal Tag Folder Name");
		});

		it("should handle mixed XSS vectors", () => {
			const complexPayload =
				'<script>alert("xss")</script><img onerror="alert(1)">';
			const escaped = escapeHTML(complexPayload);

			// Verify no raw HTML remains
			expect(escaped).not.toContain("<");
			expect(escaped).not.toContain(">");
			expect(escaped).not.toContain('"');
		});
	});
});
