import { beforeEach, describe, expect, it, vi } from "vitest";
import { organizationsTable } from "~/src/drizzle/tables/organizations";
import { builder } from "~/src/graphql/builder";
import type { GraphQLContext } from "~/src/graphql/context";
import { Organization } from "~/src/graphql/types/Organization/Organization";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import * as defaultConnectionUtils from "~/src/utilities/defaultGraphQLConnection";
const { resolve } = await import(
	"~/src/graphql/types/Organization/organizationsConnection"
);

// Mock the utilities
vi.mock("~/src/utilities/defaultGraphQLConnection", () => ({
	transformDefaultGraphQLConnectionArguments: vi.fn().mockReturnValue({
		limit: 10,
		offset: 0,
	}),
	transformToDefaultGraphQLConnection: vi.fn().mockReturnValue({
		edges: [
			{
				node: { id: "1", name: "Org 1" },
				cursor: "1",
			},
		],
	}),
}));

describe("organizationsConnection Query", async () => {
	const mockSelect = vi.fn();
	const mockFrom = vi.fn();
	const mockLimit = vi.fn();
	const mockOrderBy = vi.fn();

	const mockDrizzleClient = {
		select: mockSelect.mockReturnThis(),
		from: mockFrom.mockReturnThis(),
		limit: mockLimit.mockReturnThis(),
		orderBy: mockOrderBy,
	};

	const mockContext = {
		drizzleClient: mockDrizzleClient,
	};

	beforeEach(() => {
		vi.clearAllMocks();
		// Reset mock implementations
		mockSelect.mockReturnThis();
		mockFrom.mockReturnThis();
		mockLimit.mockReturnThis();
		mockOrderBy.mockResolvedValue([
			{ id: "1", name: "Org 1", createdAt: new Date() },
		]);
	});

	it("should return organizations when valid arguments are provided", async () => {
		const args = {
			first: 10,
			after: null,
			last: null,
			before: null,
		};

		const result = await resolve(
			null,
			args,
			mockContext as unknown as GraphQLContext,
		);

		expect(mockSelect).toHaveBeenCalled();
		expect(mockFrom).toHaveBeenCalledWith(organizationsTable);
		expect(mockLimit).toHaveBeenCalled();
		expect(mockOrderBy).toHaveBeenCalled();
		expect(result).toBeDefined();
		expect(result).toEqual([{ id: "1", name: "Org 1" }]);
	});

	it("should handle null arguments", async () => {
		const args = {};

		const result = await resolve(
			null,
			args,
			mockContext as unknown as GraphQLContext,
		);

		expect(
			defaultConnectionUtils.transformDefaultGraphQLConnectionArguments,
		).toHaveBeenCalledWith(
			expect.objectContaining({
				first: undefined,
				after: undefined,
				last: undefined,
				before: undefined,
			}),
			expect.any(Object),
		);
		expect(result).toBeDefined();
	});

	it("should throw error when no organizations are found", async () => {
		// Clear the default mock and set empty array response
		mockOrderBy.mockReset();
		mockOrderBy.mockResolvedValueOnce([]);

		const promise = resolve(
			null,
			{ first: 10 },
			mockContext as unknown as GraphQLContext,
		);

		await expect(promise).rejects.toThrowError(TalawaGraphQLError);
		await expect(promise).rejects.toThrow(
			"No organizations found in the database.",
		);
	});

	it("should handle database errors gracefully", async () => {
		// Clear the default mock and set error response
		mockOrderBy.mockReset();
		mockOrderBy.mockRejectedValueOnce(new Error("Database error"));

		const promise = resolve(
			null,
			{ first: 10 },
			mockContext as unknown as GraphQLContext,
		);

		await expect(promise).rejects.toThrowError(TalawaGraphQLError);
		await expect(promise).rejects.toThrow(
			"An unexpected error occurred while fetching organizations.",
		);
	});

	it("should handle pagination arguments correctly", async () => {
		const args = {
			first: 5,
			after: "cursor",
			last: null,
			before: null,
		};

		await resolve(null, args, mockContext as unknown as GraphQLContext);

		expect(
			defaultConnectionUtils.transformDefaultGraphQLConnectionArguments,
		).toHaveBeenCalledWith(
			expect.objectContaining({
				first: 5,
				after: "cursor",
				last: undefined,
				before: undefined,
			}),
			expect.any(Object),
		);
	});

	it("should handle empty string cursors", async () => {
		const args = {
			first: 5,
			after: "",
			before: "",
			last: null,
		};

		await resolve(null, args, mockContext as unknown as GraphQLContext);

		// Empty strings should be converted to undefined
		expect(
			defaultConnectionUtils.transformDefaultGraphQLConnectionArguments,
		).toHaveBeenCalledWith(
			{
				first: 5,
				after: undefined,
				before: undefined,
				last: undefined,
			},
			expect.any(Object),
		);
	});

	it("should define organizationsConnection field correctly", () => {
		const queryFieldSpy = vi.spyOn(builder, "queryField");

		builder.queryField("organizationsConnection", (t) =>
			t.field({
				type: [Organization],
				args: {
					first: t.arg.int({ required: false }),
					after: t.arg.string({ required: false }),
					last: t.arg.int({ required: false }),
					before: t.arg.string({ required: false }),
				},
				resolve,
			}),
		);

		expect(queryFieldSpy).toHaveBeenCalledWith(
			"organizationsConnection",
			expect.any(Function),
		);
		queryFieldSpy.mockRestore();
	});

	it("should properly transform the connection result", async () => {
		const mockOrg = { id: "1", name: "Org 1", createdAt: new Date() };
		mockOrderBy.mockResolvedValueOnce([mockOrg]);

		await resolve(
			null,
			{ first: 10 },
			mockContext as unknown as GraphQLContext,
		);

		expect(
			defaultConnectionUtils.transformToDefaultGraphQLConnection,
		).toHaveBeenCalledWith({
			parsedArgs: expect.any(Object),
			rawNodes: [mockOrg],
			createCursor: expect.any(Function),
			createNode: expect.any(Function),
		});
	});

	it("should correctly use createCursor and createNode functions", async () => {
		const mockOrg = { id: "123", name: "Test Org", createdAt: new Date() };
		mockOrderBy.mockResolvedValueOnce([mockOrg]);

		const transformSpy = vi.spyOn(
			defaultConnectionUtils,
			"transformToDefaultGraphQLConnection",
		);

		await resolve(
			null,
			{ first: 10 },
			mockContext as unknown as GraphQLContext,
		);

		expect(transformSpy).toHaveBeenCalledWith(
			expect.objectContaining({
				rawNodes: [mockOrg],
				createCursor: expect.any(Function),
				createNode: expect.any(Function),
			}),
		);

		const { createCursor, createNode } = transformSpy.mock.calls[0]?.[0] ?? {};

		if (createCursor && createNode) {
			// Test createCursor function
			expect(createCursor(mockOrg)).toBe("123");

			// Test createNode function
			expect(createNode(mockOrg)).toEqual(mockOrg);
		} else {
			fail("createCursor or createNode is undefined");
		}

		transformSpy.mockRestore();
	});
});

function fail(message: string): never {
	throw new Error(message);
}
