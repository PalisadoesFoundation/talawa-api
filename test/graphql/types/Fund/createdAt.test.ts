import { GraphQLObjectType } from "graphql";
import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import { schema } from "~/src/graphql/schema";
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

describe("Fund CreatedAt Resolver Tests", () => {
	let ctx: GraphQLContext;
	let mockFund: FundType;
	let mocks: ReturnType<typeof createMockGraphQLContext>["mocks"];
	let createdAtResolver: (
		parent: FundType,
		args: Record<string, never>,
		ctx: GraphQLContext,
	) => Date | Promise<Date>;

	beforeEach(async () => {
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

		const module = await import("~/src/graphql/types/Fund/createdAt");
		createdAtResolver = module.createdAtResolver;
	});

	describe("GraphQL Schema - Fund Field Config", () => {
		it("should include complexity value from envConfig", () => {
			const fundType = schema.getType("Fund");
			expect(fundType).toBeInstanceOf(GraphQLObjectType);

			const fields = (fundType as GraphQLObjectType).getFields();
			const createdAtField = fields.createdAt;
			expect(createdAtField).toHaveProperty("complexity");

			const fieldWithComplexity = createdAtField as typeof createdAtField & {
				complexity?: number;
			};
			expect(fieldWithComplexity.complexity).toBe(1);
		});
	});

	describe("Authentication and Authorization", () => {
		it("should throw unauthenticated error if user is not logged in", async () => {
			ctx.currentClient.isAuthenticated = false;

			await expect(createdAtResolver(mockFund, {}, ctx)).rejects.toThrow(
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

			await expect(createdAtResolver(mockFund, {}, ctx)).rejects.toThrow(
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

			await expect(createdAtResolver(mockFund, {}, ctx)).rejects.toThrow(
				new TalawaGraphQLError({ extensions: { code: "unauthorized_action" } }),
			);
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

			const result = await createdAtResolver(mockFund, {}, ctx);
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

			const result = await createdAtResolver(mockFund, {}, ctx);
			expect(result).toEqual(mockFund.createdAt);
		});
	});

	describe("CreatedAt Retrieval Tests", () => {
		it("should return the correct createdAt date", async () => {
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

			const result = await createdAtResolver(mockFund, {}, ctx);
			expect(result).toEqual(mockFund.createdAt);
		});
	});

	describe("Error Handling", () => {
		it("should handle database connection error", async () => {
			mocks.drizzleClient.query.usersTable.findFirst.mockRejectedValue(
				new Error("Database connection failed"),
			);

			await expect(createdAtResolver(mockFund, {}, ctx)).rejects.toThrow(
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

			await expect(createdAtResolver(mockFund, {}, ctx)).rejects.toThrow(
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
				await createdAtResolver(mockFund, {}, ctx);
			} catch {}

			const firstCall = findFirstSpy.mock.calls[0]?.[0];
			expect(firstCall).toBeDefined();

			const nestedWhere =
				firstCall?.with?.organizationMembershipsWhereMember?.where;
			expect(nestedWhere).toBeDefined();

			if (nestedWhere) {
				const mockFields = { organizationId: "organizationId" };
				const mockOperators = { eq: vi.fn() };
				nestedWhere(mockFields, mockOperators);
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
				await createdAtResolver(mockFund, {}, ctx);
			} catch {}

			const firstCall = findFirstSpy.mock.calls[0]?.[0];
			expect(firstCall).toBeDefined();

			const idWhere = firstCall?.where;
			expect(idWhere).toBeDefined();

			if (idWhere) {
				const mockFields = { id: "id" };
				const mockOperators = { eq: vi.fn() };
				idWhere(mockFields, mockOperators);
				expect(mockOperators.eq).toHaveBeenCalledWith(
					mockFields.id,
					currentUserId,
				);
			}
		});

		it("should handle database error during concurrent access", async () => {
			mocks.drizzleClient.query.usersTable.findFirst.mockRejectedValue(
				new Error("Database error during concurrent access"),
			);

			await expect(createdAtResolver(mockFund, {}, ctx)).rejects.toThrow(
				new TalawaGraphQLError({
					message: "Internal server error",
					extensions: { code: "unexpected" },
				}),
			);
			expect(ctx.log.error).toHaveBeenCalled();
		});
	});
});
