import { vi, describe, it, expect, beforeEach } from "vitest";
import { builder } from "~/src/graphql/builder";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

// Mock the drizzleClient
const mockDrizzleClient = {
	query: {
		organizationsTable: {
			findMany: vi.fn(),
		},
	},
};

describe("organizationConnectionList Query", () => {
	beforeEach(() => {
		// Reset mocks before each test
		vi.clearAllMocks();
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
			{ drizzleClient: mockDrizzleClient },
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
			{ drizzleClient: mockDrizzleClient },
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
				{ drizzleClient: mockDrizzleClient },
			),
		).rejects.toThrow(TalawaGraphQLError);

		// Assert the error details
		try {
			await builder.queryFields.organizationConnectionList.resolve(
				{},
				{ first: 0, skip: 0 },
				{ drizzleClient: mockDrizzleClient },
			);
		} catch (error) {
			if (error instanceof TalawaGraphQLError) {
				expect(error.extensions.code).toBe("invalid_arguments");
				expect(error.extensions.issues).toEqual([
					{
						argumentPath: ["first"],
						message: "Number must be greater than or equal to 1",
					},
				]);
			}
		}
	});

	it("should throw TalawaGraphQLError when first is greater than 100", async () => {
		// Call the resolver with invalid `first` value
		await expect(
			builder.queryFields.organizationConnectionList.resolve(
				{},
				{ first: 101, skip: 0 },
				{ drizzleClient: mockDrizzleClient },
			),
		).rejects.toThrow(TalawaGraphQLError);

		// Assert the error details
		try {
			await builder.queryFields.organizationConnectionList.resolve(
				{},
				{ first: 101, skip: 0 },
				{ drizzleClient: mockDrizzleClient },
			);
		} catch (error) {
			if (error instanceof TalawaGraphQLError) {
				expect(error.extensions.code).toBe("invalid_arguments");
				expect(error.extensions.issues).toEqual([
					{
						argumentPath: ["first"],
						message: "Number must be less than or equal to 100",
					},
				]);
			}
		}
	});

	it("should throw TalawaGraphQLError when skip is less than 0", async () => {
		// Call the resolver with invalid `skip` value
		await expect(
			builder.queryFields.organizationConnectionList.resolve(
				{},
				{ first: 10, skip: -1 },
				{ drizzleClient: mockDrizzleClient },
			),
		).rejects.toThrow(TalawaGraphQLError);

		// Assert the error details
		try {
			await builder.queryFields.organizationConnectionList.resolve(
				{},
				{ first: 10, skip: -1 },
				{ drizzleClient: mockDrizzleClient },
			);
		} catch (error) {
			if (error instanceof TalawaGraphQLError) {
				expect(error.extensions.code).toBe("invalid_arguments");
				expect(error.extensions.issues).toEqual([
					{
						argumentPath: ["skip"],
						message: "Number must be greater than or equal to 0",
					},
				]);
			}
		}
	});
});
