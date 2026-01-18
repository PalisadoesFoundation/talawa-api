import { printSchema } from "graphql";
import { describe, expect, it } from "vitest";
import { builder } from "~/src/graphql/builder";
import "~/src/graphql/types/AgendaItemUrl/AgendaItemUrl";

describe("AgendaItemUrl GraphQL type", () => {
	it("should be registered in the GraphQL schema", () => {
		const schema = builder.toSchema();
		const printedSchema = printSchema(schema);

		expect(printedSchema).toContain("type AgendaItemUrl");
	});

	it("should expose expected fields with correct types", () => {
		const schema = builder.toSchema();
		const printedSchema = printSchema(schema);

		expect(printedSchema).toContain("id: ID!");
		expect(printedSchema).toContain("url: String");
		expect(printedSchema).toContain("createdAt: DateTime!");
		expect(printedSchema).toContain("updatedAt: DateTime");
	});

	it("should include type description", () => {
		const schema = builder.toSchema();
		const printedSchema = printSchema(schema);

		expect(printedSchema).toContain('"URLs associated with an agenda item."');
	});
});
