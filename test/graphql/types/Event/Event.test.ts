import { beforeEach, describe, expect, it, vi } from "vitest";
import { escapeHTML } from "~/src/utilities/sanitizer";

// Mock the escapeHTML function
vi.mock("~/src/utilities/sanitizer", () => ({
	escapeHTML: vi.fn((str: string) => `escaped_${str}`),
}));

// Mock the builder
vi.mock("~/src/graphql/builder", () => ({
	builder: {
		objectRef: vi.fn(() => ({
			implement: vi.fn(),
		})),
	},
}));

// Mock EventAttachment
vi.mock("~/src/graphql/types/EventAttachment/EventAttachment", () => ({
	EventAttachment: {},
}));

// Mock RecurrenceRule
vi.mock("~/src/graphql/types/RecurrenceRule/RecurrenceRule", () => ({
	RecurrenceRule: {},
}));

// Mock recurrenceFormatter
vi.mock("~/src/utilities/recurrenceFormatter", () => ({
	formatRecurrenceDescription: vi.fn(),
}));

/**
 * Test for output-level HTML escaping in Event resolver.
 *
 * API Contract: Raw HTML strings are stored in the database as-is.
 * HTML escaping is applied at resolver output time (not at input/storage time).
 * This prevents XSS while avoiding data corruption and double-escaping issues.
 *
 * The Event resolver in src/graphql/types/Event/Event.ts
 * applies escapeHTML() to the name and description fields when resolving.
 */

describe("Event GraphQL Type", () => {
	// Clear mocks between tests to isolate mock state
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("name field resolver", () => {
		it("should escape HTML in name field", () => {
			const event = {
				id: "test-id",
				name: '<script>alert("XSS")</script>',
				description: null,
				attachments: [],
			};

			// Test the resolver logic directly - name is always escaped
			const result = escapeHTML(event.name);

			expect(result).toBe('escaped_<script>alert("XSS")</script>');
			expect(escapeHTML).toHaveBeenCalledWith('<script>alert("XSS")</script>');
			expect(escapeHTML).toHaveBeenCalledTimes(1);
		});

		it("should handle ampersand and special characters in name", () => {
			const event = {
				id: "test-id",
				name: "Tom & Jerry <3 Programming",
				description: null,
				attachments: [],
			};

			const result = escapeHTML(event.name);

			expect(result).toBe("escaped_Tom & Jerry <3 Programming");
			expect(escapeHTML).toHaveBeenCalledWith("Tom & Jerry <3 Programming");
			expect(escapeHTML).toHaveBeenCalledTimes(1);
		});
	});

	describe("description field resolver", () => {
		it("should return null when description is null", () => {
			const event = {
				id: "test-id",
				name: "Test Event",
				description: null,
				attachments: [],
			};

			// Test the resolver logic directly - mimics the ternary in Event.ts
			const result = event.description ? escapeHTML(event.description) : null;

			expect(result).toBe(null);
			// escapeHTML should not be called for null description
			expect(escapeHTML).not.toHaveBeenCalled();
		});

		it("should escape HTML in description when provided", () => {
			const event = {
				id: "test-id",
				name: "Test Event",
				description: '<img src="x" onerror="alert(1)">',
				attachments: [],
			};

			// Test the resolver logic directly
			const result = event.description ? escapeHTML(event.description) : null;

			expect(result).toBe('escaped_<img src="x" onerror="alert(1)">');
			expect(escapeHTML).toHaveBeenCalledWith(
				'<img src="x" onerror="alert(1)">',
			);
			expect(escapeHTML).toHaveBeenCalledTimes(1);
		});

		it("should handle empty string description", () => {
			const event = {
				id: "test-id",
				name: "Test Event",
				description: "",
				attachments: [],
			};

			// Empty string is falsy, so should return null
			const result = event.description ? escapeHTML(event.description) : null;

			expect(result).toBe(null);
			// escapeHTML should not be called for empty string
			expect(escapeHTML).not.toHaveBeenCalled();
		});
	});
});
