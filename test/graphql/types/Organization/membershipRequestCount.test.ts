import { eq } from "drizzle-orm";
import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { afterEach, describe, expect, it, vi } from "vitest";
import { membershipRequestsTable } from "~/src/drizzle/tables/membershipRequests";
import { membershipRequestCountResolver } from "~/src/graphql/types/Organization/membershipRequestCount";

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

describe("Organization membershipRequestCountResolver", () => {
	it("should throw unauthenticated error when client is not authenticated", async () => {
		const { context: mockContext } = createMockGraphQLContext();
		mockContext.currentClient.isAuthenticated = false;

		await expect(
			membershipRequestCountResolver(mockParent, {}, mockContext),
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
			membershipRequestCountResolver(mockParent, {}, mockContext),
		).rejects.toMatchObject({
			extensions: { code: "unauthenticated" },
		});
	});

	it("should return membership request count for authenticated client", async () => {
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

		const mockQuery = Promise.resolve([{ total: 5 }]);
		const whereMock = vi.fn().mockReturnValue(mockQuery);
		const fromMock = vi.fn().mockReturnValue({ where: whereMock });
		mocks.drizzleClient.select.mockReturnValue({ from: fromMock });

		const result = await membershipRequestCountResolver(
			mockParent,
			{},
			mockContext,
		);

		expect(result).toBe(5);
		expect(mockContext.drizzleClient.select).toHaveBeenCalled();
		expect(fromMock).toHaveBeenCalledWith(membershipRequestsTable);
		expect(whereMock).toHaveBeenCalledWith(
			eq(membershipRequestsTable.organizationId, "org123"),
		);
	});

	it("should query the database with the correct organizationId filter", async () => {
		const mockUserData = {
			id: "user-123",
			role: "member",
			organizationMembershipsWhereMember: [
				{
					role: "administrator",
					organizationId: mockParent.id,
				},
			],
		};
		const { context: mockContext, mocks } = createMockGraphQLContext(
			true,
			"user-123",
		);

		(
			mocks.drizzleClient.query.usersTable.findFirst as ReturnType<typeof vi.fn>
		).mockImplementation(({ with: withClause }) => {
			expect(withClause).toBeDefined();

			const mockFields = {
				organizationId: "550e8400-e29b-41d4-a716-446655440000",
			};
			const mockOperators = { eq: vi.fn((a, b) => ({ [a]: b })) };

			const innerWhereResult =
				withClause.organizationMembershipsWhereMember.where(
					mockFields,
					mockOperators,
				);
			expect(innerWhereResult).toEqual(
				expect.objectContaining({
					[mockFields.organizationId]: mockParent.id, // Ensure organizationId filter is applied
				}),
			);
			return Promise.resolve(mockUserData);
		});

		const mockQuery = Promise.resolve([{ total: 3 }]);
		const whereMock = vi.fn().mockReturnValue(mockQuery);
		const fromMock = vi.fn().mockReturnValue({ where: whereMock });
		mocks.drizzleClient.select.mockReturnValue({ from: fromMock });

		const result = await membershipRequestCountResolver(
			mockParent,
			{},
			mockContext,
		);

		expect(result).toBe(3);
	});
	it("should throw unauthorized error when user is not admin of the organization", async () => {
		const mockUserData = {
			id: "user-123",
			role: "member",
			organizationMembershipsWhereMember: [{ role: "member" }], // Member but not admin
		};
		const { context: mockContext, mocks } = createMockGraphQLContext(
			true,
			"user-123",
		);
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
			mockUserData,
		);
		await expect(
			membershipRequestCountResolver(mockParent, {}, mockContext),
		).rejects.toMatchObject({
			extensions: { code: "unauthorized_action" },
		});
	});

	it("should return 0 when no membership requests are found for the organization", async () => {
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

		// Mock empty result array to test the fallback to 0
		const mockQuery = Promise.resolve([]);
		const whereMock = vi.fn().mockReturnValue(mockQuery);
		const fromMock = vi.fn().mockReturnValue({ where: whereMock });
		mocks.drizzleClient.select.mockReturnValue({ from: fromMock });

		const result = await membershipRequestCountResolver(
			mockParent,
			{},
			mockContext,
		);

		expect(result).toBe(0);
		expect(mockContext.drizzleClient.select).toHaveBeenCalled();
		expect(fromMock).toHaveBeenCalledWith(membershipRequestsTable);
		expect(whereMock).toHaveBeenCalledWith(
			eq(membershipRequestsTable.organizationId, "org123"),
		);
	});
});
