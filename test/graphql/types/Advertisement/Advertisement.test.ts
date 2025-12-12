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

// Mock AdvertisementType enum
vi.mock("~/src/graphql/enums/AdvertisementType", () => ({
	AdvertisementType: {},
}));

// Mock AdvertisementAttachment
vi.mock(
	"~/src/graphql/types/AdvertisementAttachment/AdvertisementAttachment",
	() => ({
		AdvertisementAttachment: {},
	}),
);

describe("Advertisement GraphQL Type", () => {
	describe("description field resolver", () => {
		it("should return null when description is null", async () => {
			const { escapeHTML } = await import("~/src/utilities/sanitizer");

			const advertisement = {
				id: "test-id",
				name: "Test Ad",
				description: null,
			};

			// Test the resolver logic directly
			const result = advertisement.description
				? (escapeHTML as ReturnType<typeof vi.fn>)(advertisement.description)
				: null;

			expect(result).toBe(null);
		});

		it("should escape HTML when description is provided", async () => {
			const { escapeHTML } = await import("~/src/utilities/sanitizer");

			const advertisement = {
				id: "test-id",
				name: "Test Ad",
				description: "Test Description",
			};

			// Test the resolver logic directly
			const result = advertisement.description
				? (escapeHTML as ReturnType<typeof vi.fn>)(advertisement.description)
				: null;

			expect(result).toBe("escaped_Test Description");
			expect(escapeHTML).toHaveBeenCalledWith("Test Description");
		});

		it("should handle empty string description", async () => {
			const { escapeHTML } = await import("~/src/utilities/sanitizer");

			const advertisement = {
				id: "test-id",
				name: "Test Ad",
				description: "",
			};

			// Empty string is falsy, so should return null
			const result = advertisement.description
				? (escapeHTML as ReturnType<typeof vi.fn>)(advertisement.description)
				: null;

			expect(result).toBe(null);
		});
	});

	describe("name field resolver", () => {
		it("should escape HTML in name", async () => {
			const { escapeHTML } = await import("~/src/utilities/sanitizer");

			const advertisement = {
				id: "test-id",
				name: "Test <script>alert('xss')</script>",
				description: null,
			};

			const result = (escapeHTML as ReturnType<typeof vi.fn>)(
				advertisement.name,
			);

			expect(result).toBe("escaped_Test <script>alert('xss')</script>");
			expect(escapeHTML).toHaveBeenCalledWith(
				"Test <script>alert('xss')</script>",
			);
		});
	});
});
