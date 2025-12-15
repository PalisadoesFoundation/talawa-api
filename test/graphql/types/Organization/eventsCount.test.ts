import { count, eq } from "drizzle-orm";
import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { afterEach, describe, expect, it, vi } from "vitest";
import { eventsTable } from "~/src/drizzle/schema";
import { eventsCountResolver } from "~/src/graphql/types/Organization/eventsCount";

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

describe("Organization eventsCountResolver", () => {
	it("should throw unauthenticated error when client is not authenticated", async () => {
		const { context: mockContext } = createMockGraphQLContext();
		mockContext.currentClient.isAuthenticated = false;

		await expect(
			eventsCountResolver(mockParent, {}, mockContext),
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
			eventsCountResolver(mockParent, {}, mockContext),
		).rejects.toMatchObject({
			extensions: { code: "unauthenticated" },
		});
	});

	it("should return events count for authenticated client", async () => {
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
		const mockQuery = Promise.resolve([{ total: 12 }]);
		const whereMock = vi.fn().mockReturnValue(mockQuery);
		const fromMock = vi.fn().mockReturnValue({ where: whereMock });
		mocks.drizzleClient.select.mockReturnValue({ from: fromMock });

		const result = await eventsCountResolver(mockParent, {}, mockContext);

		expect(result).toBe(12);
		expect(mockContext.drizzleClient.select).toHaveBeenCalledWith({
			total: count(),
		});
		expect(fromMock).toHaveBeenCalledWith(eventsTable);
		expect(whereMock).toHaveBeenCalledWith(
			eq(eventsTable.organizationId, "org123"),
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

		const mockQuery = Promise.resolve([{ total: 6 }]);
		const whereMock = vi.fn().mockReturnValue(mockQuery);
		const fromMock = vi.fn().mockReturnValue({ where: whereMock });
		mocks.drizzleClient.select.mockReturnValue({ from: fromMock });

		const result = await eventsCountResolver(mockParent, {}, mockContext);

		expect(result).toBe(6);
	});

	it("should throw unauthorized error when user is not a member", async () => {
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

		await expect(
			eventsCountResolver(mockParent, {}, mockContext),
		).rejects.toThrowError(
			expect.objectContaining({ extensions: { code: "unauthorized_action" } }),
		);
	});

	it("should return 0 when no events are found for the organization", async () => {
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

		const result = await eventsCountResolver(mockParent, {}, mockContext);

		expect(result).toBe(0);
		expect(mockContext.drizzleClient.select).toHaveBeenCalledWith({
			total: count(),
		});
		expect(fromMock).toHaveBeenCalledWith(eventsTable);
		expect(whereMock).toHaveBeenCalledWith(
			eq(eventsTable.organizationId, "org123"),
		);
	});
});
