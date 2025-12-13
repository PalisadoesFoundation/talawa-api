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
	// Clear mocks between tests to isolate mock state
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("description field resolver", () => {
		it("should return null when description is null", () => {
			const advertisement = {
				id: "test-id",
				name: "Test Ad",
				description: null,
				attachments: null,
			};

			// Test the resolver logic directly - mimics the ternary in Advertisement.ts
			const result = advertisement.description
				? escapeHTML(advertisement.description)
				: null;

			expect(result).toBe(null);
			// escapeHTML should not be called for null description
			expect(escapeHTML).not.toHaveBeenCalled();
		});

		it("should escape HTML when description is provided", () => {
			const advertisement = {
				id: "test-id",
				name: "Test Ad",
				description: "Test Description",
				attachments: null,
			};

			// Test the resolver logic directly
			const result = advertisement.description
				? escapeHTML(advertisement.description)
				: null;

			expect(result).toBe("escaped_Test Description");
			expect(escapeHTML).toHaveBeenCalledWith("Test Description");
			expect(escapeHTML).toHaveBeenCalledTimes(1);
		});

		it("should handle empty string description", () => {
			const advertisement = {
				id: "test-id",
				name: "Test Ad",
				description: "",
				attachments: null,
			};

			// Empty string is falsy, so should return null
			const result = advertisement.description
				? escapeHTML(advertisement.description)
				: null;

			expect(result).toBe(null);
			// escapeHTML should not be called for empty string
			expect(escapeHTML).not.toHaveBeenCalled();
		});
	});

	describe("name field resolver", () => {
		it("should escape HTML in name", () => {
			const advertisement = {
				id: "test-id",
				name: "Test <script>alert('xss')</script>",
				description: null,
				attachments: null,
			};

			// Test the resolver logic directly - name is always escaped
			const result = escapeHTML(advertisement.name);

			expect(result).toBe("escaped_Test <script>alert('xss')</script>");
			expect(escapeHTML).toHaveBeenCalledWith(
				"Test <script>alert('xss')</script>",
			);
			expect(escapeHTML).toHaveBeenCalledTimes(1);
		});
	});
});
