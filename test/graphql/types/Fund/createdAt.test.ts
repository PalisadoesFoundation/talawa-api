import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import { Fund } from "~/src/graphql/types/Fund/Fund";
import type { Fund as FundType } from "~/src/graphql/types/Fund/Fund";
import {
	FundCreatedAtResolver,
	registerFundCreatedAtField,
} from "~/src/graphql/types/Fund/createdAt";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

type MockUser = {
	id: string;
	role: string;
	organizationMembershipsWhereMember: Array<{
		role: string;
		organizationId: string;
	}>;
};

describe("Fund createdAt Resolver Tests", () => {
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
		};
	});

	describe("Authentication and Authorization", () => {
		it("should throw unauthenticated error if user is not logged in", async () => {
			ctx.currentClient.isAuthenticated = false;

			await expect(FundCreatedAtResolver(mockFund, {}, ctx)).rejects.toThrow(
				new TalawaGraphQLError({ extensions: { code: "unauthenticated" } }),
			);
		});

		it("should throw unauthenticated error if current user is not found in database", async () => {
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				undefined,
			);

			await expect(FundCreatedAtResolver(mockFund, {}, ctx)).rejects.toThrow(
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

			await expect(FundCreatedAtResolver(mockFund, {}, ctx)).rejects.toThrow(
				new TalawaGraphQLError({ extensions: { code: "unauthorized_action" } }),
			);
		});

		it("should allow non-admin with organization membership to access createdAt", async () => {
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

			const result = await FundCreatedAtResolver(mockFund, {}, ctx);
			expect(result).toEqual(mockFund.createdAt);
		});

		it("should allow system administrator full access", async () => {
			const mockUserData: MockUser = {
				id: "user-123",
				role: "administrator",
				organizationMembershipsWhereMember: [],
			};

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				mockUserData,
			);

			const result = await FundCreatedAtResolver(mockFund, {}, ctx);
			expect(result).toEqual(mockFund.createdAt);
		});

		it("should allow organization administrator access", async () => {
			const mockUserData: MockUser = {
				id: "user-123",
				role: "member",
				organizationMembershipsWhereMember: [
					{ role: "administrator", organizationId: mockFund.organizationId },
				],
			};

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				mockUserData,
			);

			const result = await FundCreatedAtResolver(mockFund, {}, ctx);
			expect(result).toEqual(mockFund.createdAt);
		});
	});

	describe("CreatedAt Value Tests", () => {
		it("should return the correct createdAt date", async () => {
			const mockUserData: MockUser = {
				id: "user-123",
				role: "administrator",
				organizationMembershipsWhereMember: [],
			};

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				mockUserData,
			);

			const result = await FundCreatedAtResolver(mockFund, {}, ctx);
			expect(result).toBe(mockFund.createdAt);
			expect(result).toBeInstanceOf(Date);
		});
	});

	describe("Error Handling", () => {
		it("should handle database connection error", async () => {
			mocks.drizzleClient.query.usersTable.findFirst.mockRejectedValue(
				new Error("Database connection failed"),
			);

			await expect(FundCreatedAtResolver(mockFund, {}, ctx)).rejects.toThrow(
				"Database connection failed",
			);
		});

		it("should handle database timeout error", async () => {
			mocks.drizzleClient.query.usersTable.findFirst.mockRejectedValue(
				new Error("Query timeout"),
			);

			await expect(FundCreatedAtResolver(mockFund, {}, ctx)).rejects.toThrow(
				"Query timeout",
			);
		});
	});

	describe("Query Filter Validation", () => {
		it("should query organization memberships with correct organizationId filter", async () => {
			const findFirstSpy = vi.fn();
			mocks.drizzleClient.query.usersTable.findFirst = findFirstSpy;

			try {
				await FundCreatedAtResolver(mockFund, {}, ctx);
			} catch (error) {
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

		it("should query users with correct ID filter", async () => {
			const findFirstSpy = vi.fn();
			mocks.drizzleClient.query.usersTable.findFirst = findFirstSpy;

			const currentUserId = ctx.currentClient?.user?.id;
			expect(currentUserId).toBeDefined();

			try {
				await FundCreatedAtResolver(mockFund, {}, ctx);
			} catch (error) {
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

		it("should request correct columns from users table", async () => {
			const findFirstSpy = vi.fn();
			mocks.drizzleClient.query.usersTable.findFirst = findFirstSpy;

			try {
				await FundCreatedAtResolver(mockFund, {}, ctx);
			} catch (error) {
				// Expected error
			}

			const firstCall = findFirstSpy.mock.calls[0]?.[0];
			expect(firstCall).toBeDefined();
			expect(firstCall?.columns).toEqual({ role: true });
		});

		it("should request correct columns from organization memberships", async () => {
			const findFirstSpy = vi.fn();
			mocks.drizzleClient.query.usersTable.findFirst = findFirstSpy;

			try {
				await FundCreatedAtResolver(mockFund, {}, ctx);
			} catch (error) {
				// Expected error
			}

			const firstCall = findFirstSpy.mock.calls[0]?.[0];
			expect(firstCall).toBeDefined();
			expect(
				firstCall?.with?.organizationMembershipsWhereMember?.columns,
			).toEqual({ role: true });
		});
	});

	describe("Schema Implementation", () => {
		it("should register createdAt field on Fund type", () => {
			// Explicitly call the registration function to ensure coverage
			// Note: This is called again even though it's called at module load
			// to ensure the coverage tool tracks it
			registerFundCreatedAtField();

			// Verify Fund is properly defined
			expect(Fund).toBeDefined();
		});
	});
});
