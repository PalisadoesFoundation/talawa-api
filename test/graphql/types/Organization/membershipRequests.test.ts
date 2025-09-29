import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { describe, expect, it } from "vitest";
import { membershipRequestsResolver } from "~/src/graphql/types/Organization/membershipRequests";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

// Parent organization mock
const mockParent = {
	id: "org123",
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

// Mock membership requests data
const mockMembershipRequests = [
	{
		id: "req1",
		userId: "user1",
		organizationId: "org123",
		createdAt: new Date("2024-02-07T10:30:00.000Z"),
		user: {
			id: "user1",
			name: "John Doe",
			email: "john@example.com",
		},
	},
	{
		id: "req2",
		userId: "user2",
		organizationId: "org123",
		createdAt: new Date("2024-02-06T10:30:00.000Z"),
		user: {
			id: "user2",
			name: "Jane Smith",
			email: "jane@example.com",
		},
	},
];

describe("Organization membershipRequests Resolver", () => {
	describe("Authentication", () => {
		it("should throw unauthenticated error when client is not authenticated", async () => {
			const { context: mockContext } = createMockGraphQLContext();
			mockContext.currentClient.isAuthenticated = false;

			await expect(
				membershipRequestsResolver(mockParent, {}, mockContext),
			).rejects.toThrowError(TalawaGraphQLError);

			await expect(
				membershipRequestsResolver(mockParent, {}, mockContext),
			).rejects.toMatchObject({
				extensions: { code: "unauthenticated" },
			});
		});

		it("should throw unauthenticated error if current user is not found", async () => {
			const { context: mockContext, mocks } = createMockGraphQLContext(
				true,
				"user-123",
			);

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
				undefined,
			);
			mocks.drizzleClient.query.organizationMembershipsTable.findFirst.mockResolvedValueOnce(
				undefined,
			);

			await expect(
				membershipRequestsResolver(mockParent, {}, mockContext),
			).rejects.toThrow(
				new TalawaGraphQLError({ extensions: { code: "unauthenticated" } }),
			);
		});
	});

	describe("Argument Validation", () => {
		it("should throw invalid_arguments error for negative skip value", async () => {
			const mockUserData = { id: "user-123", role: "administrator" };
			const { context: mockContext, mocks } = createMockGraphQLContext(
				true,
				"user-123",
			);

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
				mockUserData,
			);

			const args = { skip: -1 };

			await expect(
				membershipRequestsResolver(mockParent, args, mockContext),
			).rejects.toMatchObject({
				extensions: {
					code: "invalid_arguments",
					issues: expect.arrayContaining([
						expect.objectContaining({
							argumentPath: expect.arrayContaining(["skip"]),
						}),
					]),
				},
			});
		});

		it("should throw invalid_arguments error for first value exceeding maximum", async () => {
			const mockUserData = { id: "user-123", role: "administrator" };
			const { context: mockContext, mocks } = createMockGraphQLContext(
				true,
				"user-123",
			);

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
				mockUserData,
			);

			const args = { first: 100 }; // exceeds maximum of 50

			await expect(
				membershipRequestsResolver(mockParent, args, mockContext),
			).rejects.toMatchObject({
				extensions: {
					code: "invalid_arguments",
					issues: expect.arrayContaining([
						expect.objectContaining({
							argumentPath: expect.arrayContaining(["first"]),
						}),
					]),
				},
			});
		});

		it("should apply default values for skip and first when not provided", async () => {
			const mockUserData = { id: "user-123", role: "administrator" };
			const { context: mockContext, mocks } = createMockGraphQLContext(
				true,
				"user-123",
			);

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
				mockUserData,
			);
			mocks.drizzleClient.query.organizationMembershipsTable.findFirst.mockResolvedValueOnce(
				undefined,
			);
			mocks.drizzleClient.query.membershipRequestsTable.findMany.mockResolvedValueOnce(
				mockMembershipRequests,
			);

			const args = {}; // no skip or first provided

			const result = await membershipRequestsResolver(
				mockParent,
				args,
				mockContext,
			);

			expect(
				mocks.drizzleClient.query.membershipRequestsTable.findMany,
			).toHaveBeenCalledWith(
				expect.objectContaining({
					limit: 10,
					offset: 0,
				}),
			);
			expect(result).toEqual(mockMembershipRequests);
		});
	});

	describe("Authorization - System Administrator", () => {
		it("should allow system administrator to query all membership requests", async () => {
			const mockUserData = { id: "user-123", role: "administrator" };
			const { context: mockContext, mocks } = createMockGraphQLContext(
				true,
				"user-123",
			);

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
				mockUserData,
			);
			mocks.drizzleClient.query.organizationMembershipsTable.findFirst.mockResolvedValueOnce(
				undefined,
			);
			mocks.drizzleClient.query.membershipRequestsTable.findMany.mockResolvedValueOnce(
				mockMembershipRequests,
			);

			const args = {};

			const result = await membershipRequestsResolver(
				mockParent,
				args,
				mockContext,
			);

			expect(result).toEqual(mockMembershipRequests);
			expect(
				mocks.drizzleClient.query.membershipRequestsTable.findMany,
			).toHaveBeenCalled();
		});

		it("should allow system administrator to use name_contains filter", async () => {
			const mockUserData = { id: "user-123", role: "administrator" };
			const matchingUsers = [{ id: "user1" }, { id: "user2" }];

			const { context: mockContext, mocks } = createMockGraphQLContext(
				true,
				"user-123",
			);

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
				mockUserData,
			);
			mocks.drizzleClient.query.organizationMembershipsTable.findFirst.mockResolvedValueOnce(
				undefined,
			);
			mocks.drizzleClient.query.usersTable.findMany.mockResolvedValueOnce(
				matchingUsers,
			);
			mocks.drizzleClient.query.membershipRequestsTable.findMany.mockResolvedValueOnce(
				[mockMembershipRequests[0] ?? {}],
			);

			const args = { where: { user: { name_contains: "John" } } };

			const result = await membershipRequestsResolver(
				mockParent,
				args,
				mockContext,
			);

			expect(mocks.drizzleClient.query.usersTable.findMany).toHaveBeenCalled();
			expect(result).toHaveLength(1);
		});
	});

	describe("Authorization - Organization Administrator", () => {
		it("should allow organization administrator to query all membership requests", async () => {
			const mockUserData = { id: "user-123", role: "member" };
			const mockOrgMembership = { role: "administrator" };

			const { context: mockContext, mocks } = createMockGraphQLContext(
				true,
				"user-123",
			);

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
				mockUserData,
			);
			mocks.drizzleClient.query.organizationMembershipsTable.findFirst.mockResolvedValueOnce(
				mockOrgMembership,
			);
			mocks.drizzleClient.query.membershipRequestsTable.findMany.mockResolvedValueOnce(
				mockMembershipRequests,
			);

			const args = {};

			const result = await membershipRequestsResolver(
				mockParent,
				args,
				mockContext,
			);

			expect(result).toEqual(mockMembershipRequests);
		});

		it("should allow organization administrator to use name_contains filter", async () => {
			const mockUserData = { id: "user-123", role: "member" };
			const mockOrgMembership = { role: "administrator" };
			const matchingUsers = [{ id: "user1" }];

			const { context: mockContext, mocks } = createMockGraphQLContext(
				true,
				"user-123",
			);

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
				mockUserData,
			);
			mocks.drizzleClient.query.organizationMembershipsTable.findFirst.mockResolvedValueOnce(
				mockOrgMembership,
			);
			mocks.drizzleClient.query.usersTable.findMany.mockResolvedValueOnce(
				matchingUsers,
			);
			mocks.drizzleClient.query.membershipRequestsTable.findMany.mockResolvedValueOnce(
				[mockMembershipRequests[0] ?? {}],
			);

			const args = { where: { user: { name_contains: "Jane" } } };

			const result = await membershipRequestsResolver(
				mockParent,
				args,
				mockContext,
			);

			expect(result).toHaveLength(1);
		});
	});

	describe("Authorization - Non-Admin Users", () => {
		it("should throw unauthorized error when non-admin queries without userId filter", async () => {
			const mockUserData = { id: "user-123", role: "member" };

			const { context: mockContext, mocks } = createMockGraphQLContext(
				true,
				"user-123",
			);

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
				mockUserData,
			);
			mocks.drizzleClient.query.organizationMembershipsTable.findFirst.mockResolvedValueOnce(
				undefined,
			);

			const args = {}; // no userId filter

			await expect(
				membershipRequestsResolver(mockParent, args, mockContext),
			).rejects.toMatchObject({
				extensions: {
					code: "unauthorized_action_on_arguments_associated_resources",
					issues: expect.arrayContaining([
						expect.objectContaining({
							argumentPath: ["where", "user", "userId"],
						}),
					]),
				},
			});
		});

		it("should throw unauthorized error when non-admin queries with different userId", async () => {
			const mockUserData = { id: "user-123", role: "member" };

			const { context: mockContext, mocks } = createMockGraphQLContext(
				true,
				"user-123",
			);

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
				mockUserData,
			);
			mocks.drizzleClient.query.organizationMembershipsTable.findFirst.mockResolvedValueOnce(
				undefined,
			);

			const args = { where: { user: { userId: "different-user-456" } } };

			await expect(
				membershipRequestsResolver(mockParent, args, mockContext),
			).rejects.toMatchObject({
				extensions: {
					code: "unauthorized_action_on_arguments_associated_resources",
					issues: expect.arrayContaining([
						expect.objectContaining({
							argumentPath: ["where", "user", "userId"],
						}),
					]),
				},
			});
		});

		it("should throw unauthorized error when non-admin uses name_contains filter", async () => {
			const mockUserData = { id: "user-123", role: "member" };

			const { context: mockContext, mocks } = createMockGraphQLContext(
				true,
				"user-123",
			);

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
				mockUserData,
			);
			mocks.drizzleClient.query.organizationMembershipsTable.findFirst.mockResolvedValueOnce(
				undefined,
			);

			const args = {
				where: { user: { name_contains: "John", userId: "user-123" } },
			};

			await expect(
				membershipRequestsResolver(mockParent, args, mockContext),
			).rejects.toMatchObject({
				extensions: {
					code: "unauthorized_action_on_arguments_associated_resources",
					issues: expect.arrayContaining([
						expect.objectContaining({
							argumentPath: ["where", "user", "name_contains"],
						}),
					]),
				},
			});
		});

		it("should allow non-admin to query their own membership requests", async () => {
			const mockUserData = { id: "user-123", role: "member" };

			const { context: mockContext, mocks } = createMockGraphQLContext(
				true,
				"user-123",
			);

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
				mockUserData,
			);
			mocks.drizzleClient.query.organizationMembershipsTable.findFirst.mockResolvedValueOnce(
				undefined,
			);
			mocks.drizzleClient.query.membershipRequestsTable.findMany.mockResolvedValueOnce(
				[mockMembershipRequests[0] ?? {}],
			);

			const args = { where: { user: { userId: "user-123" } } };

			const result = await membershipRequestsResolver(
				mockParent,
				args,
				mockContext,
			);

			expect(result).toHaveLength(1);
			expect(
				mocks.drizzleClient.query.membershipRequestsTable.findMany,
			).toHaveBeenCalled();
		});
	});

	describe("Filtering and Pagination", () => {
		it("should return empty array when name_contains has no matches", async () => {
			const mockUserData = { id: "user-123", role: "administrator" };

			const { context: mockContext, mocks } = createMockGraphQLContext(
				true,
				"user-123",
			);

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
				mockUserData,
			);
			mocks.drizzleClient.query.organizationMembershipsTable.findFirst.mockResolvedValueOnce(
				undefined,
			);
			mocks.drizzleClient.query.usersTable.findMany.mockResolvedValueOnce([]);

			const args = { where: { user: { name_contains: "NoMatch" } } };

			const result = await membershipRequestsResolver(
				mockParent,
				args,
				mockContext,
			);

			expect(result).toEqual([]);
		});

		it("should apply pagination with skip and first parameters", async () => {
			const mockUserData = { id: "user-123", role: "administrator" };

			const { context: mockContext, mocks } = createMockGraphQLContext(
				true,
				"user-123",
			);

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
				mockUserData,
			);
			mocks.drizzleClient.query.organizationMembershipsTable.findFirst.mockResolvedValueOnce(
				undefined,
			);
			mocks.drizzleClient.query.membershipRequestsTable.findMany.mockResolvedValueOnce(
				[mockMembershipRequests[1] ?? {}],
			);

			const args = { skip: 1, first: 1 };

			const result = await membershipRequestsResolver(
				mockParent,
				args,
				mockContext,
			);

			expect(
				mocks.drizzleClient.query.membershipRequestsTable.findMany,
			).toHaveBeenCalledWith(
				expect.objectContaining({
					limit: 1,
					offset: 1,
				}),
			);
			expect(result).toEqual([mockMembershipRequests[1]]);
		});

		it("should apply userId filter correctly", async () => {
			const mockUserData = { id: "user-123", role: "administrator" };

			const { context: mockContext, mocks } = createMockGraphQLContext(
				true,
				"user-123",
			);

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
				mockUserData,
			);
			mocks.drizzleClient.query.organizationMembershipsTable.findFirst.mockResolvedValueOnce(
				undefined,
			);
			mocks.drizzleClient.query.membershipRequestsTable.findMany.mockResolvedValueOnce(
				[mockMembershipRequests[0] ?? {}],
			);

			const args = { where: { user: { userId: "user1" } } };

			const result = await membershipRequestsResolver(
				mockParent,
				args,
				mockContext,
			);

			expect(result).toHaveLength(1);
			expect(result[0]?.userId).toBe("user1");
		});

		it("should order results by createdAt in descending order", async () => {
			const mockUserData = { id: "user-123", role: "administrator" };

			const { context: mockContext, mocks } = createMockGraphQLContext(
				true,
				"user-123",
			);

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
				mockUserData,
			);
			mocks.drizzleClient.query.organizationMembershipsTable.findFirst.mockResolvedValueOnce(
				undefined,
			);
			mocks.drizzleClient.query.membershipRequestsTable.findMany.mockResolvedValueOnce(
				mockMembershipRequests,
			);

			const args = {};

			const result = await membershipRequestsResolver(
				mockParent,
				args,
				mockContext,
			);

			expect(
				mocks.drizzleClient.query.membershipRequestsTable.findMany,
			).toHaveBeenCalledWith(
				expect.objectContaining({
					orderBy: expect.any(Function),
				}),
			);
			expect(result).toEqual(mockMembershipRequests);
		});

		it("should include user data with membership requests", async () => {
			const mockUserData = { id: "user-123", role: "administrator" };

			const { context: mockContext, mocks } = createMockGraphQLContext(
				true,
				"user-123",
			);

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
				mockUserData,
			);
			mocks.drizzleClient.query.organizationMembershipsTable.findFirst.mockResolvedValueOnce(
				undefined,
			);
			mocks.drizzleClient.query.membershipRequestsTable.findMany.mockResolvedValueOnce(
				mockMembershipRequests,
			);

			const args = {};

			const result = await membershipRequestsResolver(
				mockParent,
				args,
				mockContext,
			);

			expect(
				mocks.drizzleClient.query.membershipRequestsTable.findMany,
			).toHaveBeenCalledWith(
				expect.objectContaining({
					with: { user: true },
				}),
			);
			expect(result).toEqual(mockMembershipRequests);
		});
	});
});
