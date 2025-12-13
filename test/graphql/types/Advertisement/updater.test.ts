import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import type { Advertisement as AdvertisementType } from "~/src/graphql/types/Advertisement/Advertisement";
import { advertisementUpdaterResolver } from "~/src/graphql/types/Advertisement/updater";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

type MockUser = {
	id: string;
	role: string;
	organizationMembershipsWhereMember: Array<{
		role: string;
		organizationId: string;
	}>;
};

describe("Advertisement Updater Resolver Tests", () => {
	let ctx: GraphQLContext;
	let mockAdvertisement: AdvertisementType;
	let mocks: ReturnType<typeof createMockGraphQLContext>["mocks"];

	beforeEach(() => {
		const { context, mocks: newMocks } = createMockGraphQLContext(
			true,
			"user-123",
		);
		ctx = context;
		mocks = newMocks;
		mockAdvertisement = {
			id: "adv-123",
			organizationId: "org-456",
			updaterId: "updater-789",
		} as AdvertisementType;
	});

	describe("Authentication and Authorization", () => {
		it("should throw unauthenticated error if user is not logged in", async () => {
			ctx.currentClient.isAuthenticated = false;
			await expect(
				advertisementUpdaterResolver(mockAdvertisement, {}, ctx),
			).rejects.toMatchObject({
				extensions: { code: "unauthenticated" },
			});
			expect(
				mocks.drizzleClient.query.usersTable.findFirst,
			).not.toHaveBeenCalled();
		});

		it("should throw unauthenticated error if authenticated but current user ID is missing", async () => {
			ctx.currentClient.isAuthenticated = true;
			ctx.currentClient.user = undefined;
			await expect(
				advertisementUpdaterResolver(mockAdvertisement, {}, ctx),
			).rejects.toMatchObject({
				extensions: { code: "unauthenticated" },
			});
			expect(
				mocks.drizzleClient.query.usersTable.findFirst,
			).not.toHaveBeenCalled();
		});

		it("should throw unauthenticated error if user exists but current user doesn't exist", async () => {
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				undefined,
			);

			await expect(
				advertisementUpdaterResolver(mockAdvertisement, {}, ctx),
			).rejects.toMatchObject({
				extensions: { code: "unauthenticated" },
			});
			expect(mocks.drizzleClient.query.usersTable.findFirst).toHaveBeenCalled();
		});

		it("should throw unauthorized_action for non-admin user with no organization membership", async () => {
			const mockUserData: MockUser = {
				id: "user-123",
				role: "member",
				organizationMembershipsWhereMember: [],
			};

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				mockUserData,
			);

			await expect(
				advertisementUpdaterResolver(mockAdvertisement, {}, ctx),
			).rejects.toMatchObject({
				extensions: { code: "unauthorized_action" },
			});
		});

		it("should throw unauthorized_action for non-admin user with regular membership", async () => {
			const mockUserData: MockUser = {
				id: "user-123",
				role: "member",
				organizationMembershipsWhereMember: [
					{ role: "member", organizationId: mockAdvertisement.organizationId },
				],
			};

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				mockUserData,
			);

			await expect(
				advertisementUpdaterResolver(mockAdvertisement, {}, ctx),
			).rejects.toMatchObject({
				extensions: { code: "unauthorized_action" },
			});
		});
	});

	describe("Successful Access Cases", () => {
		it("should return null if updaterId is null", async () => {
			const mockUserData: MockUser = {
				id: "user-123",
				role: "administrator",
				organizationMembershipsWhereMember: [],
			};

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				mockUserData,
			);

			mockAdvertisement.updaterId = null;

			const result = await advertisementUpdaterResolver(
				mockAdvertisement,
				{},
				ctx,
			);
			expect(result).toBeNull();
		});

		it("should return current user if updaterId matches with currentUserId", async () => {
			const mockUserData: MockUser = {
				id: "user-123",
				role: "member",
				organizationMembershipsWhereMember: [
					{
						role: "administrator",
						organizationId: mockAdvertisement.organizationId,
					},
				],
			};

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				mockUserData,
			);

			mockAdvertisement.updaterId = "user-123";
			const result = await advertisementUpdaterResolver(
				mockAdvertisement,
				{},
				ctx,
			);
			expect(result).toBe(mockUserData);
		});

		it("should return existing user if updaterId diff", async () => {
			const mockCurrentUser: MockUser = {
				id: "user-123",
				role: "administrator",
				organizationMembershipsWhereMember: [],
			};

			const mockTargetUpdater = { id: "updater-789", name: "Target User" };

			mocks.drizzleClient.query.usersTable.findFirst
				.mockResolvedValueOnce(mockCurrentUser)
				.mockResolvedValueOnce(mockTargetUpdater);
			const result = await advertisementUpdaterResolver(
				mockAdvertisement,
				{},
				ctx,
			);

			expect(result).toBe(mockTargetUpdater);
		});
	});

	describe("Error Handling", () => {
		it("should handle database query failures", async () => {
			mocks.drizzleClient.query.usersTable.findFirst.mockRejectedValue(
				new Error("Database error"),
			);

			await expect(
				advertisementUpdaterResolver(mockAdvertisement, {}, ctx),
			).rejects.toThrowError(
				new TalawaGraphQLError({
					message: "Internal server error",
					extensions: { code: "unexpected" },
				}),
			);
		});

		it("should throw unexpected error if updaterId exists but user not found (Data Corruption)", async () => {
			const mockUserData: MockUser = {
				id: "user-123",
				role: "administrator",
				organizationMembershipsWhereMember: [],
			};

			mocks.drizzleClient.query.usersTable.findFirst
				.mockResolvedValueOnce(mockUserData)
				.mockResolvedValueOnce(undefined);

			await expect(
				advertisementUpdaterResolver(mockAdvertisement, {}, ctx),
			).rejects.toMatchObject({
				extensions: { code: "unexpected" },
			});

			expect(ctx.log.error).toHaveBeenCalledWith(
				expect.stringContaining(
					"Postgres select operation returned an empty array",
				),
			);
		});

		it("should handle case-sensitive role checks", async () => {
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
				id: "user-123",
				role: "Administrator",
				organizationMembershipsWhereMember: [],
			});

			await expect(
				advertisementUpdaterResolver(mockAdvertisement, {}, ctx),
			).rejects.toMatchObject({
				extensions: { code: "unauthorized_action" },
			});
		});

		it("should throw unexpected error if database query returns null values", async () => {
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				null as unknown as Record<string, unknown>,
			);

			await expect(
				advertisementUpdaterResolver(mockAdvertisement, {}, ctx),
			).rejects.toThrowError(
				new TalawaGraphQLError({
					message: "Internal server error",
					extensions: { code: "unexpected" },
				}),
			);
		});
	});

	it("calls where function correctly", async () => {
		// Define mock user data
		const currentUserId = "user-123";
		const organizationId = mockAdvertisement.organizationId;

		const mockUserData = {
			id: currentUserId,
			role: "member",
			organizationMembershipsWhereMember: [
				{
					role: "administrator",
					organizationId: mockAdvertisement.organizationId,
				},
			],
		};

		mocks.drizzleClient.query.usersTable.findFirst
			.mockResolvedValueOnce(mockUserData)
			.mockResolvedValueOnce({ id: "updater-789" });

		await advertisementUpdaterResolver(mockAdvertisement, {}, ctx);

		const calls = (
			mocks.drizzleClient.query.usersTable.findFirst as ReturnType<typeof vi.fn>
		).mock.calls;

		const whereFn = calls[0]?.[0]?.where;
		expect(whereFn).toBeDefined();

		// Mock field conditions
		const mockFields = { id: currentUserId };
		const mockOperators = { eq: vi.fn((a, b) => ({ field: a, value: b })) };

		// Call `where` function (current user)
		whereFn(mockFields, mockOperators);
		expect(mockOperators.eq).toHaveBeenCalledWith(mockFields.id, currentUserId);

		// Validate `organizationMembershipsWhereMember`
		const withClause = calls[0]?.[0]?.with?.organizationMembershipsWhereMember;
		expect(withClause).toBeDefined();
		const whereFnOrg = withClause.where;
		expect(whereFnOrg).toBeDefined();

		// Call `where` for organizationMembershipsWhereMember
		const mockOrgFields = { organizationId };
		whereFnOrg(mockOrgFields, mockOperators);
		expect(mockOperators.eq).toHaveBeenCalledWith(
			mockOrgFields.organizationId,
			organizationId,
		);
	});
});
