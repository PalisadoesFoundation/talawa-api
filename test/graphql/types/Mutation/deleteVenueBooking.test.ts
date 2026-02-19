import { faker } from "@faker-js/faker";
import { graphql } from "gql.tada";
import { afterEach, beforeAll, expect, suite, test, vi } from "vitest";
import type {
	ArgumentsAssociatedResourcesNotFoundExtensions,
	InvalidArgumentsExtensions,
	TalawaGraphQLFormattedError,
	UnauthenticatedExtensions,
	UnauthorizedActionOnArgumentsAssociatedResourcesExtensions,
	UnexpectedExtensions,
} from "~/src/utilities/TalawaGraphQLError";
import { assertToBeNonNullish } from "../../../helpers";
import { getAdminAuthViaRest } from "../../../helpers/adminAuthRest";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	Mutation_createEvent,
	Mutation_createOrganization,
	Mutation_createOrganizationMembership,
	Mutation_createUser,
	Query_currentUser,
} from "../documentNodes";

afterEach(() => {
	vi.clearAllMocks();
});

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

const Mutation_deleteVenueBooking = graphql(`
	mutation Mutation_deleteVenueBooking($input: MutationDeleteVenueBookingInput!) {
		deleteVenueBooking(input: $input) {
			id
			name
			description
			capacity
			organization { id }
			attachments { mimeType }
		}
	}
`);

const { accessToken: adminToken } = await getAdminAuthViaRest(server);
const currentUserResult = await mercuriusClient.query(Query_currentUser, {
	headers: { authorization: `bearer ${adminToken}` },
});
const _adminUserId = currentUserResult.data?.currentUser?.id;
assertToBeNonNullish(adminToken);
assertToBeNonNullish(_adminUserId);
const adminUserId: string = _adminUserId;

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
 * Helper to create a venue booking.
 */
async function createTestVenueBooking(eventId: string, venueId: string) {
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
	assertToBeNonNullish(createVenueBookingResult.data?.createVenueBooking?.id);
	return createVenueBookingResult.data.createVenueBooking.id;
}

// Create users at suite level to avoid rate limiting
let testUser1: { userId: string; authToken: string };
let testUser2: { userId: string; authToken: string };
let testUser3: { userId: string; authToken: string };

beforeAll(async () => {
	// Create 3 users to be reused across tests
	testUser1 = await createRegularUserHelper();
	testUser2 = await createRegularUserHelper();
	testUser3 = await createRegularUserHelper();
});

/**
 * Helper to create a regular user with no org membership (used only in beforeAll).
 */
async function createRegularUserHelper() {
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
 * Test suite for the deleteVenueBooking GraphQL mutation.
 *
 * This suite validates all aspects of venue booking deletion including:
 * - Authentication and authorization checks
 * - Input validation (UUID/ULID format)
 * - Resource existence validation (event, venue, and booking)
 * - Business logic (authorization for deletion)
 * - Edge cases and error conditions
 */
suite("Mutation field deleteVenueBooking", () => {
	suite(
		`results in a graphql error with "unauthenticated" extensions code in the "errors" field and "null" as the value of "data.deleteVenueBooking" field if`,
		() => {
			/**
			 * Tests that unauthenticated requests are properly rejected.
			 */
			test("client triggering the graphql operation is not authenticated.", async () => {
				const orgId = await createTestOrganization();
				const venueId = await createTestVenue(orgId);
				const eventId = await createTestEvent(orgId);
				await createTestVenueBooking(eventId, venueId);

				// Try to delete venue booking without authentication
				const deleteVenueBookingResult = await mercuriusClient.mutate(
					Mutation_deleteVenueBooking,
					{
						variables: {
							input: {
								eventId,
								venueId,
							},
						},
					},
				);

				expect(deleteVenueBookingResult.data?.deleteVenueBooking).toEqual(null);
				expect(deleteVenueBookingResult.errors).toEqual(
					expect.arrayContaining<TalawaGraphQLFormattedError>([
						expect.objectContaining<TalawaGraphQLFormattedError>({
							extensions: expect.objectContaining<UnauthenticatedExtensions>({
								code: "unauthenticated",
							}),
							message: expect.any(String),
							path: ["deleteVenueBooking"],
						}),
					]),
				);
			});

			/**
			 * Tests that deleted user tokens are properly invalidated.
			 */
			test("client triggering the graphql operation has no existing user associated to their authentication context.", async () => {
				// Create a temporary user to delete (can't reuse pre-created users)
				const { authToken: userToken } = await createRegularUserHelper();

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
				await createTestVenueBooking(eventId, venueId);

				// Try to delete venue booking with deleted user's token
				const deleteVenueBookingResult = await mercuriusClient.mutate(
					Mutation_deleteVenueBooking,
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

				expect(deleteVenueBookingResult.data?.deleteVenueBooking).toEqual(null);
				expect(deleteVenueBookingResult.errors).toEqual(
					expect.arrayContaining<TalawaGraphQLFormattedError>([
						expect.objectContaining<TalawaGraphQLFormattedError>({
							extensions: expect.objectContaining<UnauthenticatedExtensions>({
								code: "unauthenticated",
							}),
							message: expect.any(String),
							path: ["deleteVenueBooking"],
						}),
					]),
				);
			});
		},
	);

	suite(
		`results in a graphql error with "invalid_arguments" extensions code in the "errors" field and "null" as the value of "data.deleteVenueBooking" field if`,
		() => {
			/**
			 * Tests UUID/ULID format validation for eventId.
			 */
			test('value of the argument "input.eventId" is not a valid UUID/ULID format.', async () => {
				const deleteVenueBookingResult = await mercuriusClient.mutate(
					Mutation_deleteVenueBooking,
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

				expect(deleteVenueBookingResult.data?.deleteVenueBooking).toEqual(null);
				expect(deleteVenueBookingResult.errors).toEqual(
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
							path: ["deleteVenueBooking"],
						}),
					]),
				);
			});

			/**
			 * Tests UUID/ULID format validation for venueId.
			 */
			test('value of the argument "input.venueId" is not a valid UUID/ULID format.', async () => {
				const deleteVenueBookingResult = await mercuriusClient.mutate(
					Mutation_deleteVenueBooking,
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

				expect(deleteVenueBookingResult.data?.deleteVenueBooking).toEqual(null);
				expect(deleteVenueBookingResult.errors).toEqual(
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
							path: ["deleteVenueBooking"],
						}),
					]),
				);
			});
		},
	);

	suite(
		`results in a graphql error with "arguments_associated_resources_not_found" extensions code in the "errors" field and "null" as the value of "data.deleteVenueBooking" field if`,
		() => {
			/**
			 * Tests validation when both event and venue don't exist.
			 */
			test('values of the arguments "input.eventId" and "input.venueId" do not correspond to existing event and venue.', async () => {
				const deleteVenueBookingResult = await mercuriusClient.mutate(
					Mutation_deleteVenueBooking,
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

				expect(deleteVenueBookingResult.data?.deleteVenueBooking).toEqual(null);
				expect(deleteVenueBookingResult.errors).toEqual(
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
							path: ["deleteVenueBooking"],
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

				const deleteVenueBookingResult = await mercuriusClient.mutate(
					Mutation_deleteVenueBooking,
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

				expect(deleteVenueBookingResult.data?.deleteVenueBooking).toEqual(null);
				expect(deleteVenueBookingResult.errors).toEqual(
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
							path: ["deleteVenueBooking"],
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

				const deleteVenueBookingResult = await mercuriusClient.mutate(
					Mutation_deleteVenueBooking,
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

				expect(deleteVenueBookingResult.data?.deleteVenueBooking).toEqual(null);
				expect(deleteVenueBookingResult.errors).toEqual(
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
							path: ["deleteVenueBooking"],
						}),
					]),
				);
			});

			/**
			 * Tests validation when venue booking doesn't exist.
			 */
			test('venue booking does not exist for the given "input.eventId" and "input.venueId".', async () => {
				const orgId = await createTestOrganization();
				const venueId = await createTestVenue(orgId);
				const eventId = await createTestEvent(orgId);
				// Note: We do NOT create a venue booking here

				const deleteVenueBookingResult = await mercuriusClient.mutate(
					Mutation_deleteVenueBooking,
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

				expect(deleteVenueBookingResult.data?.deleteVenueBooking).toEqual(null);
				expect(deleteVenueBookingResult.errors).toEqual(
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
							path: ["deleteVenueBooking"],
						}),
					]),
				);
			});
		},
	);

	suite(
		`results in a graphql error with "unauthorized_action_on_arguments_associated_resources" extensions code in the "errors" field and "null" as the value of "data.deleteVenueBooking" field if`,
		() => {
			/**
			 * Tests authorization for non-admin organization member.
			 */
			test("client is a non-admin organization member.", async () => {
				const orgId = await createTestOrganization();
				const venueId = await createTestVenue(orgId);
				const eventId = await createTestEvent(orgId);
				await createTestVenueBooking(eventId, venueId);

				// Use pre-created user
				const { userId: regularUserId, authToken: regularUserToken } =
					testUser1;

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

				// Try to delete venue booking as non-admin member
				const deleteVenueBookingResult = await mercuriusClient.mutate(
					Mutation_deleteVenueBooking,
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

				expect(deleteVenueBookingResult.data?.deleteVenueBooking).toEqual(null);
				expect(deleteVenueBookingResult.errors).toEqual(
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
							path: ["deleteVenueBooking"],
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
				await createTestVenueBooking(eventId, venueId);

				// Use pre-created user (not a member of the organization)
				const { authToken: regularUserToken } = testUser2;

				// Try to delete venue booking as non-member user
				const deleteVenueBookingResult = await mercuriusClient.mutate(
					Mutation_deleteVenueBooking,
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

				expect(deleteVenueBookingResult.data?.deleteVenueBooking).toEqual(null);
				expect(deleteVenueBookingResult.errors).toEqual(
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
							path: ["deleteVenueBooking"],
						}),
					]),
				);
			});
		},
	);

	suite(
		"returns the venue associated with the deleted venue booking if",
		() => {
			/**
			 * Tests successful venue booking deletion by platform administrator.
			 */
			test("client is a platform administrator.", async () => {
				const orgId = await createTestOrganization();
				const venueId = await createTestVenue(orgId);
				const eventId = await createTestEvent(orgId);
				await createTestVenueBooking(eventId, venueId);

				// Delete venue booking as platform administrator
				const deleteVenueBookingResult = await mercuriusClient.mutate(
					Mutation_deleteVenueBooking,
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

				expect(deleteVenueBookingResult.errors).toBeUndefined();
				expect(deleteVenueBookingResult.data?.deleteVenueBooking).toEqual(
					expect.objectContaining({
						id: venueId,
						organization: {
							id: orgId,
						},
					}),
				);
			});

			/**
			 * Tests successful venue booking deletion by organization administrator.
			 */
			test("client is an administrator member of the organization.", async () => {
				const orgId = await createTestOrganization();
				const venueId = await createTestVenue(orgId);
				const eventId = await createTestEvent(orgId);
				await createTestVenueBooking(eventId, venueId);

				// Use pre-created user
				const { userId: orgAdminUserId, authToken: orgAdminToken } = testUser3;

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

				// Delete venue booking as organization administrator
				const deleteVenueBookingResult = await mercuriusClient.mutate(
					Mutation_deleteVenueBooking,
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

				expect(deleteVenueBookingResult.errors).toBeUndefined();
				expect(deleteVenueBookingResult.data?.deleteVenueBooking).toEqual(
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
		`results in a graphql error with "unexpected" extensions code in the "errors" field and "null" as the value of "data.deleteVenueBooking" field if`,
		() => {
			/**
			 * Tests edge case handling for database delete returning undefined.
			 * This tests the defensive code that handles the unlikely scenario
			 * where Postgres delete operation returns an empty array.
			 */
			test("database delete operation unexpectedly returns undefined instead of the deleted venue booking.", async () => {
				const orgId = await createTestOrganization();
				const venueId = await createTestVenue(orgId);
				const eventId = await createTestEvent(orgId);
				await createTestVenueBooking(eventId, venueId);

				// Mock the drizzleClient.delete().returning() to return an empty array
				const mockReturning = vi.fn().mockResolvedValue([]);
				vi.spyOn(server.drizzleClient, "delete").mockReturnValueOnce({
					where: vi.fn().mockReturnValue({
						returning: mockReturning,
					}),
				} as never);

				try {
					const deleteVenueBookingResult = await mercuriusClient.mutate(
						Mutation_deleteVenueBooking,
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

					expect(deleteVenueBookingResult.data?.deleteVenueBooking).toEqual(
						null,
					);
					expect(deleteVenueBookingResult.errors).toEqual(
						expect.arrayContaining<TalawaGraphQLFormattedError>([
							expect.objectContaining<TalawaGraphQLFormattedError>({
								extensions: expect.objectContaining<UnexpectedExtensions>({
									code: "unexpected",
								}),
								message: expect.any(String),
								path: ["deleteVenueBooking"],
							}),
						]),
					);
				} finally {
					// Restore original implementation
					vi.restoreAllMocks();
				}
			});
		},
	);
});
