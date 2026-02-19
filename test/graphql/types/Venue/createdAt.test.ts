import { faker } from "@faker-js/faker";
import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { afterEach, beforeAll, expect, suite, test, vi } from "vitest";
import { resolveCreatedAt } from "~/src/graphql/types/Venue/createdAt";
import type { Venue as VenueType } from "~/src/graphql/types/Venue/Venue";
import { assertToBeNonNullish } from "../../../helpers";
import { getAdminAuthViaRest } from "../../../helpers/adminAuthRest";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import { createRegularUserUsingAdmin } from "../createRegularUserUsingAdmin";
import {
	Mutation_createOrganization,
	Mutation_createOrganizationMembership,
	Mutation_createVenue,
	Query_venue_createdAt,
} from "../documentNodes";

let authToken: string;

beforeAll(async () => {
	const { accessToken } = await getAdminAuthViaRest(server);
	authToken = accessToken;
});

afterEach(() => {
	vi.restoreAllMocks();
});

suite("Venue Resolver - createdAt Field", () => {
	test("throws unauthenticated when client is not authenticated", async () => {
		const createOrgResult = await mercuriusClient.mutate(
			Mutation_createOrganization,
			{
				headers: { authorization: `Bearer ${authToken}` },
				variables: {
					input: {
						name: `Venue createdAt Test Org ${faker.string.uuid()}`,
						description: "Org to test venue createdAt unauthenticated",
					},
				},
			},
		);
		const orgId = createOrgResult.data?.createOrganization?.id;
		assertToBeNonNullish(orgId);

		const createVenueResult = await mercuriusClient.mutate(
			Mutation_createVenue,
			{
				headers: { authorization: `Bearer ${authToken}` },
				variables: {
					input: {
						organizationId: orgId,
						name: `Test Venue ${faker.string.uuid()}`,
						description: "Test venue for createdAt",
						capacity: 100,
					},
				},
			},
		);
		const venueId = createVenueResult.data?.createVenue?.id;
		assertToBeNonNullish(venueId);

		const findFirstSpy = vi.spyOn(
			server.drizzleClient.query.usersTable,
			"findFirst",
		);

		const result = await mercuriusClient.query(Query_venue_createdAt, {
			variables: { input: { id: venueId } },
		});

		expect(findFirstSpy).not.toHaveBeenCalled();
		expect(result.data?.venue).toBeNull();
		expect(result.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					extensions: expect.objectContaining({ code: "unauthenticated" }),
					path: ["venue"],
				}),
			]),
		);
	});

	test("throws unauthenticated when current user is not found", async () => {
		const createOrgResult = await mercuriusClient.mutate(
			Mutation_createOrganization,
			{
				headers: { authorization: `Bearer ${authToken}` },
				variables: {
					input: {
						name: `Venue createdAt Missing User Org ${faker.string.uuid()}`,
						description: "Org to test venue createdAt missing user",
					},
				},
			},
		);
		const orgId = createOrgResult.data?.createOrganization?.id;
		assertToBeNonNullish(orgId);

		const createVenueResult = await mercuriusClient.mutate(
			Mutation_createVenue,
			{
				headers: { authorization: `Bearer ${authToken}` },
				variables: {
					input: {
						organizationId: orgId,
						name: `Test Venue ${faker.string.uuid()}`,
						description: "Test venue for missing user",
						capacity: 100,
					},
				},
			},
		);
		const venueId = createVenueResult.data?.createVenue?.id;
		assertToBeNonNullish(venueId);

		const findFirstSpy = vi
			.spyOn(server.drizzleClient.query.usersTable, "findFirst")
			.mockResolvedValueOnce(undefined);

		const result = await mercuriusClient.query(Query_venue_createdAt, {
			headers: { authorization: `Bearer ${authToken}` },
			variables: { input: { id: venueId } },
		});

		expect(findFirstSpy).toHaveBeenCalled();
		expect(result.data?.venue).toBeNull();
		expect(result.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					extensions: expect.objectContaining({ code: "unauthenticated" }),
					path: ["venue"],
				}),
			]),
		);
	});

	test("throws unauthorized_action when user is regular and has no org membership", async () => {
		const createOrgResult = await mercuriusClient.mutate(
			Mutation_createOrganization,
			{
				headers: { authorization: `Bearer ${authToken}` },
				variables: {
					input: {
						name: `Venue createdAt No Membership Org ${faker.string.uuid()}`,
						description: "Org to test venue createdAt no membership",
					},
				},
			},
		);
		const orgId = createOrgResult.data?.createOrganization?.id;
		assertToBeNonNullish(orgId);

		const createVenueResult = await mercuriusClient.mutate(
			Mutation_createVenue,
			{
				headers: { authorization: `Bearer ${authToken}` },
				variables: {
					input: {
						organizationId: orgId,
						name: `Test Venue ${faker.string.uuid()}`,
						description: "Test venue for no membership",
						capacity: 100,
					},
				},
			},
		);
		const venueId = createVenueResult.data?.createVenue?.id;
		assertToBeNonNullish(venueId);

		const { authToken: regularToken } = await createRegularUserUsingAdmin();

		const result = await mercuriusClient.query(Query_venue_createdAt, {
			headers: { authorization: `Bearer ${regularToken}` },
			variables: { input: { id: venueId } },
		});

		expect(result.data?.venue).toBeNull();
		expect(result.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					extensions: expect.objectContaining({
						code: "unauthorized_action_on_arguments_associated_resources",
					}),
					path: ["venue"],
				}),
			]),
		);
	});

	test("throws unauthorized_action when user is regular and org member but not admin", async () => {
		const createOrgResult = await mercuriusClient.mutate(
			Mutation_createOrganization,
			{
				headers: { authorization: `Bearer ${authToken}` },
				variables: {
					input: {
						name: `Venue createdAt Regular Member Org ${faker.string.uuid()}`,
						description: "Org to test venue createdAt regular member",
					},
				},
			},
		);
		const orgId = createOrgResult.data?.createOrganization?.id;
		assertToBeNonNullish(orgId);

		const createVenueResult = await mercuriusClient.mutate(
			Mutation_createVenue,
			{
				headers: { authorization: `Bearer ${authToken}` },
				variables: {
					input: {
						organizationId: orgId,
						name: `Test Venue ${faker.string.uuid()}`,
						description: "Test venue for regular member",
						capacity: 100,
					},
				},
			},
		);
		const venueId = createVenueResult.data?.createVenue?.id;
		assertToBeNonNullish(venueId);

		const { authToken: memberToken, userId: memberUserId } =
			await createRegularUserUsingAdmin();

		await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
			headers: { authorization: `Bearer ${authToken}` },
			variables: {
				input: {
					organizationId: orgId,
					memberId: memberUserId,
					role: "regular",
				},
			},
		});

		const result = await mercuriusClient.query(Query_venue_createdAt, {
			headers: { authorization: `Bearer ${memberToken}` },
			variables: { input: { id: venueId } },
		});

		expect(result.data?.venue?.id).toBe(venueId);
		expect(result.data?.venue?.createdAt).toBeNull();
		expect(result.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					extensions: expect.objectContaining({
						code: "unauthorized_action",
					}),
					path: ["venue", "createdAt"],
				}),
			]),
		);
	});

	test("returns parent.createdAt when user is system administrator", async () => {
		const createOrgResult = await mercuriusClient.mutate(
			Mutation_createOrganization,
			{
				headers: { authorization: `Bearer ${authToken}` },
				variables: {
					input: {
						name: `Venue createdAt System Admin Org ${faker.string.uuid()}`,
						description: "Org to test venue createdAt system admin",
					},
				},
			},
		);
		const orgId = createOrgResult.data?.createOrganization?.id;
		assertToBeNonNullish(orgId);

		const createVenueResult = await mercuriusClient.mutate(
			Mutation_createVenue,
			{
				headers: { authorization: `Bearer ${authToken}` },
				variables: {
					input: {
						organizationId: orgId,
						name: `Test Venue ${faker.string.uuid()}`,
						description: "Test venue for system admin",
						capacity: 100,
					},
				},
			},
		);
		const venueId = createVenueResult.data?.createVenue?.id;
		assertToBeNonNullish(venueId);
		const expectedCreatedAt = createVenueResult.data?.createVenue?.createdAt;
		assertToBeNonNullish(expectedCreatedAt);

		const result = await mercuriusClient.query(Query_venue_createdAt, {
			headers: { authorization: `Bearer ${authToken}` },
			variables: { input: { id: venueId } },
		});

		expect(result.errors).toBeUndefined();
		expect(result.data?.venue?.id).toBe(venueId);
		expect(result.data?.venue?.createdAt).toBe(expectedCreatedAt);
		const createdAt = result.data?.venue?.createdAt as string;
		expect(() => new Date(createdAt).getTime()).not.toThrow();
		expect(Number.isNaN(new Date(createdAt).getTime())).toBe(false);
	});

	test("returns parent.createdAt when user is organization administrator", async () => {
		const createOrgResult = await mercuriusClient.mutate(
			Mutation_createOrganization,
			{
				headers: { authorization: `Bearer ${authToken}` },
				variables: {
					input: {
						name: `Venue createdAt Org Admin Org ${faker.string.uuid()}`,
						description: "Org to test venue createdAt org admin",
					},
				},
			},
		);
		const orgId = createOrgResult.data?.createOrganization?.id;
		assertToBeNonNullish(orgId);

		const createVenueResult = await mercuriusClient.mutate(
			Mutation_createVenue,
			{
				headers: { authorization: `Bearer ${authToken}` },
				variables: {
					input: {
						organizationId: orgId,
						name: `Test Venue ${faker.string.uuid()}`,
						description: "Test venue for org admin",
						capacity: 100,
					},
				},
			},
		);
		const venueId = createVenueResult.data?.createVenue?.id;
		assertToBeNonNullish(venueId);

		const { authToken: orgAdminToken, userId: orgAdminUserId } =
			await createRegularUserUsingAdmin();

		await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
			headers: { authorization: `Bearer ${authToken}` },
			variables: {
				input: {
					organizationId: orgId,
					memberId: orgAdminUserId,
					role: "administrator",
				},
			},
		});

		const result = await mercuriusClient.query(Query_venue_createdAt, {
			headers: { authorization: `Bearer ${orgAdminToken}` },
			variables: { input: { id: venueId } },
		});

		expect(result.errors).toBeUndefined();
		expect(result.data?.venue?.id).toBe(venueId);
		expect(result.data?.venue?.createdAt).toBeDefined();
		expect(typeof result.data?.venue?.createdAt).toBe("string");
	});
});

suite(
	"Venue resolveCreatedAt (unit coverage for unauthenticated branches)",
	() => {
		test("covers lines 24-29: throws unauthenticated when ctx.currentClient.isAuthenticated is false", async () => {
			const { context } = createMockGraphQLContext(false, faker.string.uuid());
			const mockVenue: VenueType = {
				id: faker.string.uuid(),
				organizationId: faker.string.uuid(),
				name: "Test Venue",
				description: null,
				capacity: 100,
				creatorId: faker.string.uuid(),
				updaterId: null,
				createdAt: new Date("2024-01-01T09:00:00Z"),
				updatedAt: new Date("2024-01-01T10:00:00Z"),
				attachments: null,
			};

			await expect(
				resolveCreatedAt(mockVenue, {}, context),
			).rejects.toMatchObject({
				extensions: { code: "unauthenticated" },
			});
		});

		test("covers lines 50-55: throws unauthenticated when current user is not found", async () => {
			const userId = faker.string.uuid();
			const { context, mocks } = createMockGraphQLContext(true, userId);
			const mockVenue: VenueType = {
				id: faker.string.uuid(),
				organizationId: faker.string.uuid(),
				name: "Test Venue",
				description: null,
				capacity: 100,
				creatorId: faker.string.uuid(),
				updaterId: null,
				createdAt: new Date("2024-01-01T09:00:00Z"),
				updatedAt: new Date("2024-01-01T10:00:00Z"),
				attachments: null,
			};

			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValueOnce(
				undefined,
			);

			await expect(
				resolveCreatedAt(mockVenue, {}, context),
			).rejects.toMatchObject({
				extensions: { code: "unauthenticated" },
			});
		});
	},
);
