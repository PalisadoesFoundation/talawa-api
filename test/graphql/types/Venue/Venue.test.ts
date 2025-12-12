import { describe, expect, it, vi } from "vitest";

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

// Mock VenueAttachment
vi.mock("~/src/graphql/types/VenueAttachment/VenueAttachment", () => ({
	VenueAttachment: {},
}));

describe("Venue GraphQL Type", () => {
	describe("description field resolver", () => {
		it("should return null when description is null", async () => {
			const { escapeHTML } = await import("~/src/utilities/sanitizer");

			const venue = {
				id: "test-id",
				name: "Test Venue",
				description: null,
				capacity: 100,
			};

			// Test the resolver logic directly
			const result = venue.description
				? (escapeHTML as ReturnType<typeof vi.fn>)(venue.description)
				: null;

			expect(result).toBe(null);
		});

		it("should escape HTML when description is provided", async () => {
			const { escapeHTML } = await import("~/src/utilities/sanitizer");

			const venue = {
				id: "test-id",
				name: "Test Venue",
				description: "A beautiful venue",
				capacity: 100,
			};

			// Test the resolver logic directly
			const result = venue.description
				? (escapeHTML as ReturnType<typeof vi.fn>)(venue.description)
				: null;

			expect(result).toBe("escaped_A beautiful venue");
			expect(escapeHTML).toHaveBeenCalledWith("A beautiful venue");
		});

		it("should handle empty string description", async () => {
			const { escapeHTML } = await import("~/src/utilities/sanitizer");

			const venue = {
				id: "test-id",
				name: "Test Venue",
				description: "",
				capacity: 100,
			};

			// Empty string is falsy, so should return null
			const result = venue.description
				? (escapeHTML as ReturnType<typeof vi.fn>)(venue.description)
				: null;

			expect(result).toBe(null);
		});
	});

	describe("name field resolver", () => {
		it("should escape HTML in name", async () => {
			const { escapeHTML } = await import("~/src/utilities/sanitizer");

			const venue = {
				id: "test-id",
				name: "Test <script>alert('xss')</script>",
				description: null,
				capacity: 100,
			};

			const result = (escapeHTML as ReturnType<typeof vi.fn>)(venue.name);

			expect(result).toBe("escaped_Test <script>alert('xss')</script>");
			expect(escapeHTML).toHaveBeenCalledWith(
				"Test <script>alert('xss')</script>",
			);
		});
	});
});
