import { faker } from "@faker-js/faker";
import { afterEach, beforeAll, expect, suite, test, vi } from "vitest";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import { createRegularUserUsingAdmin } from "../createRegularUserUsingAdmin";
import {
	Mutation_createOrganization,
	Mutation_createOrganizationMembership,
	Mutation_createVenue,
	Query_signIn,
	Query_venue_createdAt,
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
						code: "unauthorized_action",
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

		expect(result.data?.venue).toBeNull();
		expect(result.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					extensions: expect.objectContaining({
						code: "unauthorized_action",
					}),
					path: ["venue"],
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

		const result = await mercuriusClient.query(Query_venue_createdAt, {
			headers: { authorization: `Bearer ${authToken}` },
			variables: { input: { id: venueId } },
		});

		expect(result.errors).toBeUndefined();
		expect(result.data?.venue?.id).toBe(venueId);
		expect(result.data?.venue?.createdAt).toBeDefined();
		expect(typeof result.data?.venue?.createdAt).toBe("string");
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

	test("returns correct createdAt value for successful resolution", async () => {
		const createOrgResult = await mercuriusClient.mutate(
			Mutation_createOrganization,
			{
				headers: { authorization: `Bearer ${authToken}` },
				variables: {
					input: {
						name: `Venue createdAt Value Org ${faker.string.uuid()}`,
						description: "Org to test venue createdAt value",
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
						description: "Test venue for createdAt value",
						capacity: 100,
					},
				},
			},
		);
		const venueId = createVenueResult.data?.createVenue?.id;
		assertToBeNonNullish(venueId);

		const result = await mercuriusClient.query(Query_venue_createdAt, {
			headers: { authorization: `Bearer ${authToken}` },
			variables: { input: { id: venueId } },
		});

		expect(result.errors).toBeUndefined();
		expect(result.data?.venue?.id).toBe(venueId);
		const createdAt = result.data?.venue?.createdAt;
		expect(createdAt).toBeDefined();
		expect(typeof createdAt).toBe("string");
		expect(() => new Date(createdAt as string).getTime()).not.toThrow();
		expect(Number.isNaN(new Date(createdAt as string).getTime())).toBe(false);
	});

	test("registers createdAt field on Venue type", async () => {
		const createOrgResult = await mercuriusClient.mutate(
			Mutation_createOrganization,
			{
				headers: { authorization: `Bearer ${authToken}` },
				variables: {
					input: {
						name: `Venue createdAt Field Org ${faker.string.uuid()}`,
						description: "Org to verify createdAt field exists",
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
						description: "Test venue for field registration",
						capacity: 100,
					},
				},
			},
		);
		const venueId = createVenueResult.data?.createVenue?.id;
		assertToBeNonNullish(venueId);

		const result = await mercuriusClient.query(Query_venue_createdAt, {
			headers: { authorization: `Bearer ${authToken}` },
			variables: { input: { id: venueId } },
		});

		expect(result.errors).toBeUndefined();
		expect(result.data?.venue).toMatchObject({
			id: venueId,
			createdAt: expect.any(String),
		});
	});
});
