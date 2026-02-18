import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import { resolveUpdater } from "~/src/graphql/types/Venue/updater";
import type { Venue as VenueType } from "~/src/graphql/types/Venue/Venue";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

describe("Venue Resolver - Updater Field", () => {
	let ctx: GraphQLContext;
	let mockVenue: VenueType;
	let mocks: ReturnType<typeof createMockGraphQLContext>["mocks"];

	beforeEach(() => {
		mockVenue = {
			id: "venue-123",
			name: "Test Venue",
			description: "Test Description",
			updaterId: "user-123",
			organizationId: "org-123",
		} as VenueType;

		const { context, mocks: newMocks } = createMockGraphQLContext(
			true,
			"user-123",
		);
		ctx = context;
		mocks = newMocks;
	});

	it("should throw unauthenticated error if user is not logged in", async () => {
		const { context: unauthenticatedCtx } = createMockGraphQLContext(false);
		await expect(async () => {
			await resolveUpdater(mockVenue, {}, unauthenticatedCtx);
		}).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: { code: "unauthenticated" },
			}),
		);
	});

	it("should throw unauthenticated error if current user is not found", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(undefined);

		await expect(async () => {
			await resolveUpdater(mockVenue, {}, ctx);
		}).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: { code: "unauthenticated" },
			}),
		);
	});

	it("should allow access if user is system administrator", async () => {
		const mockUser = {
			id: "user-123",
			role: "administrator",
			organizationMembershipsWhereMember: [],
		};
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
			mockUser,
		);

		const result = await resolveUpdater(mockVenue, {}, ctx);
		expect(result).toEqual(mockUser);
	});

	it("should allow access if user is organization administrator", async () => {
		const mockUser = {
			id: "user-123",
			role: "member",
			organizationMembershipsWhereMember: [
				{
					role: "administrator",
				},
			],
		};
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
			mockUser,
		);

		const result = await resolveUpdater(mockVenue, {}, ctx);
		expect(result).toEqual(mockUser);
	});

	it("should throw unauthorized error if user is not an administrator", async () => {
		const mockUser = {
			id: "user-123",
			role: "member",
			organizationMembershipsWhereMember: [
				{
					role: "member",
				},
			],
		};
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
			mockUser,
		);

		await expect(async () => {
			await resolveUpdater(mockVenue, {}, ctx);
		}).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: { code: "unauthorized_action" },
			}),
		);
	});

	it("should return null if venue has no updater", async () => {
		mockVenue.updaterId = null;
		const mockUser = {
			id: "user-123",
			role: "administrator",
			organizationMembershipsWhereMember: [],
		};
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
			mockUser,
		);

		const result = await resolveUpdater(mockVenue, {}, ctx);
		expect(result).toBeNull();
	});

	it("should return current user if they are the updater", async () => {
		const mockUser = {
			id: "user-123",
			role: "administrator",
			organizationMembershipsWhereMember: [],
		};
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
			mockUser,
		);

		const result = await resolveUpdater(mockVenue, {}, ctx);
		expect(result).toEqual(mockUser);
	});

	it("should fetch and return updater if different from current user", async () => {
		const currentUser = {
			id: "user-123",
			role: "administrator",
			organizationMembershipsWhereMember: [],
		};
		const updaterUser = {
			id: "updater-456",
			role: "member",
			organizationMembershipsWhereMember: [],
		};

		mockVenue.updaterId = "updater-456";
		mocks.drizzleClient.query.usersTable.findFirst

			.mockResolvedValueOnce(currentUser)
			.mockResolvedValueOnce(updaterUser);

		const result = await resolveUpdater(mockVenue, {}, ctx);
		expect(result).toEqual(updaterUser);
	});

	it("should handle empty organization memberships array", async () => {
		const mockUser = {
			id: "user-123",
			role: "member",
			organizationMembershipsWhereMember: [],
		};
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
			mockUser,
		);

		await expect(async () => {
			await resolveUpdater(mockVenue, {}, ctx);
		}).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: { code: "unauthorized_action" },
			}),
		);
	});

	it("should throw unexpected error if updater user does not exist", async () => {
		const currentUser = {
			id: "user-123",
			role: "administrator",
			organizationMembershipsWhereMember: [],
		};

		mockVenue.updaterId = "updater-456";
		mocks.drizzleClient.query.usersTable.findFirst

			.mockResolvedValueOnce(currentUser)
			.mockResolvedValueOnce(undefined);

		await expect(async () => {
			await resolveUpdater(mockVenue, {}, ctx);
		}).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: { code: "unexpected" },
			}),
		);
	});

	it("should query the database with the correct organizationId filter", async () => {
		const mockUser = {
			id: "user-123",
			role: "administrator",
			organizationMembershipsWhereMember: [
				{ role: "administrator", organizationId: mockVenue.organizationId },
			],
		};

		// Mock implementation to verify if organizationId filter is used
		(
			mocks.drizzleClient.query.usersTable.findFirst as ReturnType<typeof vi.fn>
		).mockImplementation(({ with: withClause }) => {
			expect(withClause).toBeDefined();

			const mockFields = { organizationId: "org-123" };
			const mockOperators = { eq: vi.fn((a, b) => ({ [a]: b })) };

			// Verify the inner where clause inside withClause
			const innerWhereResult =
				withClause.organizationMembershipsWhereMember.where(
					mockFields,
					mockOperators,
				);
			expect(innerWhereResult).toEqual(
				expect.objectContaining({
					[mockFields.organizationId]: mockVenue.organizationId, // Ensure organizationId filter is applied
				}),
			);
			return Promise.resolve(mockUser);
		});

		const result = await resolveUpdater(mockVenue, {}, ctx);
		expect(result).toEqual(mockUser);
	});
});
