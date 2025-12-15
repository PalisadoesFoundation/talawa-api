import { and, eq } from "drizzle-orm";
import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { afterEach, describe, expect, it, vi } from "vitest";
import { organizationMembershipsTable } from "~/src/drizzle/tables/organizationMemberships";
import { isMemberResolver } from "~/src/graphql/types/Organization/isMember";
import {
	adminsCountResolver,
	membersCountResolver,
} from "~/src/graphql/types/Organization/membersInfo";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

afterEach(() => {
	vi.clearAllMocks();
});

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

describe("Organization members info Resolvers", () => {
	describe("membersCountResolver", () => {
		it("should throw unauthenticated error when client is not authenticated", async () => {
			const { context: mockContext } = createMockGraphQLContext();
			mockContext.currentClient.isAuthenticated = false;

			await expect(
				membersCountResolver(mockParent, {}, mockContext),
			).rejects.toThrowError(TalawaGraphQLError);

			await expect(
				membersCountResolver(mockParent, {}, mockContext),
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

			await expect(
				membersCountResolver(mockParent, {}, mockContext),
			).rejects.toThrow(
				new TalawaGraphQLError({ extensions: { code: "unauthenticated" } }),
			);
		});

		it("should return member count for authenticated client", async () => {
			const mockUserData = {
				id: "user-123",
				role: "member",
				organizationMembershipsWhereMember: [],
			};
			const { context: mockContext, mocks } = createMockGraphQLContext(
				true,
				"user-123",
			);
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
				mockUserData,
			);
			const whereMock = vi.fn().mockResolvedValue([{ total: 5 }]);
			const fromMock = vi.fn().mockReturnValue({ where: whereMock });
			mocks.drizzleClient.select.mockReturnValue({ from: fromMock });

			const result = await membersCountResolver(mockParent, {}, mockContext);

			expect(result).toBe(5);
			expect(mockContext.drizzleClient.select).toHaveBeenCalled();
			expect(fromMock).toHaveBeenCalledWith(organizationMembershipsTable);
			expect(whereMock).toHaveBeenCalledWith(
				eq(organizationMembershipsTable.organizationId, "org123"),
			);
		});

		it("should return 0 when no members are found", async () => {
			const mockUserData = {
				id: "user-123",
				role: "member",
				organizationMembershipsWhereMember: [],
			};
			const { context: mockContext, mocks } = createMockGraphQLContext(
				true,
				"user-123",
			);
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce({
				mockUserData,
			});

			const whereMock = vi.fn().mockResolvedValue([]);
			const fromMock = vi.fn().mockReturnValue({ where: whereMock });
			mocks.drizzleClient.select.mockReturnValue({ from: fromMock });

			const result = await membersCountResolver(mockParent, {}, mockContext);
			expect(result).toBe(0);
		});
	});

	describe("adminsCountResolver", () => {
		it("should throw unauthenticated error when client is not authenticated", async () => {
			const { context: mockContext } = createMockGraphQLContext();
			mockContext.currentClient.isAuthenticated = false;

			await expect(
				adminsCountResolver(mockParent, {}, mockContext),
			).rejects.toThrowError(TalawaGraphQLError);

			await expect(
				adminsCountResolver(mockParent, {}, mockContext),
			).rejects.toMatchObject({
				extensions: { code: "unauthenticated" },
			});
		});

		it("should return admin count for authenticated client", async () => {
			const mockUserData = {
				id: "user-123",
				role: "member",
				organizationMembershipsWhereMember: [],
			};
			const { context: mockContext, mocks } = createMockGraphQLContext(
				true,
				"user-123",
			);
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
				mockUserData,
			);
			const whereMock = vi.fn().mockResolvedValue([{ total: 3 }]);
			const fromMock = vi.fn().mockReturnValue({ where: whereMock });
			mocks.drizzleClient.select.mockReturnValue({ from: fromMock });

			const result = await adminsCountResolver(mockParent, {}, mockContext);

			expect(result).toBe(3);
			expect(mockContext.drizzleClient.select).toHaveBeenCalled();
			expect(fromMock).toHaveBeenCalledWith(organizationMembershipsTable);
			expect(whereMock).toHaveBeenCalledWith(
				and(
					eq(organizationMembershipsTable.organizationId, "org123"),
					eq(organizationMembershipsTable.role, "administrator"),
				),
			);
		});
		it("should throw unauthenticated error if  current user is not found", async () => {
			const { context: mockContext, mocks } = createMockGraphQLContext(
				true,
				"user-123",
			);
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
				undefined,
			);

			await expect(
				adminsCountResolver(mockParent, {}, mockContext),
			).rejects.toThrow(
				new TalawaGraphQLError({ extensions: { code: "unauthenticated" } }),
			);
		});

		it("should return 0 when no admins are found", async () => {
			const mockUserData = {
				id: "user-123",
				role: "member",
				organizationMembershipsWhereMember: [],
			};
			const { context: mockContext, mocks } = createMockGraphQLContext(
				true,
				"user-123",
			);
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
				mockUserData,
			);
			const whereMock = vi.fn().mockResolvedValue([]);
			const fromMock = vi.fn().mockReturnValue({ where: whereMock });
			mocks.drizzleClient.select.mockReturnValue({ from: fromMock });

			const result = await adminsCountResolver(mockParent, {}, mockContext);
			expect(result).toBe(0);
		});
	});

	describe("isMemberResolver", () => {
		it("should throw unauthenticated error when client is not authenticated", async () => {
			const { context: mockContext } = createMockGraphQLContext();
			mockContext.currentClient.isAuthenticated = false;

			await expect(
				isMemberResolver(mockParent, {}, mockContext),
			).rejects.toThrowError(TalawaGraphQLError);

			await expect(
				isMemberResolver(mockParent, {}, mockContext),
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

			await expect(
				isMemberResolver(mockParent, {}, mockContext),
			).rejects.toThrow(
				new TalawaGraphQLError({ extensions: { code: "unauthenticated" } }),
			);
		});

		it("should return true when user is a member", async () => {
			const mockUserData = {
				id: "user-123",
				role: "member",
				organizationMembershipsWhereMember: [{ role: "member" }],
			};

			const { context: mockContext, mocks } = createMockGraphQLContext(
				true,
				"user-123",
			);

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
				mockUserData,
			);

			const result = await isMemberResolver(mockParent, {}, mockContext);

			expect(result).toBe(true);
			expect(
				mocks.drizzleClient.query.usersTable.findFirst,
			).toHaveBeenCalledWith({
				columns: { role: true },
				with: {
					organizationMembershipsWhereMember: {
						columns: { role: true },
						where: expect.any(Function),
					},
				},
				where: expect.any(Function),
			});
		});

		it("should return false when user is not a member", async () => {
			const mockUserData = {
				id: "user-123",
				role: "member",
				organizationMembershipsWhereMember: [],
			};

			const { context: mockContext, mocks } = createMockGraphQLContext(
				true,
				"user-123",
			);

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
				mockUserData,
			);

			const result = await isMemberResolver(mockParent, {}, mockContext);

			expect(result).toBe(false);
			expect(
				mocks.drizzleClient.query.usersTable.findFirst,
			).toHaveBeenCalledWith({
				columns: { role: true },
				with: {
					organizationMembershipsWhereMember: {
						columns: { role: true },
						where: expect.any(Function),
					},
				},
				where: expect.any(Function),
			});
		});
	});
});
