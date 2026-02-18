import type { GraphQLObjectType, GraphQLResolveInfo } from "graphql";
import { describe, expect, it } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import { schema } from "~/src/graphql/schema";

/**
 * Test for output-level HTML escaping in Post resolver.
 *
 * API Contract: Raw HTML strings are stored in the database as-is.
 * HTML escaping is applied at resolver output time (not at input/storage time).
 * This prevents XSS while avoiding data corruption and double-escaping issues.
 *
 * The Post resolver in src/graphql/types/Post/Post.ts
 * applies escapeHTML() to the caption field when resolving.
 *
 * These tests use the real schema to verify resolver integration:
 * - Validates that the resolver actually calls the escaping logic
 * - Ensures the schema is correctly configured to use the resolver
 */

describe("Post GraphQL Type", () => {
	describe("caption field resolver", () => {
		it("should escape HTML in caption field", async () => {
			const postType = schema.getType("Post") as GraphQLObjectType;
			const captionField = postType.getFields().caption;
			if (!captionField) throw new Error("Caption field not found");
			if (!captionField.resolve) throw new Error("Resolver not defined");

			const mockPost = {
				id: "test-id",
				caption: '<script>alert("XSS")</script>',
			};

			// Execute the resolver with the mock post
			const result = await captionField.resolve(
				mockPost,
				{},
				{} as unknown as GraphQLContext,
				{} as unknown as GraphQLResolveInfo,
			);

			expect(result).toBe(
				"&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;",
			);
		});

		it("should escape image onerror XSS payload", async () => {
			const postType = schema.getType("Post") as GraphQLObjectType;
			const captionField = postType.getFields().caption;
			if (!captionField) throw new Error("Caption field not found");
			if (!captionField.resolve) throw new Error("Resolver not defined");

			const mockPost = {
				id: "test-id",
				caption: '<img src="x" onerror="alert(1)">',
			};

			const result = await captionField.resolve(
				mockPost,
				{},
				{} as unknown as GraphQLContext,
				{} as unknown as GraphQLResolveInfo,
			);

			expect(result).toBe(
				"&lt;img src=&quot;x&quot; onerror=&quot;alert(1)&quot;&gt;",
			);
		});

		it("should handle ampersand and special characters", async () => {
			const postType = schema.getType("Post") as GraphQLObjectType;
			const captionField = postType.getFields().caption;
			if (!captionField) throw new Error("Caption field not found");
			if (!captionField.resolve) throw new Error("Resolver not defined");

			const mockPost = {
				id: "test-id",
				caption: "Tom & Jerry <3 Programming",
			};

			const result = await captionField.resolve(
				mockPost,
				{},
				{} as unknown as GraphQLContext,
				{} as unknown as GraphQLResolveInfo,
			);

			expect(result).toBe("Tom &amp; Jerry &lt;3 Programming");
		});
	});

	describe("body field resolver", () => {
		it("should escape HTML in body field", async () => {
			const postType = schema.getType("Post") as GraphQLObjectType;
			const bodyField = postType.getFields().body;
			if (!bodyField) throw new Error("Body field not found");
			if (!bodyField.resolve) throw new Error("Resolver not defined");

			const mockPost = {
				id: "test-id",
				body: '<script>alert("XSS")</script><img src=x onerror=alert("xss")>',
			};

			// Execute the resolver with the mock post
			const result = await bodyField.resolve(
				mockPost,
				{},
				{} as unknown as GraphQLContext,
				{} as unknown as GraphQLResolveInfo,
			);

			expect(result).toBe(
				"&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;&lt;img src=x onerror=alert(&quot;xss&quot;)&gt;",
			);
		});

		it("should return null when body is null", async () => {
			const postType = schema.getType("Post") as GraphQLObjectType;
			const bodyField = postType.getFields().body;
			if (!bodyField) throw new Error("Body field not found");
			if (!bodyField.resolve) throw new Error("Resolver not defined");

			const mockPost = {
				id: "test-id",
				body: null,
			};

			const result = await bodyField.resolve(
				mockPost,
				{},
				{} as unknown as GraphQLContext,
				{} as unknown as GraphQLResolveInfo,
			);

			expect(result).toBeNull();
		});
	});
});
