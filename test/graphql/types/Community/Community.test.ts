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
 * Test for output-level HTML escaping in Community resolver.
 *
 * API Contract: Raw HTML strings are stored in the database as-is.
 * HTML escaping is applied at resolver output time (not at input/storage time).
 * This prevents XSS while avoiding data corruption and double-escaping issues.
 *
 * The Community resolver in src/graphql/types/Community/Community.ts
 * applies escapeHTML() to the name field when resolving.
 *
 * These tests mock escapeHTML to verify resolver integration:
 * - Catches regressions if escapeHTML calls are removed from resolvers
 * - Validates call arguments match expected field values
 */

describe("Community GraphQL Type", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("name field resolver", () => {
		it("should escape HTML in name field", async () => {
			const communityType = schema.getType("Community") as GraphQLObjectType;
			const nameField = communityType.getFields().name;

			if (!nameField) throw new Error("Name field not found");
			if (!nameField.resolve) throw new Error("Resolver not defined");

			const community = {
				id: "test-id",
				name: '<script>alert("XSS")</script>',
			};

			// Execute the resolver with the mock community
			const result = await nameField.resolve(
				community,
				{},
				{} as unknown as GraphQLContext,
				{} as unknown as GraphQLResolveInfo,
			);

			expect(result).toBe('escaped_<script>alert("XSS")</script>');
			expect(escapeHTML).toHaveBeenCalledWith('<script>alert("XSS")</script>');
			expect(escapeHTML).toHaveBeenCalledTimes(1);
		});

		it("should escape image onerror XSS payload", async () => {
			const communityType = schema.getType("Community") as GraphQLObjectType;
			const nameField = communityType.getFields().name;

			if (!nameField) throw new Error("Name field not found");
			if (!nameField.resolve) throw new Error("Resolver not defined");

			const community = {
				id: "test-id",
				name: '<img src="x" onerror="alert(1)">',
			};

			const result = await nameField.resolve(
				community,
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
			const communityType = schema.getType("Community") as GraphQLObjectType;
			const nameField = communityType.getFields().name;

			if (!nameField) throw new Error("Name field not found");
			if (!nameField.resolve) throw new Error("Resolver not defined");

			const community = {
				id: "test-id",
				name: "Tom & Jerry <3 Community",
			};

			const result = await nameField.resolve(
				community,
				{},
				{} as unknown as GraphQLContext,
				{} as unknown as GraphQLResolveInfo,
			);

			expect(result).toBe("escaped_Tom & Jerry <3 Community");
			expect(escapeHTML).toHaveBeenCalledWith("Tom & Jerry <3 Community");
			expect(escapeHTML).toHaveBeenCalledTimes(1);
		});
	});
});
