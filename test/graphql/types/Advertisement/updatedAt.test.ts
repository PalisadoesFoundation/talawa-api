import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { beforeEach, describe, expect, it } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import type { Advertisement as AdvertisementType } from "~/src/graphql/types/Advertisement/Advertisement";
import { advertisementUpdatedAtResolver } from "~/src/graphql/types/Advertisement/updatedAt";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

type MockUser = {
	id: string;
	role: string;
	organizationMembershipsWhereMember: Array<{
		role: string;
		organizationId: string;
	}>;
};

describe("Advertisement Updated At Resolver Tests", () => {
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
			updatedAt: new Date("2024-02-05T12:00:00Z"),
		} as AdvertisementType;
	});

	describe("Authentication and Authorization", () => {
		it("should throw unauthenticated error if user is not logged in", async () => {
			ctx.currentClient.isAuthenticated = false;
			await expect(
				advertisementUpdatedAtResolver(mockAdvertisement, {}, ctx),
			).rejects.toThrowError(
				new TalawaGraphQLError({ extensions: { code: "unauthenticated" } }),
			);
			expect(
				ctx.drizzleClient.query.usersTable.findFirst,
			).not.toHaveBeenCalled();
		});

		it("should throw unauthenticated error if user exists but current user doesn't exist", async () => {
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				undefined,
			);

			await expect(
				advertisementUpdatedAtResolver(mockAdvertisement, {}, ctx),
			).rejects.toThrowError(
				new TalawaGraphQLError({ extensions: { code: "unauthenticated" } }),
			);
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
				advertisementUpdatedAtResolver(mockAdvertisement, {}, ctx),
			).rejects.toThrowError(TalawaGraphQLError);
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
				advertisementUpdatedAtResolver(mockAdvertisement, {}, ctx),
			).rejects.toThrowError(
				new TalawaGraphQLError({ extensions: { code: "unauthorized_action" } }),
			);
		});
	});

	describe("Successful Access Cases", () => {
		it("should return updatedAt if user is system administrator", async () => {
			const mockUserData: MockUser = {
				id: "user-123",
				role: "administrator",
				organizationMembershipsWhereMember: [],
			};
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				mockUserData,
			);

			const result = await advertisementUpdatedAtResolver(
				mockAdvertisement,
				{},
				ctx,
			);
			expect(result).toBe(mockAdvertisement.updatedAt);
		});

		it("should return updatedAt if user is organization administrator", async () => {
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

			const result = await advertisementUpdatedAtResolver(
				mockAdvertisement,
				{},
				ctx,
			);
			expect(result).toBe(mockAdvertisement.updatedAt);
		});
	});

	describe("Error Handling", () => {
		it("should handle database query failures", async () => {
			mocks.drizzleClient.query.usersTable.findFirst.mockRejectedValue(
				new Error("Database error"),
			);

			await expect(
				advertisementUpdatedAtResolver(mockAdvertisement, {}, ctx),
			).rejects.toThrowError(
				new TalawaGraphQLError({
					message: "Internal server error",
					extensions: { code: "unexpected" },
				}),
			);
		});
		it("should handle case-sensitive role checks", async () => {
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
				role: "Administrator",
				organizationMembershipsWhereMember: [],
			});

			await expect(async () => {
				await advertisementUpdatedAtResolver(mockAdvertisement, {}, ctx);
			}).rejects.toThrow(
				new TalawaGraphQLError({
					extensions: { code: "unauthorized_action" },
				}),
			);
		});
		it("should throw data_integrity_error if advertisement has no updatedAt value", async () => {
			mockAdvertisement.updatedAt = null;
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

			await expect(
				advertisementUpdatedAtResolver(mockAdvertisement, {}, ctx),
			).rejects.toThrow(
				new TalawaGraphQLError({
					message: "Missing updatedAt value for the advertisement",
					extensions: { code: "unexpected" },
				}),
			);
		});

		it("should throw unexpected error if database query returns null values", async () => {
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				null as unknown as Record<string, unknown>,
			);
			await expect(
				advertisementUpdatedAtResolver(mockAdvertisement, {}, ctx),
			).rejects.toThrowError(
				new TalawaGraphQLError({
					message: "Internal server error",
					extensions: { code: "unexpected" },
				}),
			);
		});
	});
});
