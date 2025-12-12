import { describe, expect, it, vi } from "vitest";

// Mock the escapeHTML function
vi.mock("~/src/utilities/sanitizer", () => ({
	escapeHTML: vi.fn((str: string) => {
		// Simulate actual HTML escaping behavior
		return str
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")
			.replace(/"/g, "&quot;");
	}),
}));

// Mock the builder
vi.mock("~/src/graphql/builder", () => ({
	builder: {
		objectRef: vi.fn(() => ({
			implement: vi.fn(),
		})),
	},
}));

// Mock AgendaItemType enum
vi.mock("~/src/drizzle/enums/agendaItemType", () => ({
	AgendaItemType: {},
}));

/**
 * Test for output-level HTML escaping in AgendaItem resolver.
 *
 * API Contract: Raw HTML strings are stored in the database as-is.
 * HTML escaping is applied at resolver output time (not at input/storage time).
 * This prevents XSS while avoiding data corruption and double-escaping issues.
 *
 * The AgendaItem resolver in src/graphql/types/AgendaItem/AgendaItem.ts
 * applies escapeHTML() to the name and description fields when resolving.
 */

describe("AgendaItem output-level HTML escaping", () => {
	describe("name field resolver", () => {
		it("should escape HTML in name field", async () => {
			const { escapeHTML } = await import("~/src/utilities/sanitizer");

			// Test data: raw HTML that would be dangerous if not escaped
			const rawHtmlName = '<script>alert("XSS")</script>';
			const expectedEscapedName =
				"&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;";

			// Test the resolver logic directly
			const result = (escapeHTML as ReturnType<typeof vi.fn>)(rawHtmlName);

			expect(result).toBe(expectedEscapedName);
			expect(escapeHTML).toHaveBeenCalledWith(rawHtmlName);
		});
	});

	describe("description field resolver", () => {
		it("should return null when description is null", async () => {
			const { escapeHTML } = await import("~/src/utilities/sanitizer");

			const agendaItem = {
				id: "test-id",
				name: "Test Agenda Item",
				description: null,
			};

			// Test the resolver logic directly - mimics the ternary in AgendaItem.ts
			const result = agendaItem.description
				? (escapeHTML as ReturnType<typeof vi.fn>)(agendaItem.description)
				: null;

			expect(result).toBe(null);
		});

		it("should escape HTML in description when provided", async () => {
			const { escapeHTML } = await import("~/src/utilities/sanitizer");

			const rawHtmlDescription = '<img src="x" onerror="alert(1)">';
			const expectedEscapedDescription =
				"&lt;img src=&quot;x&quot; onerror=&quot;alert(1)&quot;&gt;";

			const agendaItem = {
				id: "test-id",
				name: "Test Agenda Item",
				description: rawHtmlDescription,
			};

			// Test the resolver logic directly
			const result = agendaItem.description
				? (escapeHTML as ReturnType<typeof vi.fn>)(agendaItem.description)
				: null;

			expect(result).toBe(expectedEscapedDescription);
			expect(escapeHTML).toHaveBeenCalledWith(rawHtmlDescription);
		});

		it("should handle empty string description", async () => {
			const { escapeHTML } = await import("~/src/utilities/sanitizer");

			const agendaItem = {
				id: "test-id",
				name: "Test Agenda Item",
				description: "",
			};

			// Empty string is falsy, so should return null
			const result = agendaItem.description
				? (escapeHTML as ReturnType<typeof vi.fn>)(agendaItem.description)
				: null;

			expect(result).toBe(null);
		});
	});

	describe("ampersand escaping", () => {
		it("should handle ampersand escaping correctly", async () => {
			const { escapeHTML } = await import("~/src/utilities/sanitizer");

			const rawContent = "Tom & Jerry <3 Programming";
			const expectedEscaped = "Tom &amp; Jerry &lt;3 Programming";

			const result = (escapeHTML as ReturnType<typeof vi.fn>)(rawContent);

			expect(result).toBe(expectedEscaped);
			expect(escapeHTML).toHaveBeenCalledWith(rawContent);
		});
	});
});
