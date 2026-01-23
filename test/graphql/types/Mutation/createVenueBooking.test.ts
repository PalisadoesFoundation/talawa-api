import { faker } from "@faker-js/faker";
import { graphql } from "gql.tada";
import { expect, suite, test, vi } from "vitest";
import type {
	ArgumentsAssociatedResourcesNotFoundExtensions,
	ForbiddenActionOnArgumentsAssociatedResourcesExtensions,
	InvalidArgumentsExtensions,
	TalawaGraphQLFormattedError,
	UnauthenticatedExtensions,
	UnauthorizedActionOnArgumentsAssociatedResourcesExtensions,
	UnexpectedExtensions,
} from "~/src/utilities/TalawaGraphQLError";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	Mutation_createEvent,
	Mutation_createOrganization,
	Mutation_createOrganizationMembership,
	Mutation_createUser,
	Query_signIn,
} from "../documentNodes";

const Mutation_createVenue = graphql(`
	mutation Mutation_createVenue($input: MutationCreateVenueInput!) {
		createVenue(input: $input) {
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

const Mutation_createVenueBooking = graphql(`
	mutation Mutation_createVenueBooking($input: MutationCreateVenueBookingInput!) {
		createVenueBooking(input: $input) {
			id
			name
			description
			capacity
			organization { id }
			attachments { mimeType }
		}
	}
`);

// Sign in as admin once at the module level for test efficiency
const signInResult = await mercuriusClient.query(Query_signIn, {
	variables: {
		input: {
			emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
			password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
		},
	},
});

assertToBeNonNullish(signInResult.data?.signIn);
const adminToken = signInResult.data.signIn.authenticationToken;
assertToBeNonNullish(adminToken);
assertToBeNonNullish(signInResult.data.signIn.user?.id);
const adminUserId = signInResult.data.signIn.user.id;

/**
 * Helper function to create an organization with the admin as a member.
 * This is required before creating events or venues.
 */
async function createTestOrganization() {
	const createOrganizationResult = await mercuriusClient.mutate(
		Mutation_createOrganization,
		{
			headers: { authorization: `bearer ${adminToken}` },
			variables: {
				input: {
					name: `TestOrg_${faker.string.ulid()}`,
					countryCode: "us",
				},
			},
		},
	);
	const orgId = createOrganizationResult.data?.createOrganization?.id;
	assertToBeNonNullish(orgId);

	// Add admin as organization member with administrator role
	await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
		headers: { authorization: `bearer ${adminToken}` },
		variables: {
			input: {
				memberId: adminUserId,
				organizationId: orgId,
				role: "administrator",
			},
		},
	});

	return orgId;
}

/**
 * Helper to create a venue in an organization.
 */
async function createTestVenue(organizationId: string) {
	const createVenueResult = await mercuriusClient.mutate(Mutation_createVenue, {
		headers: { authorization: `bearer ${adminToken}` },
		variables: {
			input: {
				organizationId,
				name: `Venue_${faker.string.ulid()}`,
			},
		},
	});
	const venueId = createVenueResult.data?.createVenue?.id;
	assertToBeNonNullish(venueId);
	return venueId;
}

/**
 * Helper to create an event in an organization.
 */
async function createTestEvent(organizationId: string) {
	const createEventResult = await mercuriusClient.mutate(Mutation_createEvent, {
		headers: { authorization: `bearer ${adminToken}` },
		variables: {
			input: {
				endAt: new Date(Date.now() + 172800000).toISOString(),
				name: `Event_${faker.string.ulid()}`,
				organizationId,
				startAt: new Date(Date.now() + 86400000).toISOString(),
			},
		},
	});
	const eventId = createEventResult.data?.createEvent?.id;
	assertToBeNonNullish(eventId);
	return eventId;
}

/**
 * Helper to create a regular user with no org membership.
 */
async function createRegularUser() {
	const createUserResult = await mercuriusClient.mutate(Mutation_createUser, {
		headers: { authorization: `bearer ${adminToken}` },
		variables: {
			input: {
				emailAddress: `email${faker.string.ulid()}@email.com`,
				isEmailAddressVerified: false,
				name: "Regular User",
				password: "TestPassword123!",
				role: "regular",
			},
		},
	});
	assertToBeNonNullish(createUserResult.data?.createUser?.user?.id);
	assertToBeNonNullish(createUserResult.data?.createUser?.authenticationToken);
	return {
		userId: createUserResult.data.createUser.user.id,
		authToken: createUserResult.data.createUser.authenticationToken,
	};
}

/**
 * Test suite for the createVenueBooking GraphQL mutation.
 *
 * This suite validates all aspects of venue booking creation including:
 * - Authentication and authorization checks
 * - Input validation (UUID/ULID format)
 * - Resource existence validation (event and venue)
 * - Business logic (duplicate booking prevention)
 * - Edge cases and error conditions
 */
suite("Mutation field createVenueBooking", () => {
	suite(
		`results in a graphql error with "unauthenticated" extensions code in the "errors" field and "null" as the value of "data.createVenueBooking" field if`,
		() => {
			/**
			 * Tests that unauthenticated requests are properly rejected.
			 */
			test("client triggering the graphql operation is not authenticated.", async () => {
				const orgId = await createTestOrganization();
				const venueId = await createTestVenue(orgId);
				const eventId = await createTestEvent(orgId);

				// Try to create venue booking without authentication
				const createVenueBookingResult = await mercuriusClient.mutate(
					Mutation_createVenueBooking,
					{
						variables: {
							input: {
								eventId,
								venueId,
							},
						},
					},
				);

				expect(createVenueBookingResult.data?.createVenueBooking).toEqual(null);
				expect(createVenueBookingResult.errors).toEqual(
					expect.arrayContaining<TalawaGraphQLFormattedError>([
						expect.objectContaining<TalawaGraphQLFormattedError>({
							extensions: expect.objectContaining<UnauthenticatedExtensions>({
								code: "unauthenticated",
							}),
							message: expect.any(String),
							path: ["createVenueBooking"],
						}),
					]),
				);
			});

			/**
			 * Tests that deleted user tokens are properly invalidated.
			 */
			test("client triggering the graphql operation has no existing user associated to their authentication context.", async () => {
				const { authToken: userToken } = await createRegularUser();

				// Delete the user using their own token
				const Mutation_deleteCurrentUser = graphql(`
					mutation Mutation_deleteCurrentUser {
						deleteCurrentUser {
							id
						}
					}
				`);
				await mercuriusClient.mutate(Mutation_deleteCurrentUser, {
					headers: { authorization: `bearer ${userToken}` },
				});

				const orgId = await createTestOrganization();
				const venueId = await createTestVenue(orgId);
				const eventId = await createTestEvent(orgId);

				// Try to create venue booking with deleted user's token
				const createVenueBookingResult = await mercuriusClient.mutate(
					Mutation_createVenueBooking,
					{
						headers: { authorization: `bearer ${userToken}` },
						variables: {
							input: {
								eventId,
								venueId,
							},
						},
					},
				);

				expect(createVenueBookingResult.data?.createVenueBooking).toEqual(null);
				expect(createVenueBookingResult.errors).toEqual(
					expect.arrayContaining<TalawaGraphQLFormattedError>([
						expect.objectContaining<TalawaGraphQLFormattedError>({
							extensions: expect.objectContaining<UnauthenticatedExtensions>({
								code: "unauthenticated",
							}),
							message: expect.any(String),
							path: ["createVenueBooking"],
						}),
					]),
				);
			});
		},
	);

	suite(
		`results in a graphql error with "invalid_arguments" extensions code in the "errors" field and "null" as the value of "data.createVenueBooking" field if`,
		() => {
			/**
			 * Tests UUID/ULID format validation for eventId.
			 */
			test('value of the argument "input.eventId" is not a valid UUID/ULID format.', async () => {
				const createVenueBookingResult = await mercuriusClient.mutate(
					Mutation_createVenueBooking,
					{
						headers: { authorization: `bearer ${adminToken}` },
						variables: {
							input: {
								eventId: "invalid-uuid-format",
								venueId: faker.string.uuid(),
							},
						},
					},
				);

				expect(createVenueBookingResult.data?.createVenueBooking).toEqual(null);
				expect(createVenueBookingResult.errors).toEqual(
					expect.arrayContaining<TalawaGraphQLFormattedError>([
						expect.objectContaining<TalawaGraphQLFormattedError>({
							extensions: expect.objectContaining<InvalidArgumentsExtensions>({
								code: "invalid_arguments",
								issues: expect.arrayContaining([
									expect.objectContaining({
										argumentPath: ["input", "eventId"],
									}),
								]),
							}),
							message: expect.any(String),
							path: ["createVenueBooking"],
						}),
					]),
				);
			});

			/**
			 * Tests UUID/ULID format validation for venueId.
			 */
			test('value of the argument "input.venueId" is not a valid UUID/ULID format.', async () => {
				const createVenueBookingResult = await mercuriusClient.mutate(
					Mutation_createVenueBooking,
					{
						headers: { authorization: `bearer ${adminToken}` },
						variables: {
							input: {
								eventId: faker.string.uuid(),
								venueId: "invalid-uuid-format",
							},
						},
					},
				);

				expect(createVenueBookingResult.data?.createVenueBooking).toEqual(null);
				expect(createVenueBookingResult.errors).toEqual(
					expect.arrayContaining<TalawaGraphQLFormattedError>([
						expect.objectContaining<TalawaGraphQLFormattedError>({
							extensions: expect.objectContaining<InvalidArgumentsExtensions>({
								code: "invalid_arguments",
								issues: expect.arrayContaining([
									expect.objectContaining({
										argumentPath: ["input", "venueId"],
									}),
								]),
							}),
							message: expect.any(String),
							path: ["createVenueBooking"],
						}),
					]),
				);
			});
		},
	);

	suite(
		`results in a graphql error with "arguments_associated_resources_not_found" extensions code in the "errors" field and "null" as the value of "data.createVenueBooking" field if`,
		() => {
			/**
			 * Tests validation when both event and venue don't exist.
			 */
			test('values of the arguments "input.eventId" and "input.venueId" do not correspond to existing event and venue.', async () => {
				const createVenueBookingResult = await mercuriusClient.mutate(
					Mutation_createVenueBooking,
					{
						headers: { authorization: `bearer ${adminToken}` },
						variables: {
							input: {
								eventId: faker.string.uuid(),
								venueId: faker.string.uuid(),
							},
						},
					},
				);

				expect(createVenueBookingResult.data?.createVenueBooking).toEqual(null);
				expect(createVenueBookingResult.errors).toEqual(
					expect.arrayContaining<TalawaGraphQLFormattedError>([
						expect.objectContaining<TalawaGraphQLFormattedError>({
							extensions:
								expect.objectContaining<ArgumentsAssociatedResourcesNotFoundExtensions>(
									{
										code: "arguments_associated_resources_not_found",
										issues: expect.arrayContaining<
											ArgumentsAssociatedResourcesNotFoundExtensions["issues"][number]
										>([
											{
												argumentPath: ["input", "eventId"],
											},
											{
												argumentPath: ["input", "venueId"],
											},
										]),
									},
								),
							message: expect.any(String),
							path: ["createVenueBooking"],
						}),
					]),
				);
			});

			/**
			 * Tests validation of non-existent event reference.
			 */
			test('value of the argument "input.eventId" does not correspond to an existing event.', async () => {
				const orgId = await createTestOrganization();
				const venueId = await createTestVenue(orgId);

				const createVenueBookingResult = await mercuriusClient.mutate(
					Mutation_createVenueBooking,
					{
						headers: { authorization: `bearer ${adminToken}` },
						variables: {
							input: {
								eventId: faker.string.uuid(),
								venueId,
							},
						},
					},
				);

				expect(createVenueBookingResult.data?.createVenueBooking).toEqual(null);
				expect(createVenueBookingResult.errors).toEqual(
					expect.arrayContaining<TalawaGraphQLFormattedError>([
						expect.objectContaining<TalawaGraphQLFormattedError>({
							extensions:
								expect.objectContaining<ArgumentsAssociatedResourcesNotFoundExtensions>(
									{
										code: "arguments_associated_resources_not_found",
										issues: expect.arrayContaining<
											ArgumentsAssociatedResourcesNotFoundExtensions["issues"][number]
										>([
											{
												argumentPath: ["input", "eventId"],
											},
										]),
									},
								),
							message: expect.any(String),
							path: ["createVenueBooking"],
						}),
					]),
				);
			});

			/**
			 * Tests validation of non-existent venue reference.
			 */
			test('value of the argument "input.venueId" does not correspond to an existing venue.', async () => {
				const orgId = await createTestOrganization();
				const eventId = await createTestEvent(orgId);

				const createVenueBookingResult = await mercuriusClient.mutate(
					Mutation_createVenueBooking,
					{
						headers: { authorization: `bearer ${adminToken}` },
						variables: {
							input: {
								eventId,
								venueId: faker.string.uuid(),
							},
						},
					},
				);

				expect(createVenueBookingResult.data?.createVenueBooking).toEqual(null);
				expect(createVenueBookingResult.errors).toEqual(
					expect.arrayContaining<TalawaGraphQLFormattedError>([
						expect.objectContaining<TalawaGraphQLFormattedError>({
							extensions:
								expect.objectContaining<ArgumentsAssociatedResourcesNotFoundExtensions>(
									{
										code: "arguments_associated_resources_not_found",
										issues: expect.arrayContaining<
											ArgumentsAssociatedResourcesNotFoundExtensions["issues"][number]
										>([
											{
												argumentPath: ["input", "venueId"],
											},
										]),
									},
								),
							message: expect.any(String),
							path: ["createVenueBooking"],
						}),
					]),
				);
			});
		},
	);

	suite(
		`results in a graphql error with "forbidden_action_on_arguments_associated_resources" extensions code in the "errors" field and "null" as the value of "data.createVenueBooking" field if`,
		() => {
			/**
			 * Tests duplicate venue booking detection.
			 */
			test("venue is already booked for the event.", async () => {
				const orgId = await createTestOrganization();
				const venueId = await createTestVenue(orgId);
				const eventId = await createTestEvent(orgId);

				// Create first venue booking (should succeed)
				const createVenueBookingResult1 = await mercuriusClient.mutate(
					Mutation_createVenueBooking,
					{
						headers: { authorization: `bearer ${adminToken}` },
						variables: {
							input: {
								eventId,
								venueId,
							},
						},
					},
				);

				assertToBeNonNullish(
					createVenueBookingResult1.data?.createVenueBooking?.id,
				);

				// Try to create second venue booking for same event+venue (should fail)
				const createVenueBookingResult2 = await mercuriusClient.mutate(
					Mutation_createVenueBooking,
					{
						headers: { authorization: `bearer ${adminToken}` },
						variables: {
							input: {
								eventId,
								venueId,
							},
						},
					},
				);

				expect(createVenueBookingResult2.data?.createVenueBooking).toEqual(
					null,
				);
				expect(createVenueBookingResult2.errors).toEqual(
					expect.arrayContaining<TalawaGraphQLFormattedError>([
						expect.objectContaining<TalawaGraphQLFormattedError>({
							extensions:
								expect.objectContaining<ForbiddenActionOnArgumentsAssociatedResourcesExtensions>(
									{
										code: "forbidden_action_on_arguments_associated_resources",
										issues: expect.arrayContaining<
											ForbiddenActionOnArgumentsAssociatedResourcesExtensions["issues"][number]
										>([
											{
												argumentPath: ["input", "eventId"],
												message:
													"This event has already the venue booked for it.",
											},
											{
												argumentPath: ["input", "venueId"],
												message: "This venue is already booked for the event.",
											},
										]),
									},
								),
							message: expect.any(String),
							path: ["createVenueBooking"],
						}),
					]),
				);
			});
		},
	);

	suite(
		`results in a graphql error with "unauthorized_action_on_arguments_associated_resources" extensions code in the "errors" field and "null" as the value of "data.createVenueBooking" field if`,
		() => {
			/**
			 * Tests authorization for non-admin organization member.
			 */
			test("client is a non-admin organization member.", async () => {
				const orgId = await createTestOrganization();
				const venueId = await createTestVenue(orgId);
				const eventId = await createTestEvent(orgId);

				// Create a regular user
				const { userId: regularUserId, authToken: regularUserToken } =
					await createRegularUser();

				// Add user as non-admin member of the organization
				await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
					headers: { authorization: `bearer ${adminToken}` },
					variables: {
						input: {
							organizationId: orgId,
							memberId: regularUserId,
							role: "regular",
						},
					},
				});

				// Try to create venue booking as non-admin member
				const createVenueBookingResult = await mercuriusClient.mutate(
					Mutation_createVenueBooking,
					{
						headers: { authorization: `bearer ${regularUserToken}` },
						variables: {
							input: {
								eventId,
								venueId,
							},
						},
					},
				);

				expect(createVenueBookingResult.data?.createVenueBooking).toEqual(null);
				expect(createVenueBookingResult.errors).toEqual(
					expect.arrayContaining<TalawaGraphQLFormattedError>([
						expect.objectContaining<TalawaGraphQLFormattedError>({
							extensions:
								expect.objectContaining<UnauthorizedActionOnArgumentsAssociatedResourcesExtensions>(
									{
										code: "unauthorized_action_on_arguments_associated_resources",
										issues: expect.arrayContaining<
											UnauthorizedActionOnArgumentsAssociatedResourcesExtensions["issues"][number]
										>([
											{
												argumentPath: ["input", "eventId"],
											},
											{
												argumentPath: ["input", "venueId"],
											},
										]),
									},
								),
							message: expect.any(String),
							path: ["createVenueBooking"],
						}),
					]),
				);
			});

			/**
			 * Tests authorization for non-admin, non-member users.
			 */
			test("client triggering the graphql operation is not an administrator user and is not an administrator member of the organization.", async () => {
				const orgId = await createTestOrganization();
				const venueId = await createTestVenue(orgId);
				const eventId = await createTestEvent(orgId);

				// Create a regular user (not a member of the organization)
				const { authToken: regularUserToken } = await createRegularUser();

				// Try to create venue booking as non-member user
				const createVenueBookingResult = await mercuriusClient.mutate(
					Mutation_createVenueBooking,
					{
						headers: { authorization: `bearer ${regularUserToken}` },
						variables: {
							input: {
								eventId,
								venueId,
							},
						},
					},
				);

				expect(createVenueBookingResult.data?.createVenueBooking).toEqual(null);
				expect(createVenueBookingResult.errors).toEqual(
					expect.arrayContaining<TalawaGraphQLFormattedError>([
						expect.objectContaining<TalawaGraphQLFormattedError>({
							extensions:
								expect.objectContaining<UnauthorizedActionOnArgumentsAssociatedResourcesExtensions>(
									{
										code: "unauthorized_action_on_arguments_associated_resources",
										issues: expect.arrayContaining<
											UnauthorizedActionOnArgumentsAssociatedResourcesExtensions["issues"][number]
										>([
											{
												argumentPath: ["input", "eventId"],
											},
											{
												argumentPath: ["input", "venueId"],
											},
										]),
									},
								),
							message: expect.any(String),
							path: ["createVenueBooking"],
						}),
					]),
				);
			});
		},
	);

	suite(
		"returns the venue associated with the created venue booking if",
		() => {
			/**
			 * Tests successful venue booking creation by platform administrator.
			 */
			test("client is a platform administrator.", async () => {
				const orgId = await createTestOrganization();
				const venueId = await createTestVenue(orgId);
				const eventId = await createTestEvent(orgId);

				// Create venue booking as platform administrator
				const createVenueBookingResult = await mercuriusClient.mutate(
					Mutation_createVenueBooking,
					{
						headers: { authorization: `bearer ${adminToken}` },
						variables: {
							input: {
								eventId,
								venueId,
							},
						},
					},
				);

				expect(createVenueBookingResult.errors).toBeUndefined();
				expect(createVenueBookingResult.data?.createVenueBooking).toEqual(
					expect.objectContaining({
						id: venueId,
						organization: {
							id: orgId,
						},
					}),
				);
			});

			/**
			 * Tests successful venue booking creation by organization administrator.
			 */
			test("client is an administrator member of the organization.", async () => {
				const orgId = await createTestOrganization();
				const venueId = await createTestVenue(orgId);
				const eventId = await createTestEvent(orgId);

				// Create a regular user
				const { userId: orgAdminUserId, authToken: orgAdminToken } =
					await createRegularUser();

				// Add user as admin member of the organization
				await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
					headers: { authorization: `bearer ${adminToken}` },
					variables: {
						input: {
							organizationId: orgId,
							memberId: orgAdminUserId,
							role: "administrator",
						},
					},
				});

				// Create venue booking as organization administrator
				const createVenueBookingResult = await mercuriusClient.mutate(
					Mutation_createVenueBooking,
					{
						headers: { authorization: `bearer ${orgAdminToken}` },
						variables: {
							input: {
								eventId,
								venueId,
							},
						},
					},
				);

				expect(createVenueBookingResult.errors).toBeUndefined();
				expect(createVenueBookingResult.data?.createVenueBooking).toEqual(
					expect.objectContaining({
						id: venueId,
						organization: {
							id: orgId,
						},
					}),
				);
			});
		},
	);

	suite(
		`results in a graphql error with "unexpected" extensions code in the "errors" field and "null" as the value of "data.createVenueBooking" field if`,
		() => {
			/**
			 * Tests edge case handling for database insert returning undefined.
			 * This tests the defensive code that handles the unlikely scenario
			 * where Postgres insert operation returns an empty array.
			 */
			test("database insert operation unexpectedly returns undefined instead of the created venue booking.", async () => {
				const orgId = await createTestOrganization();
				const venueId = await createTestVenue(orgId);
				const eventId = await createTestEvent(orgId);

				// Store original insert method
				const originalInsert = server.drizzleClient.insert;

				// Mock the drizzleClient.insert().returning() to return an empty array
				server.drizzleClient.insert = vi.fn().mockReturnValue({
					values: vi.fn().mockReturnValue({
						returning: vi.fn().mockResolvedValue([]),
					}),
				}) as never;

				try {
					const createVenueBookingResult = await mercuriusClient.mutate(
						Mutation_createVenueBooking,
						{
							headers: { authorization: `bearer ${adminToken}` },
							variables: {
								input: {
									eventId,
									venueId,
								},
							},
						},
					);

					expect(createVenueBookingResult.data?.createVenueBooking).toEqual(
						null,
					);
					expect(createVenueBookingResult.errors).toEqual(
						expect.arrayContaining<TalawaGraphQLFormattedError>([
							expect.objectContaining<TalawaGraphQLFormattedError>({
								extensions: expect.objectContaining<UnexpectedExtensions>({
									code: "unexpected",
								}),
								message: expect.any(String),
								path: ["createVenueBooking"],
							}),
						]),
					);
				} finally {
					// Restore original implementation
					server.drizzleClient.insert = originalInsert;
				}
			});
		},
	);
});
