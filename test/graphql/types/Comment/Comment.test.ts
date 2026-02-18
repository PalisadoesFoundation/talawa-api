import type { GraphQLObjectType, GraphQLResolveInfo } from "graphql";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import { schema } from "~/src/graphql/schema";
import { escapeHTML } from "~/src/utilities/sanitizer";

// Mock the escapeHTML function
vi.mock("~/src/utilities/sanitizer", async (importOriginal) => {
	const actual =
		await importOriginal<typeof import("~/src/utilities/sanitizer")>();
	return {
		...actual,
		escapeHTML: vi.fn((str: string) => `escaped_${str}`),
	};
});

/**
 * Test for output-level HTML escaping in Comment resolver.
 *
 * API Contract: Raw HTML strings are stored in the database as-is.
 * HTML escaping is applied at resolver output time (not at input/storage time).
 * This prevents XSS while avoiding data corruption and double-escaping issues.
 *
 * The Comment resolver in src/graphql/types/Comment/Comment.ts
 * applies escapeHTML() to the body field when resolving.
 *
 * These tests mock escapeHTML to verify resolver integration:
 * - Catches regressions if escapeHTML calls are removed from resolvers
 * - Validates call arguments match expected field values
 */

describe("Comment GraphQL Type", () => {
	// Clear mocks between tests to isolate mock state
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("body field resolver", () => {
		it("should escape HTML in body field", async () => {
			const commentType = schema.getType("Comment") as GraphQLObjectType;
			const bodyField = commentType.getFields().body;

			if (!bodyField) throw new Error("Body field not found");
			if (!bodyField.resolve) throw new Error("Resolver not defined");

			const comment = {
				id: "test-id",
				body: '<script>alert("XSS")</script>',
			};

			// Execute the resolver with the mock comment
			const result = await bodyField.resolve(
				comment,
				{},
				{} as unknown as GraphQLContext,
				{} as unknown as GraphQLResolveInfo,
			);

			expect(result).toBe('escaped_<script>alert("XSS")</script>');
			expect(escapeHTML).toHaveBeenCalledWith('<script>alert("XSS")</script>');
			expect(escapeHTML).toHaveBeenCalledTimes(1);
		});

		it("should escape image onerror XSS payload", async () => {
			const commentType = schema.getType("Comment") as GraphQLObjectType;
			const bodyField = commentType.getFields().body;

			if (!bodyField) throw new Error("Body field not found");
			if (!bodyField.resolve) throw new Error("Resolver not defined");

			const comment = {
				id: "test-id",
				body: '<img src="x" onerror="alert(1)">',
			};

			const result = await bodyField.resolve(
				comment,
				{},
				{} as unknown as GraphQLContext,
				{} as unknown as GraphQLResolveInfo,
			);

			expect(result).toBe('escaped_<img src="x" onerror="alert(1)">');
			expect(escapeHTML).toHaveBeenCalledWith(
				'<img src="x" onerror="alert(1)">',
			);
			expect(escapeHTML).toHaveBeenCalledTimes(1);
		});

		it("should handle ampersand and special characters", async () => {
			const commentType = schema.getType("Comment") as GraphQLObjectType;
			const bodyField = commentType.getFields().body;

			if (!bodyField) throw new Error("Body field not found");
			if (!bodyField.resolve) throw new Error("Resolver not defined");

			const comment = {
				id: "test-id",
				body: "Tom & Jerry <3 Programming",
			};

			const result = await bodyField.resolve(
				comment,
				{},
				{} as unknown as GraphQLContext,
				{} as unknown as GraphQLResolveInfo,
			);

			expect(result).toBe("escaped_Tom & Jerry <3 Programming");
			expect(escapeHTML).toHaveBeenCalledWith("Tom & Jerry <3 Programming");
			expect(escapeHTML).toHaveBeenCalledTimes(1);
		});
	});
});
