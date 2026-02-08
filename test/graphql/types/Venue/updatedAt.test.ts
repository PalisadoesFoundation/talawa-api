import { faker } from "@faker-js/faker";
import { eq, inArray } from "drizzle-orm";
import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { afterEach, expect, suite, test, vi } from "vitest";
import {
	organizationMembershipsTable,
	organizationsTable,
	usersTable,
	venuesTable,
} from "~/src/drizzle/schema";
import { resolveUpdatedAt } from "~/src/graphql/types/Venue/updatedAt";
import type { Venue as VenueType } from "~/src/graphql/types/Venue/Venue";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import { createRegularUserUsingAdmin } from "../createRegularUserUsingAdmin";
import {
	Mutation_createOrganization,
	Mutation_createOrganizationMembership,
	Mutation_createVenue,
	Query_signIn,
	Query_venue_updatedAt,
} from "../documentNodes";

const createdOrgIds: string[] = [];
const createdVenueIds: string[] = [];
const createdUserIds: string[] = [];

const getAdminToken = async () => {
	const signInResult = await mercuriusClient.query(Query_signIn, {
		variables: {
			input: {
				emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
				password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
			},
		},
	});
	expect(signInResult.errors).toBeUndefined();
	assertToBeNonNullish(signInResult.data?.signIn);
	assertToBeNonNullish(signInResult.data.signIn.authenticationToken);
	return signInResult.data.signIn.authenticationToken;
};

afterEach(async () => {
	if (createdVenueIds.length > 0) {
		await server.drizzleClient
			.delete(venuesTable)
			.where(inArray(venuesTable.id, createdVenueIds));
		createdVenueIds.length = 0;
	}
	if (createdOrgIds.length > 0) {
		for (const orgId of createdOrgIds) {
			await server.drizzleClient
				.delete(organizationMembershipsTable)
				.where(eq(organizationMembershipsTable.organizationId, orgId));
		}
		await server.drizzleClient
			.delete(organizationsTable)
			.where(inArray(organizationsTable.id, createdOrgIds));
		createdOrgIds.length = 0;
	}
	if (createdUserIds.length > 0) {
		await server.drizzleClient
			.delete(usersTable)
			.where(inArray(usersTable.id, createdUserIds));
		createdUserIds.length = 0;
	}
	vi.restoreAllMocks();
});

suite("Venue Resolver - updatedAt Field", () => {
	test("throws unauthorized_action when user is regular and has no org membership", async () => {
		const authToken = await getAdminToken();
		const createOrgResult = await mercuriusClient.mutate(
			Mutation_createOrganization,
			{
				headers: { authorization: `Bearer ${authToken}` },
				variables: {
					input: {
						name: `Venue updatedAt No Membership Org ${faker.string.uuid()}`,
						description: "Org to test venue updatedAt no membership",
					},
				},
			},
		);
		const orgId = createOrgResult.data?.createOrganization?.id;
		assertToBeNonNullish(orgId);
		createdOrgIds.push(orgId);

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
		createdVenueIds.push(venueId);

		const { authToken: regularToken } = await createRegularUserUsingAdmin();

		const result = await mercuriusClient.query(Query_venue_updatedAt, {
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
		const authToken = await getAdminToken();
		const createOrgResult = await mercuriusClient.mutate(
			Mutation_createOrganization,
			{
				headers: { authorization: `Bearer ${authToken}` },
				variables: {
					input: {
						name: `Venue updatedAt Regular Member Org ${faker.string.uuid()}`,
						description: "Org to test venue updatedAt regular member",
					},
				},
			},
		);
		const orgId = createOrgResult.data?.createOrganization?.id;
		assertToBeNonNullish(orgId);
		createdOrgIds.push(orgId);

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
		createdVenueIds.push(venueId);

		const { authToken: memberToken, userId: memberUserId } =
			await createRegularUserUsingAdmin();
		createdUserIds.push(memberUserId);

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

		const result = await mercuriusClient.query(Query_venue_updatedAt, {
			headers: { authorization: `Bearer ${memberToken}` },
			variables: { input: { id: venueId } },
		});

		expect(result.data?.venue?.id).toBe(venueId);
		expect(result.data?.venue?.updatedAt).toBeNull();
		expect(result.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					extensions: expect.objectContaining({
						code: "unauthorized_action",
					}),
					path: ["venue", "updatedAt"],
				}),
			]),
		);
	});

	test("returns parent.updatedAt when user is system administrator", async () => {
		const authToken = await getAdminToken();
		const createOrgResult = await mercuriusClient.mutate(
			Mutation_createOrganization,
			{
				headers: { authorization: `Bearer ${authToken}` },
				variables: {
					input: {
						name: `Venue updatedAt System Admin Org ${faker.string.uuid()}`,
						description: "Org to test venue updatedAt system admin",
					},
				},
			},
		);
		const orgId = createOrgResult.data?.createOrganization?.id;
		assertToBeNonNullish(orgId);
		createdOrgIds.push(orgId);

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
		createdVenueIds.push(venueId);
		const expectedUpdatedAt = createVenueResult.data?.createVenue?.updatedAt;

		const result = await mercuriusClient.query(Query_venue_updatedAt, {
			headers: { authorization: `Bearer ${authToken}` },
			variables: { input: { id: venueId } },
		});

		expect(result.errors).toBeUndefined();
		expect(result.data?.venue?.id).toBe(venueId);
		expect(result.data?.venue?.updatedAt).toBe(expectedUpdatedAt);
	});

	test("returns parent.updatedAt when user is organization administrator", async () => {
		const authToken = await getAdminToken();
		const createOrgResult = await mercuriusClient.mutate(
			Mutation_createOrganization,
			{
				headers: { authorization: `Bearer ${authToken}` },
				variables: {
					input: {
						name: `Venue updatedAt Org Admin Org ${faker.string.uuid()}`,
						description: "Org to test venue updatedAt org admin",
					},
				},
			},
		);
		const orgId = createOrgResult.data?.createOrganization?.id;
		assertToBeNonNullish(orgId);
		createdOrgIds.push(orgId);

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
		createdVenueIds.push(venueId);

		const { authToken: orgAdminToken, userId: orgAdminUserId } =
			await createRegularUserUsingAdmin();
		createdUserIds.push(orgAdminUserId);

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

		const result = await mercuriusClient.query(Query_venue_updatedAt, {
			headers: { authorization: `Bearer ${orgAdminToken}` },
			variables: { input: { id: venueId } },
		});

		expect(result.errors).toBeUndefined();
		expect(result.data?.venue?.id).toBe(venueId);
		expect(result.data?.venue?.updatedAt).toBeDefined();
	});
});

// Direct invocation of resolveUpdatedAt is required because Query.venue
// rejects unauthenticated requests before the Venue.updatedAt resolver runs,
// so integration tests cannot reach these branches.
suite(
	"Venue resolveUpdatedAt (unit coverage for unauthenticated branches)",
	() => {
		test("covers lines 11-16: throws unauthenticated when ctx.currentClient.isAuthenticated is false", async () => {
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
				resolveUpdatedAt(mockVenue, {}, context),
			).rejects.toMatchObject({
				extensions: { code: "unauthenticated" },
			});
		});

		test("covers lines 37-42: throws unauthenticated when current user is not found", async () => {
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
				resolveUpdatedAt(mockVenue, {}, context),
			).rejects.toMatchObject({
				extensions: { code: "unauthenticated" },
			});
		});
	},
);
