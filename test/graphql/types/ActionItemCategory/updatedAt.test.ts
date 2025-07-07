import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import type { ActionItemCategory as ActionItemCategoryType } from "~/src/graphql/types/ActionItemCategory/ActionItemCategory";
import { resolveUpdatedAt } from "~/src/graphql/types/ActionItemCategory/updatedAt";
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

describe("ActionItemCategory UpdatedAt Resolver Tests", () => {
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

	describe("Missing updatedAt validation", () => {
		it("should throw unexpected error if updatedAt is null", async () => {
			const categoryWithoutUpdatedAt = {
				...mockActionItemCategory,
				updatedAt: null,
			};

			await expect(
				resolveUpdatedAt(categoryWithoutUpdatedAt, {}, ctx),
			).rejects.toThrow(
				new TalawaGraphQLError({
					message: "Missing updatedAt value for the action item category",
					extensions: {
						code: "unexpected",
					},
				}),
			);
		});
	});

	describe("Authentication tests", () => {
		it("should throw unauthenticated error if user is not logged in", async () => {
			ctx.currentClient.isAuthenticated = false;
			await expect(
				resolveUpdatedAt(mockActionItemCategory, {}, ctx),
			).rejects.toThrow(
				new TalawaGraphQLError({ extensions: { code: "unauthenticated" } }),
			);
		});

		it("should throw unauthenticated error if current user does not exist", async () => {
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				undefined,
			);
			await expect(
				resolveUpdatedAt(mockActionItemCategory, {}, ctx),
			).rejects.toThrow(
				new TalawaGraphQLError({ extensions: { code: "unauthenticated" } }),
			);
		});
	});

	describe("Authorization tests", () => {
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
				resolveUpdatedAt(mockActionItemCategory, {}, ctx),
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
				resolveUpdatedAt(mockActionItemCategory, {}, ctx),
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
				resolveUpdatedAt(mockActionItemCategory, {}, ctx),
			).rejects.toThrow(
				new TalawaGraphQLError({ extensions: { code: "unauthorized_action" } }),
			);
		});
	});

	describe("Successful resolution", () => {
		it("should return updatedAt if user is system administrator", async () => {
			const mockUserData: MockUser = {
				id: "user-123",
				role: "administrator",
				organizationMembershipsWhereMember: [],
			};
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				mockUserData,
			);
			const result = await resolveUpdatedAt(mockActionItemCategory, {}, ctx);
			expect(result).toBe(mockActionItemCategory.updatedAt);
		});

		it("should return updatedAt if user is organization administrator", async () => {
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
			const result = await resolveUpdatedAt(mockActionItemCategory, {}, ctx);
			expect(result).toBe(mockActionItemCategory.updatedAt);
		});

		it("should return updatedAt if global admin with no organization membership", async () => {
			const mockUserData: MockUser = {
				id: "user-123",
				role: "administrator",
				organizationMembershipsWhereMember: [], // Global admin doesn't need org membership
			};
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				mockUserData,
			);
			const result = await resolveUpdatedAt(mockActionItemCategory, {}, ctx);
			expect(result).toBe(mockActionItemCategory.updatedAt);
		});

		it("should return the exact updatedAt date from parent", async () => {
			const specificDate = new Date("2023-12-25T15:30:45.123Z");
			const categoryWithSpecificDate = {
				...mockActionItemCategory,
				updatedAt: specificDate,
			};

			const mockUserData: MockUser = {
				id: "user-123",
				role: "administrator",
				organizationMembershipsWhereMember: [],
			};
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				mockUserData,
			);

			const result = await resolveUpdatedAt(categoryWithSpecificDate, {}, ctx);
			expect(result).toBe(specificDate);
			expect(result.getTime()).toBe(specificDate.getTime());
		});
	});

	describe("Error handling", () => {
		it("should handle database query failures and throw unexpected error", async () => {
			const dbError = new Error("Database connection failed");
			mocks.drizzleClient.query.usersTable.findFirst.mockRejectedValue(dbError);

			await expect(
				resolveUpdatedAt(mockActionItemCategory, {}, ctx),
			).rejects.toThrow(
				new TalawaGraphQLError({
					message: "Internal server error",
					extensions: {
						code: "unexpected",
					},
				}),
			);

			// Verify the original error was logged
			expect(ctx.log.error).toHaveBeenCalledWith(dbError);
		});

		it("should handle network timeout and throw unexpected error", async () => {
			const timeoutError = new Error("Connection timeout");
			timeoutError.name = "TimeoutError";

			mocks.drizzleClient.query.usersTable.findFirst.mockRejectedValue(
				timeoutError,
			);

			await expect(
				resolveUpdatedAt(mockActionItemCategory, {}, ctx),
			).rejects.toThrow(
				new TalawaGraphQLError({
					message: "Internal server error",
					extensions: {
						code: "unexpected",
					},
				}),
			);

			// Verify the original error was logged
			expect(ctx.log.error).toHaveBeenCalledWith(timeoutError);
		});

		it("should not catch and re-wrap TalawaGraphQLError instances", async () => {
			const talawaError = new TalawaGraphQLError({
				extensions: { code: "unauthenticated" },
			});

			mocks.drizzleClient.query.usersTable.findFirst.mockRejectedValue(
				talawaError,
			);

			await expect(
				resolveUpdatedAt(mockActionItemCategory, {}, ctx),
			).rejects.toThrow(talawaError);

			// Verify the error was not logged since it's a TalawaGraphQLError
			expect(ctx.log.error).not.toHaveBeenCalled();
		});

		it("should handle generic JavaScript errors", async () => {
			const genericError = new TypeError("Cannot read property of undefined");

			mocks.drizzleClient.query.usersTable.findFirst.mockRejectedValue(
				genericError,
			);

			await expect(
				resolveUpdatedAt(mockActionItemCategory, {}, ctx),
			).rejects.toThrow(
				new TalawaGraphQLError({
					message: "Internal server error",
					extensions: {
						code: "unexpected",
					},
				}),
			);

			expect(ctx.log.error).toHaveBeenCalledWith(genericError);
		});
	});

	describe("Database query verification", () => {
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
				mocks.drizzleClient.query.usersTable.findFirst as ReturnType<
					typeof vi.fn
				>
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
						[mockFields.organizationId]: mockActionItemCategory.organizationId,
					}),
				);
				return Promise.resolve(mockUserData);
			});

			const result = await resolveUpdatedAt(mockActionItemCategory, {}, ctx);
			expect(result).toEqual(mockActionItemCategory.updatedAt);
		});

		it("should query the database with the correct user ID filter", async () => {
			const mockUserData: MockUser = {
				id: "user-123",
				role: "administrator",
				organizationMembershipsWhereMember: [],
			};

			// Mock implementation to verify if user ID filter is used
			(
				mocks.drizzleClient.query.usersTable.findFirst as ReturnType<
					typeof vi.fn
				>
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

			const result = await resolveUpdatedAt(mockActionItemCategory, {}, ctx);
			expect(result).toEqual(mockActionItemCategory.updatedAt);
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

			await resolveUpdatedAt(mockActionItemCategory, {}, ctx);

			// Verify the query was called with correct structure
			expect(
				mocks.drizzleClient.query.usersTable.findFirst,
			).toHaveBeenCalledWith({
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
			});
		});
	});

	describe("Organization membership handling", () => {
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
			const result = await resolveUpdatedAt(mockActionItemCategory, {}, ctx);
			expect(result).toBe(mockActionItemCategory.updatedAt);
		});
	});

	describe("Edge cases", () => {
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
			const result = await resolveUpdatedAt(
				mockActionItemCategory,
				{} as Record<string, never>,
				ctx,
			);
			expect(result).toBe(mockActionItemCategory.updatedAt);
		});

		it("should handle falsy updatedAt values correctly", async () => {
			// Test with 0 (falsy but valid Date)
			const categoryWithZeroDate = {
				...mockActionItemCategory,
				updatedAt: new Date(0), // January 1, 1970
			};

			const mockUserData: MockUser = {
				id: "user-123",
				role: "administrator",
				organizationMembershipsWhereMember: [],
			};
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				mockUserData,
			);

			const result = await resolveUpdatedAt(categoryWithZeroDate, {}, ctx);
			expect(result).toBe(categoryWithZeroDate.updatedAt);
			expect(result.getTime()).toBe(0);
		});

		it("should handle invalid Date objects", async () => {
			const categoryWithInvalidDate = {
				...mockActionItemCategory,
				updatedAt: new Date("invalid-date-string"), // Invalid Date
			};

			const mockUserData: MockUser = {
				id: "user-123",
				role: "administrator",
				organizationMembershipsWhereMember: [],
			};
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				mockUserData,
			);

			// Should still return the invalid Date object (NaN date)
			const result = await resolveUpdatedAt(categoryWithInvalidDate, {}, ctx);
			expect(result).toBe(categoryWithInvalidDate.updatedAt);
			expect(Number.isNaN(result.getTime())).toBe(true);
		});
	});
});
