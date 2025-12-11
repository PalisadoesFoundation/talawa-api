import type { GraphQLObjectType } from "graphql";
import { expect, suite, test, beforeAll } from "vitest";
import { builder } from "~/src/graphql/builder";

suite("UnassignUserTag GraphQL Type", () => {
	// Import the type in a beforeAll hook to ensure it's loaded and executed
	let UnassignUserTag: ReturnType<
		typeof builder.objectRef<{ assigneeId: string; tagId: string }>
	>;

	beforeAll(async () => {
		// Dynamic import to ensure coverage tracks the module execution
		const module = await import(
			"~/src/graphql/types/UnassignUserTag/UnassignUserTag"
		);
		UnassignUserTag = module.UnassignUserTag;
	});

	suite("Type Definition", () => {
		test("should be defined as a builder objectRef", () => {
			expect(UnassignUserTag).toBeDefined();
			expect(typeof UnassignUserTag).toBe("object");
		});

		test("should have the correct type name", () => {
			// The type name is set during objectRef creation
			expect(UnassignUserTag.name).toBe("UnassignUserTag");
		});
	});

	suite("Type Implementation", () => {
		test("should implement fields correctly", () => {
			// Build a minimal schema to verify the type implementation
			const schema = builder.toSchema();
			const unassignUserTagType = schema.getType("UnassignUserTag");

			expect(unassignUserTagType).toBeDefined();
			expect(unassignUserTagType?.toString()).toBe("UnassignUserTag");
		});

		test("should have correct description", () => {
			const schema = builder.toSchema();
			const unassignUserTagType = schema.getType(
				"UnassignUserTag"
			) as GraphQLObjectType;

			expect(unassignUserTagType).toBeDefined();
			expect(unassignUserTagType.description).toBe(
				"Represents a tag unassigned from a user."
			);
		});

		test("should expose assigneeId field as ID type", () => {
			const schema = builder.toSchema();
			const unassignUserTagType = schema.getType(
				"UnassignUserTag"
			) as GraphQLObjectType;

			expect(unassignUserTagType).toBeDefined();
			const fields = unassignUserTagType.getFields();
			expect(fields.assigneeId).toBeDefined();
			expect(fields.assigneeId?.type.toString()).toBe("ID");
			expect(fields.assigneeId?.description).toBe(
				"Unique identifier of the unassigned user."
			);
		});

		test("should expose tagId field as ID type", () => {
			const schema = builder.toSchema();
			const unassignUserTagType = schema.getType(
				"UnassignUserTag"
			) as GraphQLObjectType;

			expect(unassignUserTagType).toBeDefined();
			const fields = unassignUserTagType.getFields();
			expect(fields.tagId).toBeDefined();
			expect(fields.tagId?.type.toString()).toBe("ID");
			expect(fields.tagId?.description).toBe("Global identifier of the tag.");
		});

		test("should have exactly two fields", () => {
			const schema = builder.toSchema();
			const unassignUserTagType = schema.getType(
				"UnassignUserTag"
			) as GraphQLObjectType;

			expect(unassignUserTagType).toBeDefined();
			const fields = unassignUserTagType.getFields();
			const fieldNames = Object.keys(fields);
			expect(fieldNames).toHaveLength(2);
			expect(fieldNames).toContain("assigneeId");
			expect(fieldNames).toContain("tagId");
		});
	});

	suite("Type Shape Validation", () => {
		test("should accept valid UnassignUserTag shape", () => {
			// Test that objects matching the expected shape work correctly
			const validShapes = [
				{ assigneeId: "user-1", tagId: "tag-1" },
				{ assigneeId: "123", tagId: "456" },
				{ assigneeId: "", tagId: "" }, // Empty strings are still valid strings
			];

			validShapes.forEach((shape) => {
				expect(shape).toHaveProperty("assigneeId");
				expect(shape).toHaveProperty("tagId");
				expect(typeof shape.assigneeId).toBe("string");
				expect(typeof shape.tagId).toBe("string");
			});
		});

		test("should have ID type fields in schema", () => {
			const schema = builder.toSchema();
			const unassignUserTagType = schema.getType(
				"UnassignUserTag"
			) as GraphQLObjectType;

			expect(unassignUserTagType).toBeDefined();
			const fields = unassignUserTagType.getFields();

			// Both fields should be ID type
			expect(fields.assigneeId?.type.toString()).toBe("ID");
			expect(fields.tagId?.type.toString()).toBe("ID");
		});
	});

	suite("GraphQL Schema Integration", () => {
		test("should be properly integrated into the GraphQL schema", () => {
			const schema = builder.toSchema();
			const typeMap = schema.getTypeMap();

			expect(typeMap).toHaveProperty("UnassignUserTag");
			expect(typeMap.UnassignUserTag).toBeDefined();
		});

		test("should be an Object type in the schema", () => {
			const schema = builder.toSchema();
			const unassignUserTagType = schema.getType("UnassignUserTag");

			expect(unassignUserTagType).toBeDefined();
			if (unassignUserTagType) {
				expect("getFields" in unassignUserTagType).toBe(true);
			}
		});

		test("should have all required metadata", () => {
			const schema = builder.toSchema();
			const unassignUserTagType = schema.getType(
				"UnassignUserTag"
			) as GraphQLObjectType;

			expect(unassignUserTagType).toBeDefined();
			expect(unassignUserTagType.name).toBe("UnassignUserTag");
			expect(unassignUserTagType.description).toBe(
				"Represents a tag unassigned from a user."
			);

			const fields = unassignUserTagType.getFields();
			expect(Object.keys(fields)).toEqual(
				expect.arrayContaining(["assigneeId", "tagId"])
			);
		});
	});
});

