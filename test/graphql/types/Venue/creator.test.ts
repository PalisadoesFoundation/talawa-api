import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import { venueCreator } from "~/src/graphql/types/Venue/creator";
import type { Venue } from "~/src/graphql/types/Venue/Venue";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

// Tests section
describe("Venue Resolver - Creator Field", () => {
	let ctx: GraphQLContext;
	let mockVenue: Venue;
	let mocks: ReturnType<typeof createMockGraphQLContext>["mocks"];

	beforeEach(() => {
		mockVenue = {
			id: "venue-123",
			name: "Test Venue",
			description: "Test Description",
			creatorId: "user-123",
			organizationId: "org-123",
		} as Venue;

		const { context, mocks: newMocks } = createMockGraphQLContext(
			true,
			"user-123",
		);
		ctx = context;
		mocks = newMocks;
		vi.clearAllMocks();
	});

	it("should throw unauthenticated error if user is not logged in", async () => {
		const { context: unauthenticatedCtx } = createMockGraphQLContext(false);
		await expect(async () => {
			await venueCreator(mockVenue, {}, unauthenticatedCtx);
		}).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: { code: "unauthenticated" },
			}),
		);
	});

	it("should throw unauthenticated error if user is not logged in", async () => {
		const { context: unauthenticatedCtx } = createMockGraphQLContext(false);

		await expect(async () => {
			await venueCreator(mockVenue, {}, unauthenticatedCtx);
		}).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: { code: "unauthenticated" },
			}),
		);
	});

	it("should throw unauthenticated error if current user is not found", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(undefined);

		await expect(async () => {
			await venueCreator(mockVenue, {}, ctx);
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

		const result = await venueCreator(mockVenue, {}, ctx);
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

		const result = await venueCreator(mockVenue, {}, ctx);
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
			await venueCreator(mockVenue, {}, ctx);
		}).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: { code: "unauthorized_action" },
			}),
		);
	});

	it("should return null if venue has no creator", async () => {
		mockVenue.creatorId = null;
		const mockUser = {
			id: "user-123",
			role: "administrator",
			organizationMembershipsWhereMember: [],
		};
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
			mockUser,
		);

		const result = await venueCreator(mockVenue, {}, ctx);
		expect(result).toBeNull();
	});

	it("should return current user if they are the creator", async () => {
		const mockUser = {
			id: "user-123",
			role: "administrator",
			organizationMembershipsWhereMember: [],
		};
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
			mockUser,
		);

		const result = await venueCreator(mockVenue, {}, ctx);
		expect(result).toEqual(mockUser);
	});

	it("should fetch and return creator if different from current user ", async () => {
		const currentUser = {
			id: "user-123",
			role: "administrator",
			organizationMembershipsWhereMember: [],
		};
		const creatorUser = {
			id: "creator-456",
			role: "member",
			organizationMembershipsWhereMember: [],
		};

		mockVenue.creatorId = "creator-456";
		mocks.drizzleClient.query.usersTable.findFirst
			.mockResolvedValueOnce(currentUser)
			.mockResolvedValueOnce(creatorUser);

		const result = await venueCreator(mockVenue, {}, ctx);
		expect(result).toEqual(creatorUser);
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
			await venueCreator(mockVenue, {}, ctx);
		}).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: { code: "unauthorized_action" },
			}),
		);
	});

	it("should handle undefined organization membership role", async () => {
		const mockUser = {
			id: "user-123",
			role: "member",
			organizationMembershipsWhereMember: [{ role: undefined }],
		};
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
			mockUser,
		);

		await expect(async () => {
			await venueCreator(mockVenue, {}, ctx);
		}).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: { code: "unauthorized_action" },
			}),
		);
	});
	it("should log an error and throw an unexpected error if the creator does not exist in the database", async () => {
		const mockCurrentUser = {
			id: "user-123",
			role: "administrator",
			organizationMembershipsWhereMember: [
				{ role: "administrator", organizationId: "org-123" },
			],
		};

		// Set a creator ID that does not exist in the database
		mockVenue.creatorId = "random-123";

		mocks.drizzleClient.query.usersTable.findFirst
			.mockResolvedValueOnce(mockCurrentUser) // First query: user exists
			.mockResolvedValueOnce(undefined); // Second query: creator does NOT exist

		const logErrorSpy = vi.spyOn(ctx.log, "error");

		await expect(venueCreator(mockVenue, {}, ctx)).rejects.toThrow(
			new TalawaGraphQLError({
				extensions: { code: "unexpected" },
			}),
		);

		expect(logErrorSpy).toHaveBeenCalledWith(
			"Postgres select operation returned an empty array for a venue's creator id that isn't null.",
		);
	});
});
