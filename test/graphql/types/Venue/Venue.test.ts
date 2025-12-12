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
						exposeInt: vi.fn((_field: string, _opts: unknown) => ({})),
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

// Mock VenueAttachment
vi.mock("~/src/graphql/types/VenueAttachment/VenueAttachment", () => ({
	VenueAttachment: {},
}));

describe("Venue GraphQL Type", () => {
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
		await import("~/src/graphql/types/Venue/Venue");
	});

	describe("description field resolver", () => {
		it("should return null when description is null", async () => {
			const { escapeHTML } = await import("~/src/utilities/sanitizer");

			const venue = {
				id: "test-id",
				name: "Test Venue",
				description: null,
				capacity: 100,
				attachments: null,
			};

			// Get the actual resolver from captured fields
			const descriptionField = capturedFields?.description as {
				resolve?: (parent: typeof venue) => string | null;
			};
			expect(descriptionField?.resolve).toBeDefined();

			// Call the actual resolver
			const result = descriptionField.resolve?.(venue);

			expect(result).toBe(null);
			// escapeHTML should not be called for null description
			expect(escapeHTML).not.toHaveBeenCalled();
		});

		it("should escape HTML when description is provided", async () => {
			const { escapeHTML } = await import("~/src/utilities/sanitizer");

			const venue = {
				id: "test-id",
				name: "Test Venue",
				description: "A beautiful venue",
				capacity: 100,
				attachments: null,
			};

			// Get the actual resolver from captured fields
			const descriptionField = capturedFields?.description as {
				resolve?: (parent: typeof venue) => string | null;
			};
			expect(descriptionField?.resolve).toBeDefined();

			// Call the actual resolver
			const result = descriptionField.resolve?.(venue);

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
				attachments: null,
			};

			// Get the actual resolver from captured fields
			const descriptionField = capturedFields?.description as {
				resolve?: (parent: typeof venue) => string | null;
			};
			expect(descriptionField?.resolve).toBeDefined();

			// Call the actual resolver - empty string is falsy, so returns null
			const result = descriptionField.resolve?.(venue);

			expect(result).toBe(null);
			// escapeHTML should not be called for empty string
			expect(escapeHTML).not.toHaveBeenCalled();
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
				attachments: null,
			};

			// Get the actual resolver from captured fields
			const nameField = capturedFields?.name as {
				resolve?: (parent: typeof venue) => string;
			};
			expect(nameField?.resolve).toBeDefined();

			// Call the actual resolver
			const result = nameField.resolve?.(venue);

			expect(result).toBe("escaped_Test <script>alert('xss')</script>");
			expect(escapeHTML).toHaveBeenCalledWith(
				"Test <script>alert('xss')</script>",
			);
		});
	});
});
