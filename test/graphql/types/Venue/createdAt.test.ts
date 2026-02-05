import { faker } from "@faker-js/faker";
import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import { resolveCreatedAt } from "~/src/graphql/types/Venue/createdAt";
import type { Venue as VenueType } from "~/src/graphql/types/Venue/Venue";

describe("Venue Resolver - createdAt Field", () => {
	let ctx: GraphQLContext;
	let mocks: ReturnType<typeof createMockGraphQLContext>["mocks"];
	let mockVenue: VenueType;
	let userId: string;

	beforeEach(() => {
		const venueId = faker.string.uuid();
		const organizationId = faker.string.uuid();
		userId = faker.string.uuid();
		mockVenue = {
			id: venueId,
			organizationId,
			name: "Test Venue",
			description: "Test Venue Description",
			capacity: 100,
			creatorId: faker.string.uuid(),
			updaterId: null,
			createdAt: new Date("2024-01-01T09:00:00Z"),
			updatedAt: new Date("2024-01-01T10:00:00Z"),
			attachments: null,
		};

		const result = createMockGraphQLContext(true, userId);
		ctx = result.context;
		mocks = result.mocks;
		vi.clearAllMocks();
	});

	it("throws unauthenticated when client is not authenticated", async () => {
		const unauth = createMockGraphQLContext(false, faker.string.uuid());

		await expect(
			resolveCreatedAt(mockVenue, {}, unauth.context),
		).rejects.toMatchObject({
			extensions: { code: "unauthenticated" },
		});

		expect(
			unauth.mocks.drizzleClient.query.usersTable.findFirst,
		).not.toHaveBeenCalled();
	});

	it("throws unauthenticated when current user is not found", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
			undefined,
		);

		await expect(resolveCreatedAt(mockVenue, {}, ctx)).rejects.toMatchObject({
			extensions: { code: "unauthenticated" },
		});
	});

	it("throws unauthorized_action when user is regular and has no org membership", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce({
			id: userId,
			role: "regular",
			organizationMembershipsWhereMember: [],
		} as never);

		await expect(resolveCreatedAt(mockVenue, {}, ctx)).rejects.toMatchObject({
			extensions: { code: "unauthorized_action" },
		});
	});

	it("throws unauthorized_action when user is regular and org member but not admin", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce({
			id: userId,
			role: "regular",
			organizationMembershipsWhereMember: [{ role: "regular" }],
		} as never);

		await expect(resolveCreatedAt(mockVenue, {}, ctx)).rejects.toMatchObject({
			extensions: { code: "unauthorized_action" },
		});
	});

	it("returns parent.createdAt when user is system administrator", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce({
			id: userId,
			role: "administrator",
			organizationMembershipsWhereMember: [],
		} as never);

		const result = await resolveCreatedAt(mockVenue, {}, ctx);

		expect(result).toEqual(mockVenue.createdAt);
		expect(result).toBe(mockVenue.createdAt);
	});

	it("returns parent.createdAt when user is organization administrator", async () => {
		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce({
			id: userId,
			role: "regular",
			organizationMembershipsWhereMember: [{ role: "administrator" }],
		} as never);

		const result = await resolveCreatedAt(mockVenue, {}, ctx);

		expect(result).toEqual(mockVenue.createdAt);
		expect(result).toBe(mockVenue.createdAt);
	});

	it("returns correct createdAt value for successful resolution", async () => {
		const createdAt = new Date("2023-06-15T14:30:00Z");
		const venueWithCustomDate: VenueType = {
			...mockVenue,
			id: faker.string.uuid(),
			organizationId: faker.string.uuid(),
			createdAt,
		};

		mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce({
			id: userId,
			role: "administrator",
			organizationMembershipsWhereMember: [],
		} as never);

		const result = await resolveCreatedAt(venueWithCustomDate, {}, ctx);

		expect(result).toEqual(createdAt);
		expect(result).toBe(createdAt);
	});

	it("registers createdAt field on Venue type", () => {
		// Venue.implement runs when this file loads (import at top); this test ensures that path is exercised.
		expect(resolveCreatedAt).toBeDefined();
		expect(typeof resolveCreatedAt).toBe("function");
	});
});
