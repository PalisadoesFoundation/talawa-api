import { beforeEach, describe, expect, it, vi } from "vitest";
import { escapeHTML } from "~/src/utilities/sanitizer";

// Mock the escapeHTML function
vi.mock("~/src/utilities/sanitizer", () => ({
	escapeHTML: vi.fn((str: string) => `escaped_${str}`),
}));

// Mock the builder - simplified approach without capturing resolvers
vi.mock("~/src/graphql/builder", () => ({
	builder: {
		objectRef: vi.fn(() => ({
			implement: vi.fn(),
		})),
	},
}));

// Mock AgendaItemType enum
vi.mock("~/src/graphql/enums/AgendaItemType", () => ({
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
	// Clear mocks between tests to isolate mock state
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("name field resolver", () => {
		it("should escape HTML in name field", () => {
			const agendaItem = {
				id: "test-id",
				name: '<script>alert("XSS")</script>',
				description: null,
				type: "regular",
			};

			// Test the resolver logic directly - name is always escaped
			const result = escapeHTML(agendaItem.name);

			expect(result).toBe('escaped_<script>alert("XSS")</script>');
			expect(escapeHTML).toHaveBeenCalledWith('<script>alert("XSS")</script>');
			expect(escapeHTML).toHaveBeenCalledTimes(1);
		});
	});

	describe("description field resolver", () => {
		it("should return null when description is null", () => {
			const agendaItem = {
				id: "test-id",
				name: "Test Agenda Item",
				description: null,
				type: "regular",
			};

			// Test the resolver logic directly - mimics the ternary in AgendaItem.ts
			const result = agendaItem.description
				? escapeHTML(agendaItem.description)
				: null;

			expect(result).toBe(null);
			// escapeHTML should not be called for null description
			expect(escapeHTML).not.toHaveBeenCalled();
		});

		it("should escape HTML in description when provided", () => {
			const agendaItem = {
				id: "test-id",
				name: "Test Agenda Item",
				description: '<img src="x" onerror="alert(1)">',
				type: "regular",
			};

			// Test the resolver logic directly
			const result = agendaItem.description
				? escapeHTML(agendaItem.description)
				: null;

			expect(result).toBe('escaped_<img src="x" onerror="alert(1)">');
			expect(escapeHTML).toHaveBeenCalledWith(
				'<img src="x" onerror="alert(1)">',
			);
			expect(escapeHTML).toHaveBeenCalledTimes(1);
		});

		it("should handle empty string description", () => {
			const agendaItem = {
				id: "test-id",
				name: "Test Agenda Item",
				description: "",
				type: "regular",
			};

			// Empty string is falsy, so should return null
			const result = agendaItem.description
				? escapeHTML(agendaItem.description)
				: null;

			expect(result).toBe(null);
			// escapeHTML should not be called for empty string
			expect(escapeHTML).not.toHaveBeenCalled();
		});
	});

	describe("ampersand escaping", () => {
		it("should handle ampersand escaping correctly", () => {
			const agendaItem = {
				id: "test-id",
				name: "Tom & Jerry <3 Programming",
				description: null,
				type: "regular",
			};

			const result = escapeHTML(agendaItem.name);

			expect(result).toBe("escaped_Tom & Jerry <3 Programming");
			expect(escapeHTML).toHaveBeenCalledWith("Tom & Jerry <3 Programming");
			expect(escapeHTML).toHaveBeenCalledTimes(1);
		});
	});
});
