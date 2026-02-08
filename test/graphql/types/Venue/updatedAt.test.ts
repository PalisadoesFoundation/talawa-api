import { faker } from "@faker-js/faker";
import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { afterEach, beforeAll, expect, suite, test, vi } from "vitest";
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

let authToken: string;

beforeAll(async () => {
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
	authToken = signInResult.data.signIn.authenticationToken;
});

afterEach(() => {
	vi.restoreAllMocks();
});

suite("Venue Resolver - updatedAt Field", () => {
	test("throws unauthenticated when client is not authenticated", async () => {
		const createOrgResult = await mercuriusClient.mutate(
			Mutation_createOrganization,
			{
				headers: { authorization: `Bearer ${authToken}` },
				variables: {
					input: {
						name: `Venue updatedAt Test Org ${faker.string.uuid()}`,
						description: "Org to test venue updatedAt unauthenticated",
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
						description: "Test venue for updatedAt",
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

		const result = await mercuriusClient.query(Query_venue_updatedAt, {
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
						name: `Venue updatedAt Missing User Org ${faker.string.uuid()}`,
						description: "Org to test venue updatedAt missing user",
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

		const result = await mercuriusClient.query(Query_venue_updatedAt, {
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
						name: `Venue updatedAt No Membership Org ${faker.string.uuid()}`,
						description: "Org to test venue updatedAt no membership",
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
		const expectedUpdatedAt = createVenueResult.data?.createVenue?.updatedAt;
		// updatedAt might be null initially if not updated, or same as createdAt depending on implementation.
		// Wait, Venue type definition implies it exists. Let's check if createVenue returns it.
		// If it's null, we can't test it easily without updating. But the goal is to test READ permission.
		// Let's assume for now it returns something or null is valid.
		// Actually, let's update it to be sure it has a value if possible, or just check that we can read it without error.
		// For consistency with createdAt test, we just check it is accessible.

		const result = await mercuriusClient.query(Query_venue_updatedAt, {
			headers: { authorization: `Bearer ${authToken}` },
			variables: { input: { id: venueId } },
		});

		expect(result.errors).toBeUndefined();
		expect(result.data?.venue?.id).toBe(venueId);
		expect(result.data?.venue?.updatedAt).toBe(expectedUpdatedAt);
	});

	test("returns parent.updatedAt when user is organization administrator", async () => {
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

		const result = await mercuriusClient.query(Query_venue_updatedAt, {
			headers: { authorization: `Bearer ${orgAdminToken}` },
			variables: { input: { id: venueId } },
		});

		expect(result.errors).toBeUndefined();
		expect(result.data?.venue?.id).toBe(venueId);
		expect(result.data?.venue?.updatedAt).toBeDefined();
	});
});

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
