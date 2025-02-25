import { describe, test, expect, vi } from "vitest";
import { organizationConnectionListArgumentsSchema } from "~/src/graphql/schema"; // Adjust path as needed
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import { builder } from "~/src/graphql/builder";

describe("organizationConnectionList", () => {
	test("should define the query field", () => {
		expect(builder.queryField).toBeDefined();
	});

	test("should validate arguments successfully", () => {
		const validArgs = { first: 10, skip: 0 };
		const result = organizationConnectionListArgumentsSchema.safeParse(validArgs);
		expect(result.success).toBe(true);
	});

	test("should fail validation for invalid arguments", () => {
		const invalidArgs = { first: 0, skip: -1 };
		const result = organizationConnectionListArgumentsSchema.safeParse(invalidArgs);
		expect(result.success).toBe(false);
	});

	test("should throw TalawaGraphQLError on invalid arguments", async () => {
		const mockCtx = { drizzleClient: { query: { organizationsTable: { findMany: vi.fn() } } } };
		const resolver = builder.queryField("organizationConnectionList")._config.resolve;

		await expect(resolver(null, { first: 0 }, mockCtx)).rejects.toThrow(TalawaGraphQLError);
	});

	test("should return organizations on valid input", async () => {
		const mockOrganizations = [{ id: 1, name: "Org1" }];
		const mockCtx = {
			drizzleClient: {
				query: {
					organizationsTable: {
						findMany: vi.fn().mockResolvedValue(mockOrganizations),
					},
				},
			},
		};

		const resolver = builder.queryField("organizationConnectionList")._config.resolve;
		const result = await resolver(null, { first: 10, skip: 0 }, mockCtx);

		expect(result).toEqual(mockOrganizations);
	});
});
