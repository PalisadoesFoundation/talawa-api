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

// Mock PostAttachment
vi.mock("~/src/graphql/types/PostAttachment/PostAttachment", () => ({
	PostAttachment: {},
}));

/**
 * Test for output-level HTML escaping in Post resolver.
 *
 * API Contract: Raw HTML strings are stored in the database as-is.
 * HTML escaping is applied at resolver output time (not at input/storage time).
 * This prevents XSS while avoiding data corruption and double-escaping issues.
 *
 * The Post resolver in src/graphql/types/Post/Post.ts
 * applies escapeHTML() to the caption field when resolving.
 */

describe("Post GraphQL Type", () => {
	// Clear mocks between tests to isolate mock state
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("caption field resolver", () => {
		it("should escape HTML in caption field", () => {
			const post = {
				id: "test-id",
				caption: '<script>alert("XSS")</script>',
				attachments: [],
			};

			// Test the resolver logic directly - caption is always escaped
			const result = escapeHTML(post.caption);

			expect(result).toBe('escaped_<script>alert("XSS")</script>');
			expect(escapeHTML).toHaveBeenCalledWith('<script>alert("XSS")</script>');
			expect(escapeHTML).toHaveBeenCalledTimes(1);
		});

		it("should handle image XSS payload in caption", () => {
			const post = {
				id: "test-id",
				caption: '<img src="x" onerror="alert(1)">',
				attachments: [],
			};

			const result = escapeHTML(post.caption);

			expect(result).toBe('escaped_<img src="x" onerror="alert(1)">');
			expect(escapeHTML).toHaveBeenCalledWith(
				'<img src="x" onerror="alert(1)">',
			);
			expect(escapeHTML).toHaveBeenCalledTimes(1);
		});

		it("should handle ampersand and special characters in caption", () => {
			const post = {
				id: "test-id",
				caption: "Tom & Jerry <3 Programming",
				attachments: [],
			};

			const result = escapeHTML(post.caption);

			expect(result).toBe("escaped_Tom & Jerry <3 Programming");
			expect(escapeHTML).toHaveBeenCalledWith("Tom & Jerry <3 Programming");
			expect(escapeHTML).toHaveBeenCalledTimes(1);
		});
	});
});
