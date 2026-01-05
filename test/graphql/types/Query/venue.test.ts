import { faker } from "@faker-js/faker";
import gql from "graphql-tag";
import { afterEach, expect, suite, test, vi } from "vitest";
import { venuesTable } from "~/src/drizzle/schema";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";

import {
	Mutation_createOrganization,
	Mutation_joinPublicOrganization,
	Query_signIn,
} from "../documentNodes";

const VenueQuery = gql`
  query Venue($input: QueryVenueInput!) {
  venue(input: $input) {
    id
    name
    description
    capacity
  }
}
`;

// Helper function to get admin auth token

async function getAdminAuthToken(): Promise<string> {
	const signInResult = await mercuriusClient.query(Query_signIn, {
		variables: {
			input: {
				emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
				password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
			},
		},
	});

	assertToBeNonNullish(signInResult.data?.signIn?.authenticationToken);
	return signInResult.data.signIn.authenticationToken;
}

// Helper function to create organization

async function createOrganization(adminAuthToken: string): Promise<string> {
	const orgResult = await mercuriusClient.mutate(Mutation_createOrganization, {
		headers: { authorization: `Bearer ${adminAuthToken}` },
		variables: {
			input: {
				name: `Venue Test Org ${faker.string.uuid()}`,
				countryCode: "us",
			},
		},
	});

	assertToBeNonNullish(orgResult.data?.createOrganization?.id);
	return orgResult.data.createOrganization.id;
}

// Helper function to create venue

async function createVenue(organizationId: string): Promise<string> {
	const venueInsertResult = await server.drizzleClient
		.insert(venuesTable)
		.values({
			id: faker.string.uuid(),
			name: `Test Venue ${faker.string.uuid()}`,
			description: "Test venue description",
			capacity: faker.number.int({ min: 1, max: 500 }),
			organizationId,
			createdAt: new Date(),
			updatedAt: new Date(),
		})
		.returning();

	assertToBeNonNullish(venueInsertResult[0]);
	return venueInsertResult[0].id;
}

afterEach(() => {
	vi.restoreAllMocks();
});

suite("Query field venue", () => {
	/**
	 * 1. Unauthenticated
	 */
	test("returns unauthenticated error if client is not authenticated", async () => {
		// Setup: Create own organization and venue
		const adminAuthToken = await getAdminAuthToken();
		const organizationId = await createOrganization(adminAuthToken);
		const venueId = await createVenue(organizationId);

		// Act: Query without authentication
		const result = await mercuriusClient.query(VenueQuery, {
			variables: { input: { id: venueId } },
		});

		// Assert
		expect(result.data?.venue).toBeNull();
		expect(result.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					extensions: {
						code: "unauthenticated",
						correlationId: expect.any(String),
					},
					path: ["venue"],
				}),
			]),
		);
	});

	/**
	 * 2. Invalid arguments
	 */
	test("returns invalid_arguments for invalid venue id", async () => {
		// Setup: Get admin auth
		const adminAuthToken = await getAdminAuthToken();

		// Act: Query with invalid UUID
		const result = await mercuriusClient.query(VenueQuery, {
			headers: { authorization: `Bearer ${adminAuthToken}` },
			variables: { input: { id: "invalid-uuid" } },
		});

		// Assert
		expect(result.data?.venue).toBeNull();
		expect(result.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					extensions: expect.objectContaining({
						code: "invalid_arguments",
						correlationId: expect.any(String),
					}),
					path: ["venue"],
				}),
			]),
		);
	});

	/**
	 * 3. Authenticated but user not found
	 */
	test("returns unauthenticated when current user is missing", async () => {
		// Setup: Create own organization and venue
		const adminAuthToken = await getAdminAuthToken();
		const organizationId = await createOrganization(adminAuthToken);
		const venueId = await createVenue(organizationId);

		// Mock user not found
		vi.spyOn(
			server.drizzleClient.query.usersTable,
			"findFirst",
		).mockResolvedValueOnce(undefined);

		// Act: Query with mocked missing user
		const result = await mercuriusClient.query(VenueQuery, {
			headers: { authorization: `Bearer ${adminAuthToken}` },
			variables: { input: { id: venueId } },
		});

		// Assert
		expect(result.data?.venue).toBeNull();
		expect(result.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					extensions: expect.objectContaining({
						code: "unauthenticated",
						correlationId: expect.any(String),
					}),
					path: ["venue"],
				}),
			]),
		);
	});

	/**
	 * 4. Venue not found
	 */
	test("returns resource not found when venue does not exist", async () => {
		// Setup: Get admin auth
		const adminAuthToken = await getAdminAuthToken();

		// Act: Query with non-existent venue ID
		const result = await mercuriusClient.query(VenueQuery, {
			headers: { authorization: `Bearer ${adminAuthToken}` },
			variables: { input: { id: faker.string.uuid() } },
		});

		// Assert
		expect(result.data?.venue).toBeNull();
		expect(result.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					extensions: expect.objectContaining({
						code: "arguments_associated_resources_not_found",
						correlationId: expect.any(String),
					}),
					path: ["venue"],
				}),
			]),
		);
	});

	/**
	 * 5. Unauthorized (non-member & non-admin)
	 */
	test("returns unauthorized error for non-member user", async () => {
		// Setup: Create own organization and venue
		const adminAuthToken = await getAdminAuthToken();
		const organizationId = await createOrganization(adminAuthToken);
		const venueId = await createVenue(organizationId);

		// Create a regular user (not a member of this organization)
		const { authToken } = await import("../createRegularUserUsingAdmin").then(
			(m) => m.createRegularUserUsingAdmin(),
		);

		// Act: Non-member tries to query venue
		const result = await mercuriusClient.query(VenueQuery, {
			headers: { authorization: `Bearer ${authToken}` },
			variables: { input: { id: venueId } },
		});

		// Assert
		expect(result.data?.venue).toBeNull();
		expect(result.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					extensions: expect.objectContaining({
						code: "unauthorized_action_on_arguments_associated_resources",
						correlationId: expect.any(String),
					}),
					path: ["venue"],
				}),
			]),
		);
	});

	/**
	 * 6. Success: organization member
	 */
	test("returns venue for organization member", async () => {
		// Setup: Create own organization and venue
		const adminAuthToken = await getAdminAuthToken();
		const organizationId = await createOrganization(adminAuthToken);
		const venueId = await createVenue(organizationId);

		// Create a regular user and join them to THIS organization
		const { authToken } = await import("../createRegularUserUsingAdmin").then(
			(m) => m.createRegularUserUsingAdmin(),
		);

		const joinResult = await mercuriusClient.mutate(
			Mutation_joinPublicOrganization,
			{
				headers: { authorization: `Bearer ${authToken}` },
				variables: { input: { organizationId } },
			},
		);

		expect(joinResult.errors).toBeUndefined();

		// Act: Organization member queries venue
		const result = await mercuriusClient.query(VenueQuery, {
			headers: { authorization: `Bearer ${authToken}` },
			variables: { input: { id: venueId } },
		});

		// Assert
		expect(result.errors).toBeUndefined();
		expect(result.data?.venue?.id).toBe(venueId);
	});

	/**
	 * 7. Success: administrator
	 */
	test("returns venue for administrator", async () => {
		// Setup: Create own organization and venue
		const adminAuthToken = await getAdminAuthToken();
		const organizationId = await createOrganization(adminAuthToken);
		const venueId = await createVenue(organizationId);

		// Act: Administrator queries venue
		const result = await mercuriusClient.query(VenueQuery, {
			headers: { authorization: `Bearer ${adminAuthToken}` },
			variables: { input: { id: venueId } },
		});

		// Assert
		expect(result.errors).toBeUndefined();
		expect(result.data?.venue?.id).toBe(venueId);
	});

	/**
	 * 8. Edge case: Empty string venue ID
	 */
	test("returns invalid_arguments for empty venue id", async () => {
		// Setup: Get admin auth
		const adminAuthToken = await getAdminAuthToken();

		// Act: Query with empty string UUID
		const result = await mercuriusClient.query(VenueQuery, {
			headers: { authorization: `Bearer ${adminAuthToken}` },
			variables: { input: { id: "" } },
		});

		// Assert
		expect(result.data?.venue).toBeNull();
		expect(result.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					extensions: expect.objectContaining({
						code: "invalid_arguments",
						correlationId: expect.any(String),
					}),
					path: ["venue"],
				}),
			]),
		);
	});
});
