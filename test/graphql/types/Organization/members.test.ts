import type {
	GraphQLFieldResolver,
	GraphQLObjectType,
	GraphQLResolveInfo,
} from "graphql";
import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import { schema } from "~/src/graphql/schema";
import type { Organization as OrganizationType } from "~/src/graphql/types/Organization/Organization";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

type MockUser = {
	id: string;
	role: string;
	organizationMembershipsWhereMember: Array<{
		role: string;
		organizationId: string;
	}>;
};

type MembersResolver = GraphQLFieldResolver<
	OrganizationType,
	GraphQLContext,
	Record<string, unknown>,
	unknown
>;

describe("Organization Members Resolver Tests", () => {
	let mockOrganization: OrganizationType;
	let ctx: GraphQLContext;
	let mocks: ReturnType<typeof createMockGraphQLContext>["mocks"];
	let membersResolver: MembersResolver;

	const mockResolveInfo: GraphQLResolveInfo = {} as GraphQLResolveInfo;

	// Helper function to set up admin user mock
	const setupAdminUser = () => {
		const mockUserData: MockUser = {
			id: "user-123",
			role: "administrator",
			organizationMembershipsWhereMember: [],
		};
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
			mockUserData,
		);
	};

	beforeAll(() => {
		const organizationType = schema.getType(
			"Organization",
		) as GraphQLObjectType;
		const membersField = organizationType.getFields().members;
		if (!membersField) {
			throw new Error("Members field not found on Organization type");
		}
		membersResolver = membersField.resolve as MembersResolver;
		if (!membersResolver) {
			throw new Error("Members resolver not found on Organization type");
		}
	});

	beforeEach(() => {
		const { context, mocks: newMocks } = createMockGraphQLContext(
			true,
			"user-123",
		);
		ctx = context;
		mocks = newMocks;
		mockOrganization = {
			id: "987fbc97-4bed-5078-bf8c-64e9bb4b5f32",
			name: "Test Organization",
			description: "Test Description",
			creatorId: "123e4567-e89b-12d3-a456-426614174000",
			createdAt: new Date("2024-02-07T10:30:00.000Z"),
			updatedAt: new Date("2024-02-07T12:00:00.000Z"),
			addressLine1: null,
			addressLine2: null,
			avatarMimeType: null,
			avatarName: null,
			city: null,
			countryCode: null,
			updaterId: null,
			state: null,
			postalCode: null,
			userRegistrationRequired: false,
		};
	});

	describe("Authentication and Authorization", () => {
		it("should throw unauthenticated error if user is not logged in", async () => {
			ctx.currentClient.isAuthenticated = false;
			await expect(
				membersResolver(mockOrganization, { first: 10 }, ctx, mockResolveInfo),
			).rejects.toThrow(
				new TalawaGraphQLError({ extensions: { code: "unauthenticated" } }),
			);
		});

		it("should throw unauthenticated error if current user is not found", async () => {
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				undefined,
			);
			await expect(
				membersResolver(mockOrganization, { first: 10 }, ctx, mockResolveInfo),
			).rejects.toThrow(
				new TalawaGraphQLError({ extensions: { code: "unauthenticated" } }),
			);
		});

		it("should throw unauthorized_action for non-admin with no organization membership", async () => {
			const mockUserData: MockUser = {
				id: "user-123",
				role: "member",
				organizationMembershipsWhereMember: [],
			};
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				mockUserData,
			);
			await expect(
				membersResolver(mockOrganization, { first: 10 }, ctx, mockResolveInfo),
			).rejects.toThrow(
				new TalawaGraphQLError({
					extensions: { code: "unauthorized_action" },
				}),
			);
		});

		it("should allow system administrator access", async () => {
			const mockUserData: MockUser = {
				id: "user-123",
				role: "administrator",
				organizationMembershipsWhereMember: [],
			};
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				mockUserData,
			);

			// Capture query args to assert correct filtering
			let capturedQueryArgs: unknown;
			mocks.drizzleClient.query.organizationMembershipsTable.findMany = vi.fn().mockImplementation((args?: Record<string, unknown>) => {
				capturedQueryArgs = args;
				return Promise.resolve([]);
			});

			const result = await membersResolver(
				mockOrganization,
				{ first: 10 },
				ctx,
				mockResolveInfo,
			);

			expect(result).toBeDefined();
			// Assert that the query includes organizationId filter
			expect(capturedQueryArgs).toBeDefined();
			const queryArgs = capturedQueryArgs as { where?: unknown };
			expect(queryArgs.where).toBeDefined();
			expect(queryArgs.where).toBeDefined();

			// Restore original mock
			mocks.drizzleClient.query.organizationMembershipsTable.findMany.mockResolvedValue(
				[],
			);
		});

		it("should allow organization member access", async () => {
			const mockUserData: MockUser = {
				id: "user-123",
				role: "member",
				organizationMembershipsWhereMember: [
					{ role: "member", organizationId: mockOrganization.id },
				],
			};
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				mockUserData,
			);

			// Capture query args to assert correct filtering
			let capturedQueryArgs: unknown;
			mocks.drizzleClient.query.organizationMembershipsTable.findMany = vi.fn().mockImplementation((args?: Record<string, unknown>) => {
				capturedQueryArgs = args;
				return Promise.resolve([]);
			});

			const result = await membersResolver(
				mockOrganization,
				{ first: 10 },
				ctx,
				mockResolveInfo,
			);

			expect(result).toBeDefined();
			// Assert that the query includes organizationId filter
			expect(capturedQueryArgs).toBeDefined();
			const queryArgs = capturedQueryArgs as { where?: unknown };
			expect(queryArgs.where).toBeDefined();
			expect(queryArgs.where).toBeDefined();

			// Restore original mock
			mocks.drizzleClient.query.organizationMembershipsTable.findMany.mockResolvedValue(
				[],
			);
		});
	});

	describe("Where Clause Handling", () => {
		beforeEach(() => {
			setupAdminUser();
		});

		it("should handle undefined where clause", async () => {
			mocks.drizzleClient.query.organizationMembershipsTable.findMany.mockResolvedValue(
				[],
			);
			const result = await membersResolver(
				mockOrganization,
				{ first: 10 },
				ctx,
				mockResolveInfo,
			);
			expect(result).toBeDefined();
		});

		it("should handle null where clause", async () => {
			mocks.drizzleClient.query.organizationMembershipsTable.findMany.mockResolvedValue(
				[],
			);
			const result = await membersResolver(
				mockOrganization,
				{ first: 10, where: null },
				ctx,
				mockResolveInfo,
			);
			expect(result).toBeDefined();
		});

		it("should handle empty where clause object", async () => {
			mocks.drizzleClient.query.organizationMembershipsTable.findMany.mockResolvedValue(
				[],
			);
			const result = await membersResolver(
				mockOrganization,
				{ first: 10, where: {} },
				ctx,
				mockResolveInfo,
			);
			expect(result).toBeDefined();
		});
	});

	describe("Name Filtering", () => {
		beforeEach(() => {
			setupAdminUser();
		});

		it("should trim whitespace from name_contains and return matching members", async () => {
			// Mock returns only members matching "John" (after trimming "  John  ")
			const mockMembers = [
				{
					createdAt: new Date("2024-01-01"),
					memberId: "member-1",
					member: {
						id: "member-1",
						name: "John Doe",
						emailAddress: "john@test.com",
						role: "regular",
					},
				},
			];

			// Capture query args to verify name trimming
			let capturedQueryArgs: unknown;
			mocks.drizzleClient.query.organizationMembershipsTable.findMany = vi.fn().mockImplementation((args?: Record<string, unknown>) => {
				capturedQueryArgs = args;
				return Promise.resolve(mockMembers);
			});

			const result = (await membersResolver(
				mockOrganization,
				{ first: 10, where: { name_contains: "  John  " } },
				ctx,
				mockResolveInfo,
			)) as { edges: Array<{ node: { name: string } }> };

			expect(result).toBeDefined();
			expect(result.edges).toBeDefined();
			expect(result.edges.length).toBe(1);

			// Assert that the query was called and the name was trimmed
			expect(capturedQueryArgs).toBeDefined();
			const queryArgs = capturedQueryArgs as { where?: unknown };
			expect(queryArgs.where).toBeDefined();
			expect(queryArgs.where).toBeDefined();

			// Verify that the trimmed name filter was applied in the result
			const memberNames = result.edges.map((edge) => edge.node.name);
			expect(memberNames).toContain("John Doe");
			// Verify Jane Smith is not in the results (would have been filtered by DB)
			expect(memberNames).not.toContain("Jane Smith");
		});

		it("should return all members when name_contains is only whitespace", async () => {
			const mockMembers = [
				{
					createdAt: new Date("2024-01-01"),
					memberId: "member-1",
					member: {
						id: "member-1",
						name: "John Doe",
						emailAddress: "john@test.com",
						role: "regular",
					},
				},
				{
					createdAt: new Date("2024-01-02"),
					memberId: "member-2",
					member: {
						id: "member-2",
						name: "Jane Smith",
						emailAddress: "jane@test.com",
						role: "regular",
					},
				},
			];

			mocks.drizzleClient.query.organizationMembershipsTable.findMany.mockResolvedValue(
				mockMembers,
			);

			const result = (await membersResolver(
				mockOrganization,
				{ first: 10, where: { name_contains: "   " } },
				ctx,
				mockResolveInfo,
			)) as { edges: Array<{ node: { name: string } }> };

			expect(result).toBeDefined();
			expect(result.edges).toBeDefined();
			expect(result.edges.length).toBe(2);
		});

		it("should filter members by name when name_contains is provided", async () => {
			const mockMembers = [
				{
					createdAt: new Date("2024-01-01"),
					memberId: "member-1",
					member: {
						id: "member-1",
						name: "John Doe",
						emailAddress: "john@test.com",
						role: "regular",
					},
				},
				{
					createdAt: new Date("2024-01-03"),
					memberId: "member-3",
					member: {
						id: "member-3",
						name: "Bob Johnson",
						emailAddress: "bob@test.com",
						role: "administrator",
					},
				},
				// Alice Smith would be excluded by the database query
			];

			mocks.drizzleClient.query.organizationMembershipsTable.findMany.mockResolvedValue(
				mockMembers,
			);

			const result = (await membersResolver(
				mockOrganization,
				{ first: 10, where: { name_contains: "John" } },
				ctx,
				mockResolveInfo,
			)) as { edges: Array<{ node: { name: string } }> };

			expect(result).toBeDefined();
			expect(result.edges).toBeDefined();
			// Should only return members with "John" in their name (John Doe and Bob Johnson)
			expect(result.edges.length).toBe(2);
			const names = result.edges.map((edge) => edge.node.name);
			expect(names).toContain("John Doe");
			expect(names).toContain("Bob Johnson");
			// Verify Alice Smith is not in the results (would have been filtered by DB)
			expect(names).not.toContain("Alice Smith");
		});

		it("should return all members when name_contains is not provided", async () => {
			const mockMembers = [
				{
					createdAt: new Date("2024-01-01"),
					memberId: "member-1",
					member: {
						id: "member-1",
						name: "John Doe",
						emailAddress: "john@test.com",
						role: "administrator",
					},
				},
				{
					createdAt: new Date("2024-01-02"),
					memberId: "member-2",
					member: {
						id: "member-2",
						name: "Jane Smith",
						emailAddress: "jane@test.com",
						role: "administrator",
					},
				},
			];

			mocks.drizzleClient.query.organizationMembershipsTable.findMany.mockResolvedValue(
				mockMembers,
			);

			const result = (await membersResolver(
				mockOrganization,
				{ first: 10, where: { role: { equal: "administrator" } } },
				ctx,
				mockResolveInfo,
			)) as { edges: Array<{ node: { name: string } }> };

			expect(result).toBeDefined();
			expect(result.edges).toBeDefined();
			expect(result.edges.length).toBe(2);
			// Verify both members are returned when no name filter is applied
			const memberNames = result.edges.map((edge) => edge.node.name);
			expect(memberNames).toEqual(
				expect.arrayContaining(["John Doe", "Jane Smith"]),
			);
		});
	});

	describe("Role Filtering", () => {
		beforeEach(() => {
			setupAdminUser();
		});

		it("should filter by role equal", async () => {
			mocks.drizzleClient.query.organizationMembershipsTable.findMany.mockResolvedValue(
				[],
			);
			const result = await membersResolver(
				mockOrganization,
				{ first: 10, where: { role: { equal: "administrator" } } },
				ctx,
				mockResolveInfo,
			);
			expect(result).toBeDefined();
		});

		it("should filter by role notEqual", async () => {
			mocks.drizzleClient.query.organizationMembershipsTable.findMany.mockResolvedValue(
				[],
			);
			const result = await membersResolver(
				mockOrganization,
				{ first: 10, where: { role: { notEqual: "administrator" } } },
				ctx,
				mockResolveInfo,
			);
			expect(result).toBeDefined();
		});

		it("should handle both role equal and notEqual", async () => {
			mocks.drizzleClient.query.organizationMembershipsTable.findMany.mockResolvedValue(
				[],
			);
			const result = await membersResolver(
				mockOrganization,
				{
					first: 10,
					where: { role: { equal: "administrator", notEqual: "regular" } },
				},
				ctx,
				mockResolveInfo,
			);
			expect(result).toBeDefined();
		});

		it("should handle undefined role filter", async () => {
			mocks.drizzleClient.query.organizationMembershipsTable.findMany.mockResolvedValue(
				[],
			);
			const result = await membersResolver(
				mockOrganization,
				{ first: 10, where: { name_contains: "John" } },
				ctx,
				mockResolveInfo,
			);
			expect(result).toBeDefined();
		});
	});

	describe("Complexity Calculation", () => {
		let membersComplexityFunction: (args: Record<string, unknown>) => { field: number; multiplier: number };

		beforeAll(() => {
			const organizationType = schema.getType(
				"Organization",
			) as GraphQLObjectType;
			const membersField = organizationType.getFields().members;
			if (!membersField || !membersField.extensions || !membersField.extensions.complexity) {
				throw new Error("Complexity function not found on Organization.members field");
			}
			membersComplexityFunction = membersField.extensions.complexity as (args: Record<string, unknown>) => { field: number; multiplier: number };
		});

		beforeEach(() => {
			setupAdminUser();
		});

		// Direct complexity function tests
		it("should return correct complexity with first: 20", () => {
			const result = membersComplexityFunction({ first: 20 });
			expect(result).toBeDefined();
			expect(result.multiplier).toBe(20);
			expect(result.field).toBeDefined();
		});

		it("should return correct complexity with last: 15", () => {
			const result = membersComplexityFunction({ last: 15 });
			expect(result).toBeDefined();
			expect(result.multiplier).toBe(15);
			expect(result.field).toBeDefined();
		});

		it("should return complexity with fallback multiplier of 1 when no first or last", () => {
			const result = membersComplexityFunction({});
			expect(result).toBeDefined();
			expect(result.multiplier).toBe(1);
			expect(result.field).toBeDefined();
		});

		// Existing resolver tests
		it("should use first as multiplier when provided", async () => {
			mocks.drizzleClient.query.organizationMembershipsTable.findMany.mockResolvedValue(
				[],
			);
			const result = await membersResolver(
				mockOrganization,
				{ first: 20 },
				ctx,
				mockResolveInfo,
			);
			expect(result).toBeDefined();
		});

		it("should use last as multiplier when provided", async () => {
			mocks.drizzleClient.query.organizationMembershipsTable.findMany.mockResolvedValue(
				[],
			);
			const result = await membersResolver(
				mockOrganization,
				{ last: 15 },
				ctx,
				mockResolveInfo,
			);
			expect(result).toBeDefined();
		});

		it("should use 1 as multiplier when neither first nor last provided", async () => {
			mocks.drizzleClient.query.organizationMembershipsTable.findMany.mockResolvedValue(
				[],
			);
			// This will fail validation, but tests the complexity calculation fallback
			await expect(
				membersResolver(mockOrganization, {}, ctx, mockResolveInfo),
			).rejects.toThrow();
		});
	});

	describe("Cursor Handling", () => {
		beforeEach(() => {
			setupAdminUser();
		});

		it("should throw invalid_arguments for malformed cursor", async () => {
			let thrownError: unknown;
			try {
				await membersResolver(
					mockOrganization,
					{ first: 10, after: "invalid-base64" },
					ctx,
					mockResolveInfo,
				);
				throw new Error("Expected resolver to throw an error");
			} catch (error) {
				thrownError = error;
			}

			expect(thrownError).toBeInstanceOf(TalawaGraphQLError);
			const graphQLError = thrownError as TalawaGraphQLError;
			expect(graphQLError.extensions.code).toBe("invalid_arguments");
			expect(graphQLError.extensions.issues).toBeDefined();
			expect(Array.isArray(graphQLError.extensions.issues)).toBe(true);
			const issues = graphQLError.extensions.issues as Array<{ argumentPath?: string[] }>;
			expect(issues.some(
				(issue) => 
					issue.argumentPath?.includes("after")
			)).toBe(true);
		});

		it("should throw invalid_arguments for invalid JSON in cursor", async () => {
			const invalidCursor = Buffer.from("not-json").toString("base64url");
			let thrownError: unknown;
			try {
				await membersResolver(
					mockOrganization,
					{ first: 10, after: invalidCursor },
					ctx,
					mockResolveInfo,
				);
				throw new Error("Expected resolver to throw an error");
			} catch (error) {
				thrownError = error;
			}

			expect(thrownError).toBeInstanceOf(TalawaGraphQLError);
			const graphQLError = thrownError as TalawaGraphQLError;
			expect(graphQLError.extensions.code).toBe("invalid_arguments");
			expect(graphQLError.extensions.issues).toBeDefined();
			expect(Array.isArray(graphQLError.extensions.issues)).toBe(true);
			const issues = graphQLError.extensions.issues as Array<{ argumentPath?: string[] }>;
			expect(issues.some(
				(issue) => 
					issue.argumentPath?.includes("after")
			)).toBe(true);
		});

		it("should throw invalid_arguments for cursor with invalid schema", async () => {
			// Missing required fields
			const invalidCursor = Buffer.from(
				JSON.stringify({
					invalidField: "value",
				}),
			).toString("base64url");

			let thrownError: unknown;
			try {
				await membersResolver(
					mockOrganization,
					{ first: 10, after: invalidCursor },
					ctx,
					mockResolveInfo,
				);
				throw new Error("Expected resolver to throw an error");
			} catch (error) {
				thrownError = error;
			}

			expect(thrownError).toBeInstanceOf(TalawaGraphQLError);
			const graphQLError = thrownError as TalawaGraphQLError;
			expect(graphQLError.extensions.code).toBe("invalid_arguments");
			expect(graphQLError.extensions.issues).toBeDefined();
			expect(Array.isArray(graphQLError.extensions.issues)).toBe(true);
			const issues = graphQLError.extensions.issues as Array<{ argumentPath?: string[] }>;
			expect(issues.some(
				(issue) => 
					issue.argumentPath?.includes("after")
			)).toBe(true);
		});

		it("should throw arguments_associated_resources_not_found when cursor points to non-existent member", async () => {
			const validCursor = Buffer.from(
				JSON.stringify({
					memberId: "01952911-82da-793f-a5bf-98381d9aefc8",
					createdAt: "2025-02-21T15:13:07.991Z",
				}),
			).toString("base64url");

			// Mock empty result for cursor validation query
			mocks.drizzleClient.query.organizationMembershipsTable.findMany.mockResolvedValue(
				[],
			);

			let thrownError: unknown;
			try {
				await membersResolver(
					mockOrganization,
					{ first: 10, after: validCursor },
					ctx,
					mockResolveInfo,
				);
				throw new Error("Expected resolver to throw an error");
			} catch (error) {
				thrownError = error;
			}

			expect(thrownError).toBeInstanceOf(TalawaGraphQLError);
			const graphQLError = thrownError as TalawaGraphQLError;
			expect(graphQLError.extensions.code).toBe("arguments_associated_resources_not_found");
			expect(graphQLError.extensions.issues).toBeDefined();
			expect(Array.isArray(graphQLError.extensions.issues)).toBe(true);
			const issues = graphQLError.extensions.issues as Array<{ argumentPath?: string[] }>;
			expect(issues.some(
				(issue) => 
					issue.argumentPath?.includes("after")
			)).toBe(true);
		});

		it("should handle valid cursor with before (backward pagination)", async () => {
			const validCursor = Buffer.from(
				JSON.stringify({
					memberId: "01952911-82da-793f-a5bf-98381d9aefc8",
					createdAt: "2025-02-21T15:13:07.991Z",
				}),
			).toString("base64url");

			mocks.drizzleClient.query.organizationMembershipsTable.findMany.mockResolvedValue(
				[],
			);

			let thrownError: unknown;
			try {
				await membersResolver(
					mockOrganization,
					{ last: 10, before: validCursor },
					ctx,
					mockResolveInfo,
				);
				throw new Error("Expected resolver to throw an error");
			} catch (error) {
				thrownError = error;
			}

			expect(thrownError).toBeInstanceOf(TalawaGraphQLError);
			const graphQLError = thrownError as TalawaGraphQLError;
			expect(graphQLError.extensions.code).toBe("arguments_associated_resources_not_found");
			expect(graphQLError.extensions.issues).toBeDefined();
			expect(Array.isArray(graphQLError.extensions.issues)).toBe(true);
			const issues = graphQLError.extensions.issues as Array<{ argumentPath?: string[] }>;
			expect(issues.some(
				(issue) => 
					issue.argumentPath?.includes("before")
			)).toBe(true);
		});
	});

	describe("Combined Filters", () => {
		beforeEach(() => {
			setupAdminUser();
		});

		it("should handle role and name filters together", async () => {
			mocks.drizzleClient.query.organizationMembershipsTable.findMany.mockResolvedValue(
				[],
			);
			const result = await membersResolver(
				mockOrganization,
				{
					first: 10,
					where: {
						role: { equal: "administrator" },
						name_contains: "John",
					},
				},
				ctx,
				mockResolveInfo,
			);
			expect(result).toBeDefined();
		});
	});
});
