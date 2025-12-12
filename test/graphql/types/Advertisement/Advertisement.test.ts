import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the escapeHTML function
vi.mock("~/src/utilities/sanitizer", () => ({
	escapeHTML: vi.fn((str: string) => `escaped_${str}`),
}));

// Capture the resolver functions from the builder
let capturedFields: Record<string, unknown> | null = null;

// Mock the builder to capture resolver registration
vi.mock("~/src/graphql/builder", () => ({
	builder: {
		objectRef: vi.fn(() => ({
			implement: vi.fn(
				(config: { fields: (t: unknown) => Record<string, unknown> }) => {
					// Create a mock field builder that captures resolver functions
					const mockFieldBuilder = {
						exposeID: vi.fn((_field: string, _opts: unknown) => ({})),
						expose: vi.fn((_field: string, _opts: unknown) => ({})),
						listRef: vi.fn(() => ({})),
						string: vi.fn(
							(opts: { resolve?: (parent: unknown) => unknown }) => ({
								resolve: opts.resolve,
							}),
						),
					};
					capturedFields = config.fields(mockFieldBuilder);
				},
			),
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
	// Clear mocks and import module before each test
	beforeEach(async () => {
		// Clear mocks between tests to isolate mock state
		vi.clearAllMocks();
		// Reset captured fields before each test
		capturedFields = null;
		// Clear the module cache and re-import to trigger fresh registration
		vi.resetModules();
		// Re-apply mocks after reset
		vi.doMock("~/src/utilities/sanitizer", () => ({
			escapeHTML: vi.fn((str: string) => `escaped_${str}`),
		}));
		// Import the module to trigger registration
		await import("~/src/graphql/types/Advertisement/Advertisement");
	});

	describe("description field resolver", () => {
		it("should return null when description is null", async () => {
			const { escapeHTML } = await import("~/src/utilities/sanitizer");

			const advertisement = {
				id: "test-id",
				name: "Test Ad",
				description: null,
				attachments: null,
			};

			// Get the actual resolver from captured fields
			const descriptionField = capturedFields?.description as {
				resolve?: (parent: typeof advertisement) => string | null;
			};
			expect(descriptionField?.resolve).toBeDefined();

			// Call the actual resolver
			const result = descriptionField.resolve?.(advertisement);

			expect(result).toBe(null);
			// escapeHTML should not be called for null description
			expect(escapeHTML).not.toHaveBeenCalled();
			expect(escapeHTML).toHaveBeenCalledTimes(0);
		});

		it("should escape HTML when description is provided", async () => {
			const { escapeHTML } = await import("~/src/utilities/sanitizer");

			const advertisement = {
				id: "test-id",
				name: "Test Ad",
				description: "Test Description",
				attachments: null,
			};

			// Get the actual resolver from captured fields
			const descriptionField = capturedFields?.description as {
				resolve?: (parent: typeof advertisement) => string | null;
			};
			expect(descriptionField?.resolve).toBeDefined();

			// Call the actual resolver
			const result = descriptionField.resolve?.(advertisement);

			expect(result).toBe("escaped_Test Description");
			expect(escapeHTML).toHaveBeenCalledWith("Test Description");
			expect(escapeHTML).toHaveBeenCalledTimes(1);
		});

		it("should handle empty string description", async () => {
			const { escapeHTML } = await import("~/src/utilities/sanitizer");

			const advertisement = {
				id: "test-id",
				name: "Test Ad",
				description: "",
				attachments: null,
			};

			// Get the actual resolver from captured fields
			const descriptionField = capturedFields?.description as {
				resolve?: (parent: typeof advertisement) => string | null;
			};
			expect(descriptionField?.resolve).toBeDefined();

			// Call the actual resolver - empty string is falsy, so returns null
			const result = descriptionField.resolve?.(advertisement);

			expect(result).toBe(null);
			// escapeHTML should not be called for empty string
			expect(escapeHTML).not.toHaveBeenCalled();
			expect(escapeHTML).toHaveBeenCalledTimes(0);
		});
	});

	describe("name field resolver", () => {
		it("should escape HTML in name", async () => {
			const { escapeHTML } = await import("~/src/utilities/sanitizer");

			const advertisement = {
				id: "test-id",
				name: "Test <script>alert('xss')</script>",
				description: null,
				attachments: null,
			};

			// Get the actual resolver from captured fields
			const nameField = capturedFields?.name as {
				resolve?: (parent: typeof advertisement) => string;
			};
			expect(nameField?.resolve).toBeDefined();

			// Call the actual resolver
			const result = nameField.resolve?.(advertisement);

			expect(result).toBe("escaped_Test <script>alert('xss')</script>");
			expect(escapeHTML).toHaveBeenCalledWith(
				"Test <script>alert('xss')</script>",
			);
			expect(escapeHTML).toHaveBeenCalledTimes(1);
		});
	});
});
