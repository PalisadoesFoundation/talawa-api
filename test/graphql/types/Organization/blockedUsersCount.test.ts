import { count, eq } from "drizzle-orm";
import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { describe, expect, it, vi } from "vitest";
import { blockedUsersTable } from "~/src/drizzle/schema";
import { blockedUsersCountResolver } from "~/src/graphql/types/Organization/blockedUsersCount";
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

describe("Organization blockedUsersCountResolver", () => {
	it("should throw unauthenticated error when client is not authenticated", async () => {
		const { context: mockContext } = createMockGraphQLContext();
		mockContext.currentClient.isAuthenticated = false;

		await expect(
			blockedUsersCountResolver(mockParent, {}, mockContext),
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
			blockedUsersCountResolver(mockParent, {}, mockContext),
		).rejects.toThrow(
			new TalawaGraphQLError({ extensions: { code: "unauthenticated" } }),
		);
	});

	it("should return blocked users count for authenticated client", async () => {
		const mockUserData = {
			id: "user-123",
			role: "administrator",
			organizationMembershipsWhereMember: [{ role: "administrator" }],
		};
		const { context: mockContext, mocks } = createMockGraphQLContext(
			true,
			"user-123",
		);
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
			mockUserData,
		);

		const mockQuery = Promise.resolve([{ total: 3 }]);
		const whereMock = vi.fn().mockReturnValue(mockQuery);
		const fromMock = vi.fn().mockReturnValue({ where: whereMock });
		mocks.drizzleClient.select.mockReturnValue({ from: fromMock });

		const result = await blockedUsersCountResolver(mockParent, {}, mockContext);

		expect(result).toBe(3);
		expect(mockContext.drizzleClient.select).toHaveBeenCalledWith({
			total: count(),
		});
		expect(fromMock).toHaveBeenCalledWith(blockedUsersTable);
		expect(whereMock).toHaveBeenCalledWith(
			eq(blockedUsersTable.organizationId, "org123"),
		);
	});

	it("should throw unauthorized error when user is not a member", async () => {
		const mockUserData = {
			id: "user-123",
			role: "administrator",
			organizationMembershipsWhereMember: [],
		};
		const { context: mockContext, mocks } = createMockGraphQLContext(
			true,
			"user-123",
		);
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
			mockUserData,
		);

		await expect(
			blockedUsersCountResolver(mockParent, {}, mockContext),
		).rejects.toThrowError(
			expect.objectContaining({ extensions: { code: "unauthorized_action" } }),
		);
	});

	it("should throw unauthorized error when user is not a admin", async () => {
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

		await expect(
			blockedUsersCountResolver(mockParent, {}, mockContext),
		).rejects.toThrowError(
			expect.objectContaining({ extensions: { code: "unauthorized_action" } }),
		);
	});
});
