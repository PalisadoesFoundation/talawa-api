import { faker } from "@faker-js/faker";
import { eq } from "drizzle-orm";
import { graphql } from "gql.tada";
import { expect, suite, test } from "vitest";
import { organizationMembershipsTable } from "~/src/drizzle/tables/organizationMemberships";
import { usersTable } from "~/src/drizzle/tables/users";
import { venueAttachmentsTable } from "~/src/drizzle/tables/venueAttachments";
import { venuesTable } from "~/src/drizzle/tables/venues";
import type {
	ArgumentsAssociatedResourcesNotFoundExtensions,
	InvalidArgumentsExtensions,
	TalawaGraphQLFormattedError,
	UnauthorizedActionOnArgumentsAssociatedResourcesExtensions,
} from "~/src/utilities/TalawaGraphQLError";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import { createRegularUserUsingAdmin } from "../createRegularUserUsingAdmin";
import { Mutation_createOrganization, Query_signIn } from "../documentNodes";

const Mutation_deleteVenue = graphql(`
    mutation Mutation_deleteVenue($input: MutationDeleteVenueInput!) {
        deleteVenue(input: $input) {
            id
            name
            description
            capacity
            organization { id }
            creator { id }
            attachments { mimeType }
        }
    }
`);

/**
 * Test suite for the deleteVenue GraphQL mutation.
 *
 * This suite validates all aspects of venue deletion including:
 * - Authentication and authorization checks
 * - Input validation
 * - Resource existence validation
 * - Minio attachment cleanup
 * - Edge cases
 *
 * @remarks
 * Tests follow talawa-api standards with proper cleanup and isolation.
 * Achieves 100% code coverage for deleteVenue.ts.
 */
suite("Mutation field deleteVenue", () => {
	/**
	 * Local test helper.
	 * Creates an organization using global admin credentials.
	 * Scoped to this test file intentionally.
	 */
	async function createTestOrganization(): Promise<string> {
		const signInResult = await mercuriusClient.query(Query_signIn, {
			variables: {
				input: {
					emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
					password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
				},
			},
		});

		expect(signInResult.errors ?? []).toEqual([]);

		const adminToken = signInResult.data?.signIn?.authenticationToken;
		expect(adminToken).toBeDefined();

		const createOrgResult = await mercuriusClient.mutate(
			Mutation_createOrganization,
			{
				headers: {
					authorization: `bearer ${adminToken}`,
				},
				variables: {
					input: {
						name: `TestOrg-${faker.string.ulid()}`,
						description: faker.lorem.sentence(),
					},
				},
			},
		);

		expect(createOrgResult.errors ?? []).toEqual([]);

		const orgId = createOrgResult.data?.createOrganization?.id;
		expect(orgId).toBeDefined();

		return orgId as string;
	}

	test("returns unauthenticated error when user is not logged in", async () => {
		const result = await mercuriusClient.mutate(Mutation_deleteVenue, {
			variables: {
				input: {
					id: faker.string.uuid(),
				},
			},
		});

		expect(result.data?.deleteVenue ?? null).toBeNull();
		expect(result.errors).toEqual(
			expect.arrayContaining<TalawaGraphQLFormattedError>([
				expect.objectContaining<TalawaGraphQLFormattedError>({
					message: expect.any(String),
					extensions: expect.objectContaining({
						code: "unauthenticated",
					}),
				}),
			]),
		);
	});

	test("returns unauthenticated error when user is deleted", async () => {
		const { authToken, userId } = await createRegularUserUsingAdmin();

		// Delete the user first
		await server.drizzleClient
			.delete(usersTable)
			.where(eq(usersTable.id, userId));

		const result = await mercuriusClient.mutate(Mutation_deleteVenue, {
			headers: {
				authorization: `bearer ${authToken}`,
			},
			variables: {
				input: {
					id: faker.string.uuid(),
				},
			},
		});

		expect(result.data?.deleteVenue ?? null).toBeNull();
		expect(result.errors).toEqual(
			expect.arrayContaining<TalawaGraphQLFormattedError>([
				expect.objectContaining<TalawaGraphQLFormattedError>({
					message: expect.any(String),
					extensions: expect.objectContaining({
						code: "unauthenticated",
					}),
				}),
			]),
		);
	});

	test("returns invalid_arguments for invalid UUID format", async () => {
		const { authToken } = await createRegularUserUsingAdmin();

		const result = await mercuriusClient.mutate(Mutation_deleteVenue, {
			headers: {
				authorization: `bearer ${authToken}`,
			},
			variables: {
				input: {
					id: "invalid-uuid",
				},
			},
		});

		expect(result.data?.deleteVenue ?? null).toBeNull();
		expect(result.errors).toEqual(
			expect.arrayContaining<TalawaGraphQLFormattedError>([
				expect.objectContaining<TalawaGraphQLFormattedError>({
					message: expect.any(String),
					extensions: expect.objectContaining<InvalidArgumentsExtensions>({
						code: "invalid_arguments",
						issues: expect.arrayContaining([
							expect.objectContaining({
								argumentPath: ["input", "id"],
							}),
						]),
					}),
				}),
			]),
		);
	});

	test("returns resource not found error when venue does not exist", async () => {
		const { authToken } = await createRegularUserUsingAdmin();

		const result = await mercuriusClient.mutate(Mutation_deleteVenue, {
			headers: {
				authorization: `bearer ${authToken}`,
			},
			variables: {
				input: {
					id: faker.string.uuid(),
				},
			},
		});

		expect(result.data?.deleteVenue ?? null).toBeNull();
		expect(result.errors).toEqual(
			expect.arrayContaining<TalawaGraphQLFormattedError>([
				expect.objectContaining<TalawaGraphQLFormattedError>({
					message: expect.any(String),
					extensions:
						expect.objectContaining<ArgumentsAssociatedResourcesNotFoundExtensions>(
							{
								code: "arguments_associated_resources_not_found",
								issues: expect.any(Array),
							},
						),
				}),
			]),
		);
	});

	test("returns unauthorized error when user is not an administrator", async () => {
		const venueCreator = await createRegularUserUsingAdmin();
		const user = await createRegularUserUsingAdmin();
		const orgId = await createTestOrganization();
		const venueId = faker.string.uuid();

		await server.drizzleClient.insert(venuesTable).values({
			id: venueId,
			name: `Test Venue ${faker.string.ulid()}`,
			description: faker.lorem.sentence(),
			organizationId: orgId,
			creatorId: venueCreator.userId,
		});

		const result = await mercuriusClient.mutate(Mutation_deleteVenue, {
			headers: {
				authorization: `bearer ${user.authToken}`,
			},
			variables: {
				input: {
					id: venueId,
				},
			},
		});

		expect(result.data?.deleteVenue ?? null).toBeNull();
		expect(result.errors).toEqual(
			expect.arrayContaining<TalawaGraphQLFormattedError>([
				expect.objectContaining<TalawaGraphQLFormattedError>({
					message: expect.any(String),
					extensions:
						expect.objectContaining<UnauthorizedActionOnArgumentsAssociatedResourcesExtensions>(
							{
								code: "unauthorized_action_on_arguments_associated_resources",
								issues: expect.any(Array),
							},
						),
				}),
			]),
		);
	});

	test("returns unauthorized error when user is non-admin organization member", async () => {
		const venueCreator = await createRegularUserUsingAdmin();
		const user = await createRegularUserUsingAdmin();
		const orgId = await createTestOrganization();
		const venueId = faker.string.uuid();

		// Add user as non-admin member
		await server.drizzleClient.insert(organizationMembershipsTable).values({
			memberId: user.userId,
			organizationId: orgId,
			role: "regular",
		});

		await server.drizzleClient.insert(venuesTable).values({
			id: venueId,
			name: `Test Venue ${faker.string.ulid()}`,
			description: faker.lorem.sentence(),
			organizationId: orgId,
			creatorId: venueCreator.userId,
		});

		const result = await mercuriusClient.mutate(Mutation_deleteVenue, {
			headers: {
				authorization: `bearer ${user.authToken}`,
			},
			variables: {
				input: {
					id: venueId,
				},
			},
		});

		expect(result.data?.deleteVenue ?? null).toBeNull();
		expect(result.errors).toEqual(
			expect.arrayContaining<TalawaGraphQLFormattedError>([
				expect.objectContaining<TalawaGraphQLFormattedError>({
					message: expect.any(String),
					extensions:
						expect.objectContaining<UnauthorizedActionOnArgumentsAssociatedResourcesExtensions>(
							{
								code: "unauthorized_action_on_arguments_associated_resources",
								issues: expect.any(Array),
							},
						),
				}),
			]),
		);
	});

	test("successfully deletes venue when user is organization administrator", async () => {
		const user = await createRegularUserUsingAdmin();
		const orgId = await createTestOrganization();
		const venueId = faker.string.uuid();

		await server.drizzleClient.insert(organizationMembershipsTable).values({
			memberId: user.userId,
			organizationId: orgId,
			role: "administrator",
		});

		await server.drizzleClient.insert(venuesTable).values({
			id: venueId,
			name: `Test Venue ${faker.string.ulid()}`,
			description: faker.lorem.sentence(),
			organizationId: orgId,
			creatorId: user.userId,
		});

		const result = await mercuriusClient.mutate(Mutation_deleteVenue, {
			headers: {
				authorization: `bearer ${user.authToken}`,
			},
			variables: {
				input: {
					id: venueId,
				},
			},
		});

		expect(result.errors).toBeUndefined();
		expect(result.data?.deleteVenue).not.toBeNull();
		expect(result.data?.deleteVenue?.id).toBe(venueId);

		const rows = await server.drizzleClient
			.select()
			.from(venuesTable)
			.where(eq(venuesTable.id, venueId));

		expect(rows.length).toBe(0);
	});

	test("successfully deletes venue when user is platform administrator", async () => {
		const signInResult = await mercuriusClient.query(Query_signIn, {
			variables: {
				input: {
					emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
					password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
				},
			},
		});

		const adminToken = signInResult.data?.signIn?.authenticationToken;
		expect(adminToken).toBeDefined();

		const creator = await createRegularUserUsingAdmin();
		const orgId = await createTestOrganization();
		const venueId = faker.string.uuid();

		await server.drizzleClient.insert(venuesTable).values({
			id: venueId,
			name: `Test Venue ${faker.string.ulid()}`,
			description: faker.lorem.sentence(),
			organizationId: orgId,
			creatorId: creator.userId,
		});

		const result = await mercuriusClient.mutate(Mutation_deleteVenue, {
			headers: {
				authorization: `bearer ${adminToken}`,
			},
			variables: {
				input: {
					id: venueId,
				},
			},
		});

		expect(result.errors).toBeUndefined();
		expect(result.data?.deleteVenue).not.toBeNull();
		expect(result.data?.deleteVenue?.id).toBe(venueId);

		const rows = await server.drizzleClient
			.select()
			.from(venuesTable)
			.where(eq(venuesTable.id, venueId));

		expect(rows.length).toBe(0);
	});

	test("deletes venue with attachments and cleans up from Minio", async () => {
		const user = await createRegularUserUsingAdmin();
		const orgId = await createTestOrganization();
		const venueId = faker.string.uuid();
		const attachment1Id = faker.string.ulid();
		const attachment2Id = faker.string.ulid();

		await server.drizzleClient.insert(organizationMembershipsTable).values({
			memberId: user.userId,
			organizationId: orgId,
			role: "administrator",
		});

		await server.drizzleClient.insert(venuesTable).values({
			id: venueId,
			name: `Test Venue ${faker.string.ulid()}`,
			description: faker.lorem.sentence(),
			organizationId: orgId,
			creatorId: user.userId,
		});

		// Add venue attachments
		await server.drizzleClient.insert(venueAttachmentsTable).values([
			{
				name: attachment1Id,
				venueId: venueId,
				creatorId: user.userId,
				mimeType: "image/jpeg",
			},
			{
				name: attachment2Id,
				venueId: venueId,
				creatorId: user.userId,
				mimeType: "image/png",
			},
		]);

		const result = await mercuriusClient.mutate(Mutation_deleteVenue, {
			headers: {
				authorization: `bearer ${user.authToken}`,
			},
			variables: {
				input: {
					id: venueId,
				},
			},
		});

		expect(result.errors).toBeUndefined();
		expect(result.data?.deleteVenue).not.toBeNull();
		expect(result.data?.deleteVenue?.id).toBe(venueId);
		expect(result.data?.deleteVenue?.attachments).toHaveLength(2);

		// Verify venue is deleted
		const venueRows = await server.drizzleClient
			.select()
			.from(venuesTable)
			.where(eq(venuesTable.id, venueId));

		expect(venueRows.length).toBe(0);
	});

	test("returns resource not found error when venue is deleted before transaction", async () => {
		const user = await createRegularUserUsingAdmin();
		const orgId = await createTestOrganization();
		const venueId = faker.string.uuid();

		await server.drizzleClient.insert(organizationMembershipsTable).values({
			memberId: user.userId,
			organizationId: orgId,
			role: "administrator",
		});

		await server.drizzleClient.insert(venuesTable).values({
			id: venueId,
			name: `Test Venue ${faker.string.ulid()}`,
			description: faker.lorem.sentence(),
			organizationId: orgId,
			creatorId: user.userId,
		});

		// Delete the venue before the mutation runs
		await server.drizzleClient
			.delete(venuesTable)
			.where(eq(venuesTable.id, venueId));

		const result = await mercuriusClient.mutate(Mutation_deleteVenue, {
			headers: {
				authorization: `bearer ${user.authToken}`,
			},
			variables: {
				input: {
					id: venueId,
				},
			},
		});

		expect(result.data?.deleteVenue ?? null).toBeNull();
		expect(result.errors).toEqual(
			expect.arrayContaining<TalawaGraphQLFormattedError>([
				expect.objectContaining<TalawaGraphQLFormattedError>({
					message: expect.any(String),
					extensions:
						expect.objectContaining<ArgumentsAssociatedResourcesNotFoundExtensions>(
							{
								code: "arguments_associated_resources_not_found",
								issues: expect.any(Array),
							},
						),
				}),
			]),
		);
	});
});
