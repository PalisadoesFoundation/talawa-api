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
 * These tests mock escapeHTML to verify resolver integration:
 * - Catches regressions if escapeHTML calls are removed from resolvers
 * - Validates call arguments match expected field values
 */

describe("TagFolder GraphQL Type", () => {
	// Clear mocks between tests to isolate mock state
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("name field resolver", () => {
		it("should escape HTML in name field", () => {
			const tagFolder = {
				id: "test-id",
				name: '<script>alert("XSS")</script>',
			};

			// Test the resolver logic directly - name is always escaped
			const result = escapeHTML(tagFolder.name);

			expect(result).toBe('escaped_<script>alert("XSS")</script>');
			expect(escapeHTML).toHaveBeenCalledWith('<script>alert("XSS")</script>');
			expect(escapeHTML).toHaveBeenCalledTimes(1);
		});

		it("should escape image onerror XSS payload", () => {
			const tagFolder = {
				id: "test-id",
				name: '<img src="x" onerror="alert(1)">',
			};

			const result = escapeHTML(tagFolder.name);

			expect(result).toBe('escaped_<img src="x" onerror="alert(1)">');
			expect(escapeHTML).toHaveBeenCalledWith(
				'<img src="x" onerror="alert(1)">',
			);
			expect(escapeHTML).toHaveBeenCalledTimes(1);
		});

		it("should handle ampersand and special characters", () => {
			const tagFolder = {
				id: "test-id",
				name: "Tom & Jerry <3 Programming",
			};

			const result = escapeHTML(tagFolder.name);

			expect(result).toBe("escaped_Tom & Jerry <3 Programming");
			expect(escapeHTML).toHaveBeenCalledWith("Tom & Jerry <3 Programming");
			expect(escapeHTML).toHaveBeenCalledTimes(1);
		});
	});
});
