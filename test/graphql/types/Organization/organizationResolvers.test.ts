import type { FastifyInstance, FastifyReply } from "fastify";
import type { MercuriusContext } from "mercurius";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import type { Organization } from "~/src/graphql/types/Organization/Organization";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import type { User } from "~/src/graphql/types/User/User";
import type { FastifyBaseLogger } from "fastify";
import { createMockLogger } from "../../../utilities/mockLogger";

type ResolverContext = GraphQLContext & MercuriusContext;

// Mock the drizzleClient
const mockDrizzleClient = {
	query: {
		organizationsTable: {
			findMany: vi.fn(),
		},
	},
};

describe("organizationConnectionList Query", () => {
	let context: ResolverContext;
	let logger: FastifyBaseLogger;

	beforeEach(() => {
		// Reset mocks and create a fresh context for each test
		vi.clearAllMocks();
		logger = createMockLogger();
		context = {
			drizzleClient: mockDrizzleClient,
			logger,
		} as unknown as ResolverContext;
	});

	it("should return organizations with valid arguments", async () => {
		// Mock the database response
		const mockOrganizations = [
			{ id: 1, name: "Org 1" },
			{ id: 2, name: "Org 2" },
		];
		mockDrizzleClient.query.organizationsTable.findMany.mockResolvedValue(
			mockOrganizations,
		);

		// Call the resolver with valid arguments
		const result = await builder.queryFields.organizationConnectionList.resolve(
			{},
			{ first: 10, skip: 0 },
			context,
		);

		// Assertions
		expect(result).toEqual(mockOrganizations);
		expect(mockDrizzleClient.query.organizationsTable.findMany).toHaveBeenCalledWith({
			limit: 10,
			offset: 0,
		});
	});

	it("should use default values when arguments are not provided", async () => {
		// Mock the database response
		const mockOrganizations = [{ id: 1, name: "Org 1" }];
		mockDrizzleClient.query.organizationsTable.findMany.mockResolvedValue(
			mockOrganizations,
		);

		// Call the resolver without arguments
		const result = await builder.queryFields.organizationConnectionList.resolve(
			{},
			{},
			context,
		);

		// Assertions
		expect(result).toEqual(mockOrganizations);
		expect(mockDrizzleClient.query.organizationsTable.findMany).toHaveBeenCalledWith({
			limit: 10, // Default value for `first`
			offset: 0, // Default value for `skip`
		});
	});

	it("should throw TalawaGraphQLError when first is less than 1", async () => {
		// Call the resolver with invalid `first` value
		await expect(
			builder.queryFields.organizationConnectionList.resolve(
				{},
				{ first: 0, skip: 0 },
				context,
			),
		).rejects.toThrow(TalawaGraphQLError);

		// Assert the error details
		try {
			await builder.queryFields.organizationConnectionList.resolve(
				{},
				{ first: 0, skip: 0 },
				context,
			);
		} catch (error) {
			expect(error.extensions.code).toBe("invalid_arguments");
			expect(error.extensions.issues).toEqual([
				{
					argumentPath: ["first"],
					message: "Number must be greater than or equal to 1",
				},
			]);
		}
	});

	it("should throw TalawaGraphQLError when first is greater than 100", async () => {
		// Call the resolver with invalid `first` value
		await expect(
			builder.queryFields.organizationConnectionList.resolve(
				{},
				{ first: 101, skip: 0 },
				context,
			),
		).rejects.toThrow(TalawaGraphQLError);

		// Assert the error details
		try {
			await builder.queryFields.organizationConnectionList.resolve(
				{},
				{ first: 101, skip: 0 },
				context,
			);
		} catch (error) {
			expect(error.extensions.code).toBe("invalid_arguments");
			expect(error.extensions.issues).toEqual([
				{
					argumentPath: ["first"],
					message: "Number must be less than or equal to 100",
				},
			]);
		}
	});

	it("should throw TalawaGraphQLError when skip is less than 0", async () => {
		// Call the resolver with invalid `skip` value
		await expect(
			builder.queryFields.organizationConnectionList.resolve(
				{},
				{ first: 10, skip: -1 },
				context,
			),
		).rejects.toThrow(TalawaGraphQLError);

		// Assert the error details
		try {
			await builder.queryFields.organizationConnectionList.resolve(
				{},
				{ first: 10, skip: -1 },
				context,
			);
		} catch (error) {
			expect(error.extensions.code).toBe("invalid_arguments");
			expect(error.extensions.issues).toEqual([
				{
					argumentPath: ["skip"],
					message: "Number must be greater than or equal to 0",
				},
			]);
		}
	});
});
