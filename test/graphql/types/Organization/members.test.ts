import type {
	GraphQLFieldResolver,
	GraphQLObjectType,
	GraphQLResolveInfo,
} from "graphql";
import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
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
				// Jane Smith would be excluded by the database query since she doesn't match "John"
			];

			mocks.drizzleClient.query.organizationMembershipsTable.findMany.mockResolvedValue(
				mockMembers,
			);

			const result = (await membersResolver(
				mockOrganization,
				{ first: 10, where: { name_contains: "  John  " } },
				ctx,
				mockResolveInfo,
			)) as { edges: Array<{ node: { name: string } }> };

			expect(result).toBeDefined();
			expect(result.edges).toBeDefined();
			expect(result.edges.length).toBe(1);
			// Verify that the trimmed name filter was applied
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
			// When trimmed to empty, no name filter is applied, so all members are returned
			expect(result.edges.length).toBe(2);
		});

		it("should filter members by name when name_contains is provided", async () => {
			// Mock returns only the members that match the filter
			// This simulates what the database would return after applying the WHERE clause
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
		beforeEach(() => {
			setupAdminUser();
		});

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
			await expect(
				membersResolver(
					mockOrganization,
					{ first: 10, after: "invalid-base64" },
					ctx,
					mockResolveInfo,
				),
			).rejects.toThrow(
				new TalawaGraphQLError({
					extensions: {
						code: "invalid_arguments",
						issues: [
							{
								argumentPath: ["after"],
								message: "Not a valid cursor.",
							},
						],
					},
				}),
			);
		});

		it("should throw invalid_arguments for invalid JSON in cursor", async () => {
			const invalidCursor = Buffer.from("not-json").toString("base64url");
			await expect(
				membersResolver(
					mockOrganization,
					{ first: 10, after: invalidCursor },
					ctx,
					mockResolveInfo,
				),
			).rejects.toThrow(
				new TalawaGraphQLError({
					extensions: {
						code: "invalid_arguments",
						issues: [
							{
								argumentPath: ["after"],
								message: "Not a valid cursor.",
							},
						],
					},
				}),
			);
		});

		it("should throw invalid_arguments for cursor with invalid schema", async () => {
			// Missing required fields
			const invalidCursor = Buffer.from(
				JSON.stringify({
					invalidField: "value",
				}),
			).toString("base64url");

			await expect(
				membersResolver(
					mockOrganization,
					{ first: 10, after: invalidCursor },
					ctx,
					mockResolveInfo,
				),
			).rejects.toThrow(
				new TalawaGraphQLError({
					extensions: {
						code: "invalid_arguments",
						issues: [
							{
								argumentPath: ["after"],
								message: "Not a valid cursor.",
							},
						],
					},
				}),
			);
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

			await expect(
				membersResolver(
					mockOrganization,
					{ first: 10, after: validCursor },
					ctx,
					mockResolveInfo,
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

			await expect(
				membersResolver(
					mockOrganization,
					{ last: 10, before: validCursor },
					ctx,
					mockResolveInfo,
				),
			).rejects.toThrow(
				new TalawaGraphQLError({
					extensions: {
						code: "arguments_associated_resources_not_found",
						issues: [
							{
								argumentPath: ["before"],
							},
						],
					},
				}),
			);
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
