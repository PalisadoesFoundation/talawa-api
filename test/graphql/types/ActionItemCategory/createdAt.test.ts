import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import type { ActionItemCategory as ActionItemCategoryType } from "~/src/graphql/types/ActionItemCategory/ActionItemCategory";
import { resolveCreatedAt } from "~/src/graphql/types/ActionItemCategory/createdAt";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import "~/src/graphql/types/ActionItemCategory/ActionItemCategory";
import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";

type MockUser = {
	id: string;
	role: string;
	organizationMembershipsWhereMember: Array<{
		role: string;
		organizationId: string;
	}>;
};

describe("ActionItemCategory CreatedAt Resolver Tests", () => {
	let ctx: GraphQLContext;
	let mockActionItemCategory: ActionItemCategoryType;
	let mocks: ReturnType<typeof createMockGraphQLContext>["mocks"];

	beforeEach(() => {
		const { context, mocks: newMocks } = createMockGraphQLContext(
			true,
			"user-123",
		);
		ctx = context;
		mocks = newMocks;
		mockActionItemCategory = {
			id: "550e8400-e29b-41d4-a716-446655440000",
			name: "High Priority",
			description: "Action items that require immediate attention",
			isDisabled: false,
			organizationId: "789e1234-e89b-12d3-a456-426614174002",
			createdAt: new Date("2024-02-01T10:00:00Z"),
			updatedAt: new Date("2024-02-05T12:00:00Z"),
			creatorId: "123e4567-e89b-12d3-a456-426614174000",
			updaterId: "223e4567-e89b-12d3-a456-426614174001",
		} as ActionItemCategoryType;
	});

	it("should throw unauthenticated error if user is not logged in", async () => {
		ctx.currentClient.isAuthenticated = false;
		await expect(
			resolveCreatedAt(mockActionItemCategory, {}, ctx),
		).rejects.toThrow(
			new TalawaGraphQLError({ extensions: { code: "unauthenticated" } }),
		);
	});

	it("should throw unauthenticated error if current user does not exist", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(undefined);
		await expect(
			resolveCreatedAt(mockActionItemCategory, {}, ctx),
		).rejects.toThrow(
			new TalawaGraphQLError({ extensions: { code: "unauthenticated" } }),
		);
	});

	it("should throw unauthorized_action error if user is not an administrator", async () => {
		const mockUserData: MockUser = {
			id: "user-123",
			role: "member",
			organizationMembershipsWhereMember: [
				{
					role: "member",
					organizationId: mockActionItemCategory.organizationId,
				},
			],
		};
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
			mockUserData,
		);
		await expect(
			resolveCreatedAt(mockActionItemCategory, {}, ctx),
		).rejects.toThrow(
			new TalawaGraphQLError({ extensions: { code: "unauthorized_action" } }),
		);
	});

	it("should throw unauthorized_action error if user has no organization membership", async () => {
		const mockUserData: MockUser = {
			id: "user-123",
			role: "member",
			organizationMembershipsWhereMember: [], // No membership
		};
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
			mockUserData,
		);
		await expect(
			resolveCreatedAt(mockActionItemCategory, {}, ctx),
		).rejects.toThrow(
			new TalawaGraphQLError({ extensions: { code: "unauthorized_action" } }),
		);
	});

	it("should throw unauthorized_action error if user is regular member", async () => {
		const mockUserData: MockUser = {
			id: "user-123",
			role: "member",
			organizationMembershipsWhereMember: [
				{
					role: "regular",
					organizationId: mockActionItemCategory.organizationId,
				},
			],
		};
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
			mockUserData,
		);
		await expect(
			resolveCreatedAt(mockActionItemCategory, {}, ctx),
		).rejects.toThrow(
			new TalawaGraphQLError({ extensions: { code: "unauthorized_action" } }),
		);
	});

	it("should return createdAt if user is system administrator", async () => {
		const mockUserData: MockUser = {
			id: "user-123",
			role: "administrator",
			organizationMembershipsWhereMember: [],
		};
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
			mockUserData,
		);
		const result = await resolveCreatedAt(mockActionItemCategory, {}, ctx);
		expect(result).toBe(mockActionItemCategory.createdAt);
	});

	it("should return createdAt if user is organization administrator", async () => {
		const mockUserData: MockUser = {
			id: "user-123",
			role: "member",
			organizationMembershipsWhereMember: [
				{
					role: "administrator",
					organizationId: mockActionItemCategory.organizationId,
				},
			],
		};
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
			mockUserData,
		);
		const result = await resolveCreatedAt(mockActionItemCategory, {}, ctx);
		expect(result).toBe(mockActionItemCategory.createdAt);
	});

	it("should return createdAt if global admin with no organization membership", async () => {
		const mockUserData: MockUser = {
			id: "user-123",
			role: "administrator",
			organizationMembershipsWhereMember: [], // Global admin doesn't need org membership
		};
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
			mockUserData,
		);
		const result = await resolveCreatedAt(mockActionItemCategory, {}, ctx);
		expect(result).toBe(mockActionItemCategory.createdAt);
	});

	it("should handle database query failures", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockRejectedValue(
			new Error("Database error"),
		);
		await expect(
			resolveCreatedAt(mockActionItemCategory, {}, ctx),
		).rejects.toThrow(new Error("Database error"));
	});

	it("should query the database with the correct organizationId filter", async () => {
		const mockUserData: MockUser = {
			id: "user-123",
			role: "member",
			organizationMembershipsWhereMember: [
				{
					role: "administrator",
					organizationId: mockActionItemCategory.organizationId,
				},
			],
		};

		// Mock implementation to verify if organizationId filter is used
		(
			mocks.drizzleClient.query.usersTable.findFirst as ReturnType<typeof vi.fn>
		).mockImplementation(({ with: withClause }) => {
			expect(withClause).toBeDefined();

			const mockFields = {
				organizationId: "550e8400-e29b-41d4-a716-446655440000",
			};
			const mockOperators = { eq: vi.fn((a, b) => ({ [a]: b })) };

			// Verify the inner where clause inside withClause
			const innerWhereResult =
				withClause.organizationMembershipsWhereMember.where(
					mockFields,
					mockOperators,
				);
			expect(innerWhereResult).toEqual(
				expect.objectContaining({
					[mockFields.organizationId]: mockActionItemCategory.organizationId, // Ensure organizationId filter is applied
				}),
			);
			return Promise.resolve(mockUserData);
		});

		const result = await resolveCreatedAt(mockActionItemCategory, {}, ctx);
		expect(result).toEqual(mockActionItemCategory.createdAt);
	});

	it("should query the database with the correct user ID filter", async () => {
		const mockUserData: MockUser = {
			id: "user-123",
			role: "administrator",
			organizationMembershipsWhereMember: [],
		};

		// Mock implementation to verify if user ID filter is used
		(
			mocks.drizzleClient.query.usersTable.findFirst as ReturnType<typeof vi.fn>
		).mockImplementation(({ where: whereClause }) => {
			expect(whereClause).toBeDefined();

			const mockFields = {
				id: "user-field-id",
			};
			const mockOperators = { eq: vi.fn((a, b) => ({ [a]: b })) };

			// Verify the where clause
			const whereResult = whereClause(mockFields, mockOperators);
			expect(whereResult).toEqual(
				expect.objectContaining({
					[mockFields.id]: ctx.currentClient.user?.id,
				}),
			);
			return Promise.resolve(mockUserData);
		});

		const result = await resolveCreatedAt(mockActionItemCategory, {}, ctx);
		expect(result).toEqual(mockActionItemCategory.createdAt);
	});

	it("should handle organization membership check correctly", async () => {
		const mockUserData: MockUser = {
			id: "user-123",
			role: "member",
			organizationMembershipsWhereMember: [
				{
					role: "administrator",
					organizationId: mockActionItemCategory.organizationId,
				},
				{
					role: "member",
					organizationId: "different-org-id", // Different organization
				},
			],
		};
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
			mockUserData,
		);

		// Should succeed because the first membership is for the correct organization and role
		const result = await resolveCreatedAt(mockActionItemCategory, {}, ctx);
		expect(result).toBe(mockActionItemCategory.createdAt);
	});

	it("should return the exact createdAt date from parent", async () => {
		const specificDate = new Date("2023-12-25T15:30:45.123Z");
		const categoryWithSpecificDate = {
			...mockActionItemCategory,
			createdAt: specificDate,
		};

		const mockUserData: MockUser = {
			id: "user-123",
			role: "administrator",
			organizationMembershipsWhereMember: [],
		};
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
			mockUserData,
		);

		const result = await resolveCreatedAt(categoryWithSpecificDate, {}, ctx);
		expect(result).toBe(specificDate);
		expect(result.getTime()).toBe(specificDate.getTime());
	});

	it("should handle empty args object correctly", async () => {
		const mockUserData: MockUser = {
			id: "user-123",
			role: "administrator",
			organizationMembershipsWhereMember: [],
		};
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
			mockUserData,
		);

		// Test with empty args
		const result = await resolveCreatedAt(
			mockActionItemCategory,
			{} as Record<string, never>,
			ctx,
		);
		expect(result).toBe(mockActionItemCategory.createdAt);
	});

	it("should handle network timeout during database query", async () => {
		const timeoutError = new Error("Connection timeout");
		timeoutError.name = "TimeoutError";

		mocks.drizzleClient.query.usersTable.findFirst.mockRejectedValue(
			timeoutError,
		);

		await expect(
			resolveCreatedAt(mockActionItemCategory, {}, ctx),
		).rejects.toThrow(timeoutError);
	});

	it("should verify database query structure", async () => {
		const mockUserData: MockUser = {
			id: "user-123",
			role: "administrator",
			organizationMembershipsWhereMember: [],
		};

		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
			mockUserData,
		);

		await resolveCreatedAt(mockActionItemCategory, {}, ctx);

		// Verify the query was called with correct structure
		expect(mocks.drizzleClient.query.usersTable.findFirst).toHaveBeenCalledWith(
			{
				columns: {
					role: true,
				},
				with: {
					organizationMembershipsWhereMember: {
						columns: {
							role: true,
						},
						where: expect.any(Function),
					},
				},
				where: expect.any(Function),
			},
		);
	});
});
