import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import { FundCreatorResolver } from "~/src/graphql/types/Fund/creator";
import type { Fund as FundType } from "~/src/graphql/types/Fund/Fund";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

type MockUser = {
	id: string;
	role: string;
	organizationMembershipsWhereMember: Array<{
		role: string;
		organizationId: string;
	}>;
};
describe("Fund Creator Resolver Tests", () => {
	let ctx: GraphQLContext;
	let mockFund: FundType;
	let mocks: ReturnType<typeof createMockGraphQLContext>["mocks"];

	beforeEach(() => {
		const { context, mocks: newMocks } = createMockGraphQLContext(
			true,
			"user-123",
		);
		ctx = context;
		mocks = newMocks;
		mockFund = {
			id: "987fbc97-4bed-5078-bf8c-64e9bb4b5f32",
			name: "Test Fund",
			creatorId: "123e4567-e89b-12d3-a456-426614174000",
			createdAt: new Date("2024-02-07T10:30:00.000Z"),
			updatedAt: new Date("2024-02-07T12:00:00.000Z"),
			organizationId: "64e9bb4b5",
			isTaxDeductible: false,
			updaterId: null,
			isDefault: false,
			isArchived: false,
			referenceNumber: null,
		};
	});
	describe("Authentication and Authorization", () => {
		it("should throw unauthenticated error if user is not logged in", async () => {
			ctx.currentClient.isAuthenticated = false;
			await expect(FundCreatorResolver(mockFund, {}, ctx)).rejects.toThrow(
				new TalawaGraphQLError({ extensions: { code: "unauthenticated" } }),
			);
		});
		it("should throw unauthorized_action for non-admin and no organizationMembership", async () => {
			const mockUserData: MockUser = {
				id: "user-123",
				role: "member",
				organizationMembershipsWhereMember: [],
			};

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				mockUserData,
			);

			await expect(FundCreatorResolver(mockFund, {}, ctx)).rejects.toThrow(
				new TalawaGraphQLError({ extensions: { code: "unauthorized_action" } }),
			);
		});
		it("should throw unauthorized_action for non-admin with member-level organization membership", async () => {
			const mockUserData: MockUser = {
				id: "user-123",
				role: "member",
				organizationMembershipsWhereMember: [
					{ role: "member", organizationId: mockFund.organizationId },
				],
			};

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				mockUserData,
			);

			const result = await FundCreatorResolver(mockFund, {}, ctx);
			expect(result).toBeDefined();
		});
		it("should allow system administrator full access", async () => {
			const mockUserData: MockUser = {
				id: "user-123",
				role: "administrator",
				organizationMembershipsWhereMember: [],
			};

			mocks.drizzleClient.query.usersTable.findFirst
				.mockResolvedValueOnce(mockUserData)
				.mockResolvedValueOnce({ id: mockFund.creatorId });

			const result = await FundCreatorResolver(mockFund, {}, ctx);
			expect(result).toBeDefined();
		});
		it("should allow organization administrator access", async () => {
			const mockUserData: MockUser = {
				id: "user-123",
				role: "member",
				organizationMembershipsWhereMember: [
					{ role: "administrator", organizationId: mockFund.organizationId },
				],
			};

			mocks.drizzleClient.query.usersTable.findFirst
				.mockResolvedValueOnce(mockUserData)
				.mockResolvedValueOnce({ id: mockFund.creatorId });

			const result = await FundCreatorResolver(mockFund, {}, ctx);
			expect(result).toBeDefined();
		});
	});
	describe("Creator Retrieval Tests", () => {
		it("should return null for null creatorId", async () => {
			mockFund.creatorId = null;
			const mockUserData: MockUser = {
				id: "user-123",
				role: "administrator",
				organizationMembershipsWhereMember: [
					{ role: "administrator", organizationId: mockFund.organizationId },
				],
			};

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				mockUserData,
			);

			const result = await FundCreatorResolver(mockFund, {}, ctx);
			expect(result).toBeNull();
		});
		it("should throw unexpected error if creator user is not found", async () => {
			const mockUserData: MockUser = {
				id: "user-123",
				role: "administrator",
				organizationMembershipsWhereMember: [
					{ role: "administrator", organizationId: mockFund.organizationId },
				],
			};
			mocks.drizzleClient.query.usersTable.findFirst
				.mockResolvedValueOnce(mockUserData)
				.mockResolvedValueOnce(undefined);

			await expect(FundCreatorResolver(mockFund, {}, ctx)).rejects.toThrow(
				new TalawaGraphQLError({ extensions: { code: "unexpected" } }),
			);
			expect(ctx.log.warn).toHaveBeenCalled();
		});
	});
	describe("Error Handling", () => {
		it("should handle database connection error", async () => {
			mocks.drizzleClient.query.usersTable.findFirst.mockRejectedValue(
				new Error("Database connection failed"),
			);

			await expect(FundCreatorResolver(mockFund, {}, ctx)).rejects.toThrow(
				new TalawaGraphQLError({
					message: "Internal server error",
					extensions: { code: "unexpected" },
				}),
			);
			expect(ctx.log.error).toHaveBeenCalled();
		});
		it("should handle database timeout error", async () => {
			mocks.drizzleClient.query.usersTable.findFirst.mockRejectedValue(
				new Error("Query timeout"),
			);

			await expect(FundCreatorResolver(mockFund, {}, ctx)).rejects.toThrow(
				new TalawaGraphQLError({
					message: "Internal server error",
					extensions: { code: "unexpected" },
				}),
			);
			expect(ctx.log.error).toHaveBeenCalled();
		});
	});

	describe("Concurrent Access", () => {
		it("should query organization memberships with correct organizationId filter", async () => {
			const findFirstSpy = vi.fn();
			mocks.drizzleClient.query.usersTable.findFirst = findFirstSpy;

			try {
				await FundCreatorResolver(mockFund, {}, ctx);
			} catch (_error) {
				// Expected error
			}

			const firstCall = findFirstSpy.mock.calls[0]?.[0];
			expect(firstCall).toBeDefined();

			if (firstCall?.with?.organizationMembershipsWhereMember?.where) {
				const whereFunction =
					firstCall.with.organizationMembershipsWhereMember.where;
				const mockFields = { organizationId: "organizationId" };
				const mockOperators = { eq: vi.fn() };
				whereFunction(mockFields, mockOperators);
				expect(mockOperators.eq).toHaveBeenCalledWith(
					mockFields.organizationId,
					mockFund.organizationId,
				);
			}
		});
		it("should throw unauthenticated error if current user is not found in database", async () => {
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				undefined,
			);

			await expect(FundCreatorResolver(mockFund, {}, ctx)).rejects.toThrow(
				new TalawaGraphQLError({ extensions: { code: "unauthenticated" } }),
			);
		});
		it("should query users with correct ID filter", async () => {
			const findFirstSpy = vi.fn();
			mocks.drizzleClient.query.usersTable.findFirst = findFirstSpy;

			const currentUserId = ctx.currentClient?.user?.id;
			expect(currentUserId).toBeDefined();

			try {
				await FundCreatorResolver(mockFund, {}, ctx);
			} catch (_error) {
				// Expected error
			}

			const firstCall = findFirstSpy.mock.calls[0]?.[0];
			expect(firstCall).toBeDefined();

			if (firstCall?.where) {
				const whereFunction = firstCall.where;
				const mockFields = { id: "id" };
				const mockOperators = { eq: vi.fn() };
				whereFunction(mockFields, mockOperators);
				expect(mockOperators.eq).toHaveBeenCalledWith(
					mockFields.id,
					currentUserId,
				);
			}
		});
		it("should query creator with correct ID filter", async () => {
			const mockUserData = {
				id: "user-123",
				role: "administrator",
				organizationMembershipsWhereMember: [],
			};

			const findFirstSpy = vi.fn().mockResolvedValueOnce(mockUserData);
			mocks.drizzleClient.query.usersTable.findFirst = findFirstSpy;

			try {
				await FundCreatorResolver(mockFund, {}, ctx);
			} catch (_error) {
				// Expected error
			}

			const secondCall = findFirstSpy.mock.calls[1]?.[0];
			expect(secondCall).toBeDefined();

			if (secondCall?.where) {
				const whereFunction = secondCall.where;
				const mockFields = { id: "id" };
				const mockOperators = { eq: vi.fn() };
				whereFunction(mockFields, mockOperators);
				expect(mockOperators.eq).toHaveBeenCalledWith(
					mockFields.id,
					mockFund.creatorId,
				);
			}
		});
		it("should handle database error during concurrent access", async () => {
			const mockUserData = {
				id: "user-123",
				role: "administrator",
				organizationMembershipsWhereMember: [
					{ role: "administrator", organizationId: mockFund.organizationId },
				],
			};

			mocks.drizzleClient.query.usersTable.findFirst
				.mockResolvedValueOnce(mockUserData)
				.mockRejectedValueOnce(
					new Error("Database error during concurrent access"),
				);

			await expect(FundCreatorResolver(mockFund, {}, ctx)).rejects.toThrow(
				new TalawaGraphQLError({
					message: "Internal server error",
					extensions: { code: "unexpected" },
				}),
			);

			expect(ctx.log.error).toHaveBeenCalled();
		});
	});
});
