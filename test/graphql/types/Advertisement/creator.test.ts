import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import type { Advertisement as AdvertisementType } from "~/src/graphql/types/Advertisement/Advertisement";
import { advertisementCreator } from "~/src/graphql/types/Advertisement/creator";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

type UserType = {
	id: string;
	role: string;
	organizationMembershipsWhereMember: Array<{
		role: string;
		organizationId: string;
	}>;
	createdAt?: Date;
	updatedAt?: Date | null;
};

describe("Advertisement Resolver - Creator Field", () => {
	let ctx: GraphQLContext;
	let mockAdvertisement: AdvertisementType;
	let mocks: ReturnType<typeof createMockGraphQLContext>["mocks"];

	//reusable mock users
	const adminUser: UserType = {
		id: "admin-123",
		role: "administrator",
		organizationMembershipsWhereMember: [
			{ role: "administrator", organizationId: "org-123" },
		],
		createdAt: new Date(),
		updatedAt: null,
	};

	const memberUser: UserType = {
		id: "member-123",
		role: "member",
		organizationMembershipsWhereMember: [
			{ role: "member", organizationId: "org-123" },
		],
		createdAt: new Date(),
		updatedAt: null,
	};

	const nonMemberUser: UserType = {
		id: "nonmember-123",
		role: "member",
		organizationMembershipsWhereMember: [],
		createdAt: new Date(),
		updatedAt: null,
	};

	beforeEach(() => {
		const { context, mocks: newMocks } = createMockGraphQLContext(
			true,
			"user-123",
		);
		ctx = context;
		mocks = newMocks;

		mockAdvertisement = {
			id: "advert-123",
			name: "Test Advertisement",
			createdAt: new Date(),
			updatedAt: null,
			creatorId: "member-123",
			updaterId: null,
			description: "Test description",
			endAt: new Date(),
			startAt: new Date(),
			type: "banner",
			organizationId: "org-123",
			attachments: [],
		};
	});

	it("should throw unauthenticated error if the user is not logged in", async () => {
		ctx.currentClient.isAuthenticated = false;

		await expect(async () => {
			await advertisementCreator(mockAdvertisement, {}, ctx);
		}).rejects.toThrow(
			new TalawaGraphQLError({
				message: "You must be authenticated to perform this action.",
				extensions: { code: "unauthenticated" },
			}),
		);
	});

	it("should throw unauthenticated error if the current user does not exist", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(undefined);

		await expect(async () => {
			await advertisementCreator(mockAdvertisement, {}, ctx);
		}).rejects.toThrow(
			new TalawaGraphQLError({
				message: "You must be authenticated to perform this action.",
				extensions: { code: "unauthenticated" },
			}),
		);
	});

	it("should throw unauthorized error if the user is not an admin or organization admin", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			...nonMemberUser,
			id: "user-123",
		});

		await expect(async () => {
			await advertisementCreator(mockAdvertisement, {}, ctx);
		}).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: { code: "unauthorized_action" },
			}),
		);
	});

	it("should allow access if user is a global administrator", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			...adminUser,
			id: "user-123",
		});

		const result = await advertisementCreator(mockAdvertisement, {}, ctx);
		expect(result?.id).toBe("user-123");
	});

	it("should allow access if user is an organization administrator", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			...memberUser,
			id: "user-123",
			organizationMembershipsWhereMember: [
				{ role: "administrator", organizationId: "org-123" },
			],
		});

		const result = await advertisementCreator(mockAdvertisement, {}, ctx);
		expect(result?.id).toBe("user-123");
	});

	it("should allow access to own advertisement", async () => {
		// Mock the current user as the memberUser
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			...memberUser,
			id: "user-123",
			organizationMembershipsWhereMember: [
				{ role: "administrator", organizationId: "org-123" },
			],
		});

		//The creator is the current user, it skips the second call
		const result = await advertisementCreator(
			{ ...mockAdvertisement, creatorId: "user-123" },
			{},
			ctx,
		);

		expect(result?.id).toBe("user-123");
	});

	it("should handle a missing creator and return null", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			...adminUser,
			id: "user-123",
		});
		const result = await advertisementCreator(
			{ ...mockAdvertisement, creatorId: null },
			{},
			ctx,
		);

		expect(result).toBeNull();
	});

	it("should throw an error if the creator does not exist", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce({
			...adminUser,
			id: "user-123",
		});
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
			undefined,
		);
		// The resolver calls findFirst 2 times in this scenario. First for the current user, and second for the creator user id, since the current user has the right permissions
		await expect(async () => {
			await advertisementCreator(mockAdvertisement, {}, ctx);
		}).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: { code: "unexpected" },
			}),
		);
	});

	it("calls where function correctly", async () => {
		const currentUserId = "user-123";
		const creatorId = "member-123";
		const organizationId = "org-123";
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
			...adminUser,
			id: currentUserId,
		});

		await advertisementCreator(mockAdvertisement, {}, ctx);

		expect(
			mocks.drizzleClient.query.usersTable.findFirst,
		).toHaveBeenCalledTimes(2);

		const calls = (
			mocks.drizzleClient.query.usersTable.findFirst as ReturnType<typeof vi.fn>
		).mock.calls;
		expect(calls.length).toBe(2); // Ensure both calls happened

		// Extract first `where` function (fetching current user)
		const whereFn1 = calls[0]?.[0]?.where;
		expect(whereFn1).toBeDefined();

		// Extract second `where` function (fetching creator user)
		const whereFn2 = calls[1]?.[0]?.where;
		expect(whereFn2).toBeDefined();

		// Mock field conditions
		const mockFields = { id: currentUserId };
		const creatorFields = { id: creatorId };
		const mockOperators = { eq: vi.fn((a, b) => ({ field: a, value: b })) };

		// Call first `where` function (current user)
		whereFn1(mockFields, mockOperators);
		expect(mockOperators.eq).toHaveBeenCalledWith(mockFields.id, currentUserId);

		// Call second `where` function (creator user)
		whereFn2(creatorFields, mockOperators);
		expect(mockOperators.eq).toHaveBeenCalledWith(creatorFields.id, creatorId);

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
