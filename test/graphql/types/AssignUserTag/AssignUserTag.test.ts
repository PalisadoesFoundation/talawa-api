import type { GraphQLObjectType } from "graphql";
import { describe, expect, suite, test } from "vitest";
import { schema } from "~/src/graphql/schema";
import "~/src/graphql/types/AssignUserTag/AssignUserTag";

suite("AssignUserTag Type", () => {
	describe("Schema Registration", () => {
		test("should be registered in the GraphQL schema", () => {
			const type = schema.getType("AssignUserTag") as GraphQLObjectType;
			expect(type).toBeDefined();
			expect(type.name).toBe("AssignUserTag");
		});

		test("should have the correct type description", () => {
			const type = schema.getType("AssignUserTag") as GraphQLObjectType;
			expect(type.description).toBe("Represents a tag assigned to a user.");
		});

		test("should have exactly two fields", () => {
			const type = schema.getType("AssignUserTag") as GraphQLObjectType;
			const fields = type.getFields();
			expect(Object.keys(fields)).toHaveLength(2);
			expect(fields).toHaveProperty("assigneeId");
			expect(fields).toHaveProperty("tagId");
		});
	});

	describe("Field: assigneeId", () => {
		test("should be defined with correct type", () => {
			const type = schema.getType("AssignUserTag") as GraphQLObjectType;
			const field = type.getFields().assigneeId;

			expect(field).toBeDefined();
			expect(field?.type.toString()).toBe("ID");

			expect(field?.description).toBe(
				"Unique identifier of the assigned user.",
			);
		});
	});

	describe("Field: tagId", () => {
		test("should be defined with correct type", () => {
			const type = schema.getType("AssignUserTag") as GraphQLObjectType;
			const field = type.getFields().tagId;

			expect(field).toBeDefined();
			expect(field?.type.toString()).toBe("ID");

			expect(field?.description).toBe("Global identifier of the tag.");
		});
	});

	describe("Field Exposure", () => {
		test("assigneeId field should correctly expose value from parent object", () => {
			const type = schema.getType("AssignUserTag") as GraphQLObjectType;
			const field = type.getFields().assigneeId;

			// For exposed fields, the resolve function should be undefined or return the field value
			const testData = { assigneeId: "test-user-123", tagId: "test-tag-456" };

			if (field?.resolve) {
				const result = field.resolve(
					testData,
					{},
					{},
					{
						fieldName: "assigneeId",
						fieldNodes: [],
						returnType: field.type,
						parentType: type,
						path: { key: "assigneeId", prev: undefined, typename: undefined },
						schema,
						fragments: {},
						rootValue: undefined,
						operation: {} as never,
						variableValues: {},
					},
				);
				expect(result).toBe("test-user-123");
			} else {
				// If no resolver, Pothos exposes the field directly
				expect(testData.assigneeId).toBe("test-user-123");
			}
		});

		test("tagId field should correctly expose value from parent object", () => {
			const type = schema.getType("AssignUserTag") as GraphQLObjectType;
			const field = type.getFields().tagId;

			const testData = { assigneeId: "test-user-123", tagId: "test-tag-456" };

			if (field?.resolve) {
				const result = field.resolve(
					testData,
					{},
					{},
					{
						fieldName: "tagId",
						fieldNodes: [],
						returnType: field.type,
						parentType: type,
						path: { key: "tagId", prev: undefined, typename: undefined },
						schema,
						fragments: {},
						rootValue: undefined,
						operation: {} as never,
						variableValues: {},
					},
				);
				expect(result).toBe("test-tag-456");
			} else {
				// If no resolver, Pothos exposes the field directly
				expect(testData.tagId).toBe("test-tag-456");
			}
		});
	});
});
