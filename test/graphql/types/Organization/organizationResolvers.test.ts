import { describe, test, expect, vi } from "vitest";
import { z } from "zod";
import { organizationConnectionList } from "~/src/graphql/types/Organization/organizationResolvers";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

// Manually define the validation schema (if not exported)
const organizationConnectionListArgumentsSchema = z.object({
	first: z.number().min(1).max(100).default(10),
	skip: z.number().min(0).default(0),
});

describe("organizationConnectionList", () => {
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

		await expect(organizationConnectionList.resolve(null, { first: 0, skip: -1 }, mockCtx)).rejects.toThrow(
			TalawaGraphQLError
		);
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

		const result = await organizationConnectionList.resolve(null, { first: 10, skip: 0 }, mockCtx);
		expect(result).toEqual(mockOrganizations);
	});
});
