import type { GraphQLObjectType } from "graphql";
import { describe, expect, it } from "vitest";

import { builder } from "~/src/graphql/builder";
import { schema } from "~/src/graphql/schema";
import { AssignUserTag } from "~/src/graphql/types/AssignUserTag/AssignUserTag";

builder.queryField("assignUserTagTest", (t) =>
	t.field({
		type: AssignUserTag,
		resolve: () => ({
			assigneeId: "user-id",
			tagId: "tag-id",
		}),
	}),
);

describe("GraphQL Type: AssignUserTag", () => {
	it("should be defined in the schema", () => {
		const type = schema.getType("AssignUserTag");
		expect(type).toBeDefined();
	});

	describe("Field Definitions", () => {
		it("should expose assigneeId field", () => {
			const type = schema.getType("AssignUserTag") as GraphQLObjectType;
			const fields = Object.keys(type.getFields());

			expect(fields).toContain("assigneeId");
		});

		it("should expose tagId field", () => {
			const type = schema.getType("AssignUserTag") as GraphQLObjectType;
			const fields = Object.keys(type.getFields());

			expect(fields).toContain("tagId");
		});
	});
});
