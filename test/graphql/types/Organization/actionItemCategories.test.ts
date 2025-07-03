import { Buffer } from "node:buffer";
import { asc, desc, eq } from "drizzle-orm";
import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { actionCategoriesTable } from "~/src/drizzle/tables/actionCategories";
import type { GraphQLContext } from "~/src/graphql/context";
import type { Organization as OrganizationType } from "~/src/graphql/types/Organization/Organization";
import { resolveActionItemCategories } from "~/src/graphql/types/Organization/actionItemCategories";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

// Mock data
const mockActionItemCategory1 = {
	id: "01234567-89ab-cdef-0123-456789abcdef",
	name: "High Priority",
	description: "Action items that require immediate attention",
	isDisabled: false,
	organizationId: "org-1",
	createdAt: new Date("2024-01-01T10:00:00Z"),
	updatedAt: new Date("2024-01-01T10:00:00Z"),
	creatorId: "user-admin",
	updaterId: null,
};

const mockActionItemCategory2 = {
	id: "01234567-89ab-cdef-0123-456789abcde2",
	name: "Medium Priority",
	description: "Standard action items",
	isDisabled: false,
	organizationId: "org-1",
	createdAt: new Date("2024-01-02T10:00:00Z"),
	updatedAt: new Date("2024-01-02T10:00:00Z"),
	creatorId: "user-admin",
	updaterId: "user-admin",
};

const mockOrganization: OrganizationType = {
	id: "org-1",
	name: "Test Organization",
	description: "Test organization description",
	addressLine1: "123 Test St",
	addressLine2: "Suite 456",
	city: "Test City",
	state: "Test State",
	postalCode: "12345",
	countryCode: "us",
	avatarName: null,
	avatarMimeType: "image/jpeg",
	userRegistrationRequired: false,
	createdAt: new Date("2024-01-01T00:00:00Z"),
	updatedAt: new Date("2024-01-01T00:00:00Z"),
	creatorId: "user-admin",
	updaterId: null,
};

describe("Organization.actionItemCategories resolver", () => {
	let ctx: GraphQLContext;
	let mocks: ReturnType<typeof createMockGraphQLContext>["mocks"];

	beforeEach(() => {
		vi.clearAllMocks();
		const { context, mocks: newMocks } = createMockGraphQLContext(
			true,
			"user-1",
		);
		ctx = context;
		mocks = newMocks;

		// Mock the select method for exists queries
		const mockSelect = {
			from: vi.fn().mockReturnThis(),
			where: vi.fn().mockReturnThis(),
		};
		ctx.drizzleClient.select = vi.fn().mockReturnValue(mockSelect);
	});

	describe("Authentication", () => {
		it("should throw unauthenticated error when user is not authenticated", async () => {
			ctx.currentClient.isAuthenticated = false;

			await expect(
				resolveActionItemCategories(mockOrganization, { first: 10 }, ctx),
			).rejects.toThrow(
				new TalawaGraphQLError({
					extensions: {
						code: "unauthenticated",
					},
				}),
			);
		});

		it("should throw unauthenticated error when user is not found", async () => {
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				undefined,
			);

			await expect(
				resolveActionItemCategories(mockOrganization, { first: 10 }, ctx),
			).rejects.toThrow(
				new TalawaGraphQLError({
					extensions: {
						code: "unauthenticated",
					},
				}),
			);
		});
	});

	describe("Authorization", () => {
		it("should throw unauthorized_action error when user is not an administrator", async () => {
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
				id: "user-1",
				role: "member",
				organizationMembershipsWhereMember: [{ role: "member" }],
			});

			await expect(
				resolveActionItemCategories(mockOrganization, { first: 10 }, ctx),
			).rejects.toThrow(
				new TalawaGraphQLError({
					extensions: {
						code: "unauthorized_action",
					},
				}),
			);
		});

		it("should throw unauthorized_action error when user has no organization membership", async () => {
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
				id: "user-1",
				role: "member",
				organizationMembershipsWhereMember: [], // No membership
			});

			await expect(
				resolveActionItemCategories(mockOrganization, { first: 10 }, ctx),
			).rejects.toThrow(
				new TalawaGraphQLError({
					extensions: {
						code: "unauthorized_action",
					},
				}),
			);
		});

		it("should allow global administrator", async () => {
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
				id: "user-1",
				role: "administrator",
				organizationMembershipsWhereMember: [],
			});
			mocks.drizzleClient.query.actionCategoriesTable.findMany.mockResolvedValue(
				[mockActionItemCategory1],
			);

			const result = await resolveActionItemCategories(
				mockOrganization,
				{ first: 10 },
				ctx,
			);

			expect(result).toBeDefined();
			expect(result.edges).toHaveLength(1);
		});

		it("should allow organization administrator", async () => {
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
				id: "user-1",
				role: "member",
				organizationMembershipsWhereMember: [{ role: "administrator" }],
			});
			mocks.drizzleClient.query.actionCategoriesTable.findMany.mockResolvedValue(
				[mockActionItemCategory1],
			);

			const result = await resolveActionItemCategories(
				mockOrganization,
				{ first: 10 },
				ctx,
			);

			expect(result).toBeDefined();
			expect(result.edges).toHaveLength(1);
		});

		it("should allow global administrator even without organization membership", async () => {
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
				id: "user-1",
				role: "administrator",
				organizationMembershipsWhereMember: [], // No org membership but global admin
			});
			mocks.drizzleClient.query.actionCategoriesTable.findMany.mockResolvedValue(
				[mockActionItemCategory1],
			);

			const result = await resolveActionItemCategories(
				mockOrganization,
				{ first: 10 },
				ctx,
			);

			expect(result).toBeDefined();
			expect(result.edges).toHaveLength(1);
		});
	});

	describe("Argument Parsing and Validation", () => {
		beforeEach(() => {
			// Setup valid user for argument tests
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
				id: "user-1",
				role: "administrator",
				organizationMembershipsWhereMember: [],
			});
		});

		it("should throw error when both first and last are provided", async () => {
			await expect(
				resolveActionItemCategories(
					mockOrganization,
					{ first: 10, last: 10 },
					ctx,
				),
			).rejects.toThrow(
				new TalawaGraphQLError({
					extensions: {
						code: "invalid_arguments",
						issues: expect.arrayContaining([
							expect.objectContaining({
								argumentPath: ["last"],
								message:
									'Argument "last" cannot be provided with argument "first".',
							}),
						]),
					},
				}),
			);
		});

		it("should throw error when before is provided with first", async () => {
			await expect(
				resolveActionItemCategories(
					mockOrganization,
					{ first: 10, before: "cursor" },
					ctx,
				),
			).rejects.toThrow(
				new TalawaGraphQLError({
					extensions: {
						code: "invalid_arguments",
						issues: expect.arrayContaining([
							expect.objectContaining({
								argumentPath: ["before"],
								message:
									'Argument "before" cannot be provided with argument "first".',
							}),
						]),
					},
				}),
			);
		});

		it("should throw error when after is provided with last", async () => {
			await expect(
				resolveActionItemCategories(
					mockOrganization,
					{ last: 10, after: "cursor" },
					ctx,
				),
			).rejects.toThrow(
				new TalawaGraphQLError({
					extensions: {
						code: "invalid_arguments",
						issues: expect.arrayContaining([
							expect.objectContaining({
								argumentPath: ["after"],
								message:
									'Argument "after" cannot be provided with argument "last".',
							}),
						]),
					},
				}),
			);
		});

		it("should throw error when neither first nor last is provided", async () => {
			await expect(
				resolveActionItemCategories(mockOrganization, {}, ctx),
			).rejects.toThrow(
				new TalawaGraphQLError({
					extensions: {
						code: "invalid_arguments",
						issues: expect.arrayContaining([
							expect.objectContaining({
								argumentPath: ["first"],
								message:
									'A non-null value for argument "first" must be provided.',
							}),
							expect.objectContaining({
								argumentPath: ["last"],
								message:
									'A non-null value for argument "last" must be provided.',
							}),
						]),
					},
				}),
			);
		});

		it("should throw error for invalid cursor format", async () => {
			await expect(
				resolveActionItemCategories(
					mockOrganization,
					{ first: 10, after: "invalid-cursor" },
					ctx,
				),
			).rejects.toThrow(
				new TalawaGraphQLError({
					extensions: {
						code: "invalid_arguments",
						issues: expect.arrayContaining([
							expect.objectContaining({
								argumentPath: ["after"],
								message: "Not a valid cursor.",
							}),
						]),
					},
				}),
			);
		});

		it("should throw error for cursor with invalid JSON", async () => {
			const invalidJsonCursor = Buffer.from("invalid json", "utf-8").toString(
				"base64url",
			);

			await expect(
				resolveActionItemCategories(
					mockOrganization,
					{ first: 10, after: invalidJsonCursor },
					ctx,
				),
			).rejects.toThrow(
				new TalawaGraphQLError({
					extensions: {
						code: "invalid_arguments",
						issues: expect.arrayContaining([
							expect.objectContaining({
								argumentPath: ["after"],
								message: "Not a valid cursor.",
							}),
						]),
					},
				}),
			);
		});

		it("should throw error for cursor missing required fields", async () => {
			const invalidCursor = Buffer.from(
				JSON.stringify({ id: "test-id" }), // Missing name
				"utf-8",
			).toString("base64url");

			await expect(
				resolveActionItemCategories(
					mockOrganization,
					{ first: 10, after: invalidCursor },
					ctx,
				),
			).rejects.toThrow(
				new TalawaGraphQLError({
					extensions: {
						code: "invalid_arguments",
						issues: expect.arrayContaining([
							expect.objectContaining({
								argumentPath: ["after"],
								message: "Not a valid cursor.",
							}),
						]),
					},
				}),
			);
		});

		it("should reject first parameter below minimum", async () => {
			await expect(
				resolveActionItemCategories(mockOrganization, { first: 0 }, ctx),
			).rejects.toThrow(
				new TalawaGraphQLError({
					extensions: {
						code: "invalid_arguments",
						issues: expect.any(Array),
					},
				}),
			);
		});

		it("should reject first parameter above maximum", async () => {
			await expect(
				resolveActionItemCategories(mockOrganization, { first: 33 }, ctx),
			).rejects.toThrow(
				new TalawaGraphQLError({
					extensions: {
						code: "invalid_arguments",
						issues: expect.any(Array),
					},
				}),
			);
		});
	});

	describe("Successful Resolution", () => {
		beforeEach(() => {
			// Setup valid admin user
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
				id: "user-1",
				role: "administrator",
				organizationMembershipsWhereMember: [],
			});
		});

		it("should return action item categories connection for the organization", async () => {
			mocks.drizzleClient.query.actionCategoriesTable.findMany.mockResolvedValue(
				[mockActionItemCategory1, mockActionItemCategory2],
			);

			const result = await resolveActionItemCategories(
				mockOrganization,
				{ first: 10 },
				ctx,
			);

			expect(result.edges).toHaveLength(2);
			expect(result.edges[0]?.node).toEqual(mockActionItemCategory1);
			expect(result.edges[1]?.node).toEqual(mockActionItemCategory2);
			expect(result.pageInfo.hasNextPage).toBe(false);
			expect(result.pageInfo.hasPreviousPage).toBe(false);
		});

		it("should return empty connection when no categories exist", async () => {
			mocks.drizzleClient.query.actionCategoriesTable.findMany.mockResolvedValue(
				[],
			);

			const result = await resolveActionItemCategories(
				mockOrganization,
				{ first: 10 },
				ctx,
			);

			expect(result.edges).toHaveLength(0);
			expect(result.pageInfo.startCursor).toBeNull();
			expect(result.pageInfo.endCursor).toBeNull();
			expect(result.pageInfo.hasNextPage).toBe(false);
			expect(result.pageInfo.hasPreviousPage).toBe(false);
		});

		it("should filter by organization ID", async () => {
			mocks.drizzleClient.query.actionCategoriesTable.findMany.mockResolvedValue(
				[mockActionItemCategory1, mockActionItemCategory2],
			);

			await resolveActionItemCategories(mockOrganization, { first: 10 }, ctx);

			const findManyCalls = mocks.drizzleClient.query.actionCategoriesTable
				.findMany as ReturnType<typeof vi.fn>;
			expect(findManyCalls).toHaveBeenCalled();

			const callArgs = findManyCalls.mock.calls[0]?.[0];
			expect(callArgs).toBeDefined();
			expect(callArgs).toHaveProperty("where");
			expect(callArgs.where).toEqual(
				eq(actionCategoriesTable.organizationId, mockOrganization.id),
			);
		});
	});

	describe("Cursor Creation and Handling", () => {
		beforeEach(() => {
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
				id: "user-1",
				role: "administrator",
				organizationMembershipsWhereMember: [],
			});
		});

		it("should create valid base64url cursors", async () => {
			mocks.drizzleClient.query.actionCategoriesTable.findMany.mockResolvedValue(
				[mockActionItemCategory1],
			);

			const result = await resolveActionItemCategories(
				mockOrganization,
				{ first: 1 },
				ctx,
			);

			const cursor = result.edges[0]?.cursor;
			expect(cursor).toBeTruthy();

			if (cursor) {
				const decoded = JSON.parse(
					Buffer.from(cursor, "base64url").toString("utf-8"),
				);
				expect(decoded).toEqual({
					name: mockActionItemCategory1.name,
				});
			}
		});

		it("should handle valid cursor for pagination", async () => {
			const cursor = Buffer.from(
				JSON.stringify({
					name: mockActionItemCategory1.name,
				}),
				"utf-8",
			).toString("base64url");

			mocks.drizzleClient.query.actionCategoriesTable.findMany.mockResolvedValue(
				[mockActionItemCategory2],
			);

			const result = await resolveActionItemCategories(
				mockOrganization,
				{ first: 10, after: cursor },
				ctx,
			);

			expect(result.edges).toHaveLength(1);
			expect(result.edges[0]?.node).toEqual(mockActionItemCategory2);
		});

		it("should throw error when cursor references non-existent data", async () => {
			const cursor = Buffer.from(
				JSON.stringify({
					name: "Non-existent Category Name",
				}),
				"utf-8",
			).toString("base64url");

			mocks.drizzleClient.query.actionCategoriesTable.findMany.mockResolvedValue(
				[],
			);

			await expect(
				resolveActionItemCategories(
					mockOrganization,
					{ first: 10, after: cursor },
					ctx,
				),
			).rejects.toThrow(
				new TalawaGraphQLError({
					extensions: {
						code: "arguments_associated_resources_not_found",
						issues: [
							{
								argumentPath: ["after"],
							},
						],
					},
				}),
			);
		});

		it("should throw error for cursor with missing name field", async () => {
			const cursor = Buffer.from(
				JSON.stringify({ id: "some-id" }), // Missing name
				"utf-8",
			).toString("base64url");

			await expect(
				resolveActionItemCategories(
					mockOrganization,
					{ first: 10, after: cursor },
					ctx,
				),
			).rejects.toThrow(
				new TalawaGraphQLError({
					extensions: {
						code: "invalid_arguments",
						issues: expect.arrayContaining([
							expect.objectContaining({
								argumentPath: ["after"],
								message: "Not a valid cursor.",
							}),
						]),
					},
				}),
			);
		});
	});

	describe("Order By Verification", () => {
		beforeEach(() => {
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
				id: "user-1",
				role: "administrator",
				organizationMembershipsWhereMember: [],
			});
		});

		it("should use ascending order for forward pagination", async () => {
			mocks.drizzleClient.query.actionCategoriesTable.findMany.mockResolvedValue(
				[],
			);

			await resolveActionItemCategories(mockOrganization, { first: 1 }, ctx);

			const findManyCalls = mocks.drizzleClient.query.actionCategoriesTable
				.findMany as ReturnType<typeof vi.fn>;
			expect(findManyCalls).toHaveBeenCalled();

			const callArgs = findManyCalls.mock.calls[0]?.[0];
			expect(callArgs).toBeDefined();
			expect(callArgs).toHaveProperty("orderBy");
			expect(callArgs.orderBy).toEqual([asc(actionCategoriesTable.name)]);
		});

		it("should use descending order for backward pagination", async () => {
			mocks.drizzleClient.query.actionCategoriesTable.findMany.mockResolvedValue(
				[],
			);

			await resolveActionItemCategories(mockOrganization, { last: 1 }, ctx);

			const findManyCalls = mocks.drizzleClient.query.actionCategoriesTable
				.findMany as ReturnType<typeof vi.fn>;
			expect(findManyCalls).toHaveBeenCalled();

			const callArgs = findManyCalls.mock.calls[0]?.[0];
			expect(callArgs).toBeDefined();
			expect(callArgs).toHaveProperty("orderBy");
			expect(callArgs.orderBy).toEqual([desc(actionCategoriesTable.name)]);
		});
	});

	describe("Error Handling", () => {
		beforeEach(() => {
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
				id: "user-1",
				role: "administrator",
				organizationMembershipsWhereMember: [],
			});
		});

		it("should propagate database errors", async () => {
			const dbError = new Error("Database connection failed");
			mocks.drizzleClient.query.actionCategoriesTable.findMany.mockRejectedValue(
				dbError,
			);

			await expect(
				resolveActionItemCategories(mockOrganization, { first: 10 }, ctx),
			).rejects.toThrow(dbError);
		});
	});

	describe("Pagination Edge Cases", () => {
		beforeEach(() => {
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
				id: "user-1",
				role: "administrator",
				organizationMembershipsWhereMember: [],
			});
		});

		it("should handle hasNextPage correctly when there are more results", async () => {
			// Return limit + 1 results to simulate more data
			const extraCategory = { ...mockActionItemCategory2, id: "extra-id" };
			mocks.drizzleClient.query.actionCategoriesTable.findMany.mockResolvedValue(
				[mockActionItemCategory1, mockActionItemCategory2, extraCategory],
			);

			const result = await resolveActionItemCategories(
				mockOrganization,
				{ first: 2 },
				ctx,
			);

			expect(result.edges).toHaveLength(2); // Extra result should be removed
			expect(result.pageInfo.hasNextPage).toBe(true);
		});

		it("should handle null cursor values", async () => {
			mocks.drizzleClient.query.actionCategoriesTable.findMany.mockResolvedValue(
				[mockActionItemCategory1],
			);

			const result = await resolveActionItemCategories(
				mockOrganization,
				{ first: 1, after: null },
				ctx,
			);

			expect(result.edges).toHaveLength(1);
		});

		it("should handle same name categories correctly", async () => {
			const sameNameCategory1 = {
				...mockActionItemCategory1,
				id: "category-1",
			};
			const sameNameCategory2 = {
				...mockActionItemCategory1,
				id: "category-2",
			};

			mocks.drizzleClient.query.actionCategoriesTable.findMany.mockResolvedValue(
				[sameNameCategory1, sameNameCategory2],
			);

			const result = await resolveActionItemCategories(
				mockOrganization,
				{ first: 2 },
				ctx,
			);

			expect(result.edges).toHaveLength(2);
			expect(result.edges[0]?.node.id).toBe("category-1");
			expect(result.edges[1]?.node.id).toBe("category-2");
		});

		it("should handle backward pagination with cursor", async () => {
			const cursor = Buffer.from(
				JSON.stringify({
					name: mockActionItemCategory2.name,
				}),
				"utf-8",
			).toString("base64url");

			mocks.drizzleClient.query.actionCategoriesTable.findMany.mockResolvedValue(
				[mockActionItemCategory1],
			);

			const result = await resolveActionItemCategories(
				mockOrganization,
				{ last: 10, before: cursor },
				ctx,
			);

			expect(result.edges).toHaveLength(1);
			expect(result.edges[0]?.node).toEqual(mockActionItemCategory1);

			// Verify the query was called with correct parameters for backward pagination
			const findManyCalls = mocks.drizzleClient.query.actionCategoriesTable
				.findMany as ReturnType<typeof vi.fn>;
			const callArgs = findManyCalls.mock.calls[0]?.[0];
			expect(callArgs.orderBy).toEqual([desc(actionCategoriesTable.name)]);
		});

		it("should handle backward pagination without cursor", async () => {
			mocks.drizzleClient.query.actionCategoriesTable.findMany.mockResolvedValue(
				[mockActionItemCategory1, mockActionItemCategory2],
			);

			const result = await resolveActionItemCategories(
				mockOrganization,
				{ last: 10 },
				ctx,
			);

			expect(result.edges).toHaveLength(2);
			expect(result.pageInfo.hasPreviousPage).toBe(false);

			// Verify the query was called with correct parameters for backward pagination
			const findManyCalls = mocks.drizzleClient.query.actionCategoriesTable
				.findMany as ReturnType<typeof vi.fn>;
			const callArgs = findManyCalls.mock.calls[0]?.[0];
			expect(callArgs.orderBy).toEqual([desc(actionCategoriesTable.name)]);
		});

		it("should handle forward pagination with cursor", async () => {
			const cursor = Buffer.from(
				JSON.stringify({
					name: mockActionItemCategory1.name,
				}),
				"utf-8",
			).toString("base64url");

			mocks.drizzleClient.query.actionCategoriesTable.findMany.mockResolvedValue(
				[mockActionItemCategory2],
			);

			const result = await resolveActionItemCategories(
				mockOrganization,
				{ first: 10, after: cursor },
				ctx,
			);

			expect(result.edges).toHaveLength(1);
			expect(result.edges[0]?.node).toEqual(mockActionItemCategory2);

			// Verify the WHERE clause includes the cursor condition
			const findManyCalls = mocks.drizzleClient.query.actionCategoriesTable
				.findMany as ReturnType<typeof vi.fn>;
			const callArgs = findManyCalls.mock.calls[0]?.[0];
			expect(callArgs.where).toBeDefined();
		});

		it("should handle forward pagination without cursor", async () => {
			mocks.drizzleClient.query.actionCategoriesTable.findMany.mockResolvedValue(
				[mockActionItemCategory1, mockActionItemCategory2],
			);

			const result = await resolveActionItemCategories(
				mockOrganization,
				{ first: 10 },
				ctx,
			);

			expect(result.edges).toHaveLength(2);
			expect(result.pageInfo.hasNextPage).toBe(false);

			// Verify the query was called with basic WHERE clause
			const findManyCalls = mocks.drizzleClient.query.actionCategoriesTable
				.findMany as ReturnType<typeof vi.fn>;
			const callArgs = findManyCalls.mock.calls[0]?.[0];
			expect(callArgs.where).toEqual(
				eq(actionCategoriesTable.organizationId, mockOrganization.id),
			);
		});
	});

	describe("Complex WHERE Clause Coverage", () => {
		beforeEach(() => {
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
				id: "user-1",
				role: "administrator",
				organizationMembershipsWhereMember: [],
			});
		});

		it("should handle exists query verification for forward pagination", async () => {
			const cursor = Buffer.from(
				JSON.stringify({
					name: "Test Category",
				}),
				"utf-8",
			).toString("base64url");

			// Mock the exists check to return a result, then the main query
			mocks.drizzleClient.query.actionCategoriesTable.findMany.mockResolvedValue(
				[mockActionItemCategory1],
			);

			await resolveActionItemCategories(
				mockOrganization,
				{ first: 5, after: cursor },
				ctx,
			);

			// Verify that the query includes the exists condition and proper WHERE clause
			const findManyCalls = mocks.drizzleClient.query.actionCategoriesTable
				.findMany as ReturnType<typeof vi.fn>;
			expect(findManyCalls).toHaveBeenCalled();

			const callArgs = findManyCalls.mock.calls[0]?.[0];
			expect(callArgs.where).toBeDefined();
			expect(callArgs.orderBy).toEqual([asc(actionCategoriesTable.name)]);
		});

		it("should handle exists query verification for backward pagination", async () => {
			const cursor = Buffer.from(
				JSON.stringify({
					name: "Test Category",
				}),
				"utf-8",
			).toString("base64url");

			mocks.drizzleClient.query.actionCategoriesTable.findMany.mockResolvedValue(
				[mockActionItemCategory1],
			);

			await resolveActionItemCategories(
				mockOrganization,
				{ last: 5, before: cursor },
				ctx,
			);

			// Verify that the query includes the exists condition and proper WHERE clause
			const findManyCalls = mocks.drizzleClient.query.actionCategoriesTable
				.findMany as ReturnType<typeof vi.fn>;
			expect(findManyCalls).toHaveBeenCalled();

			const callArgs = findManyCalls.mock.calls[0]?.[0];
			expect(callArgs.where).toBeDefined();
			expect(callArgs.orderBy).toEqual([desc(actionCategoriesTable.name)]);
		});

		it("should handle cursor with valid name that exists in database", async () => {
			const validCursor = Buffer.from(
				JSON.stringify({
					name: mockActionItemCategory1.name, // Use existing category name
				}),
				"utf-8",
			).toString("base64url");

			// Mock successful cursor validation and results
			mocks.drizzleClient.query.actionCategoriesTable.findMany.mockResolvedValue(
				[
					mockActionItemCategory2, // Different category as result
				],
			);

			const result = await resolveActionItemCategories(
				mockOrganization,
				{ first: 10, after: validCursor },
				ctx,
			);

			expect(result.edges).toHaveLength(1);
			expect(result.edges[0]?.node).toEqual(mockActionItemCategory2);
		});

		it("should cover all branches of forward pagination with and without cursor", async () => {
			// Test without cursor first
			mocks.drizzleClient.query.actionCategoriesTable.findMany.mockResolvedValueOnce(
				[mockActionItemCategory1],
			);

			await resolveActionItemCategories(mockOrganization, { first: 10 }, ctx);

			// Test with cursor
			const cursor = Buffer.from(
				JSON.stringify({ name: "Test" }),
				"utf-8",
			).toString("base64url");

			mocks.drizzleClient.query.actionCategoriesTable.findMany.mockResolvedValueOnce(
				[mockActionItemCategory2],
			);

			await resolveActionItemCategories(
				mockOrganization,
				{ first: 10, after: cursor },
				ctx,
			);

			expect(
				mocks.drizzleClient.query.actionCategoriesTable.findMany,
			).toHaveBeenCalledTimes(2);
		});

		it("should cover all branches of backward pagination with and without cursor", async () => {
			// Test without cursor first
			mocks.drizzleClient.query.actionCategoriesTable.findMany.mockResolvedValueOnce(
				[mockActionItemCategory1],
			);

			await resolveActionItemCategories(mockOrganization, { last: 10 }, ctx);

			// Test with cursor
			const cursor = Buffer.from(
				JSON.stringify({ name: "Test" }),
				"utf-8",
			).toString("base64url");

			mocks.drizzleClient.query.actionCategoriesTable.findMany.mockResolvedValueOnce(
				[mockActionItemCategory2],
			);

			await resolveActionItemCategories(
				mockOrganization,
				{ last: 10, before: cursor },
				ctx,
			);

			expect(
				mocks.drizzleClient.query.actionCategoriesTable.findMany,
			).toHaveBeenCalledTimes(2);
		});
	});
});
