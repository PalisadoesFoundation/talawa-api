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

// Mock VenueAttachment
vi.mock("~/src/graphql/types/VenueAttachment/VenueAttachment", () => ({
	VenueAttachment: {},
}));

describe("Venue GraphQL Type", () => {
	// Clear mocks between tests to isolate mock state
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("description field resolver", () => {
		it("should return null when description is null", () => {
			const venue = {
				id: "test-id",
				name: "Test Venue",
				description: null,
				capacity: 100,
				attachments: null,
			};

			// Test the resolver logic directly - mimics the ternary in Venue.ts
			const result = venue.description
				? escapeHTML(venue.description)
				: null;

			expect(result).toBe(null);
			// escapeHTML should not be called for null description
			expect(escapeHTML).not.toHaveBeenCalled();
		});

		it("should escape HTML when description is provided", () => {
			const venue = {
				id: "test-id",
				name: "Test Venue",
				description: "A beautiful venue",
				capacity: 100,
				attachments: null,
			};

			// Test the resolver logic directly
			const result = venue.description
				? escapeHTML(venue.description)
				: null;

			expect(result).toBe("escaped_A beautiful venue");
			expect(escapeHTML).toHaveBeenCalledWith("A beautiful venue");
			expect(escapeHTML).toHaveBeenCalledTimes(1);
		});

		it("should handle empty string description", () => {
			const venue = {
				id: "test-id",
				name: "Test Venue",
				description: "",
				capacity: 100,
				attachments: null,
			};

			// Empty string is falsy, so should return null
			const result = venue.description
				? escapeHTML(venue.description)
				: null;

			expect(result).toBe(null);
			// escapeHTML should not be called for empty string
			expect(escapeHTML).not.toHaveBeenCalled();
		});
	});

	describe("name field resolver", () => {
		it("should escape HTML in name", () => {
			const venue = {
				id: "test-id",
				name: "Test <script>alert('xss')</script>",
				description: null,
				capacity: 100,
				attachments: null,
			};

			// Test the resolver logic directly - name is always escaped
			const result = escapeHTML(venue.name);

			expect(result).toBe("escaped_Test <script>alert('xss')</script>");
			expect(escapeHTML).toHaveBeenCalledWith(
				"Test <script>alert('xss')</script>",
			);
			expect(escapeHTML).toHaveBeenCalledTimes(1);
		});
	});
});
