import { faker } from "@faker-js/faker";
import { afterEach, beforeAll, expect, suite, test, vi } from "vitest";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import { createRegularUserUsingAdmin } from "../createRegularUserUsingAdmin";
import {
	Mutation_createEvent,
	Mutation_createOrganization,
	Mutation_createOrganizationMembership,
	Mutation_joinPublicOrganization,
	Query_signIn,
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

const VenueEventsQuery = `
  query VenueEvents($input: QueryVenueInput!, $first: Int, $after: String, $last: Int, $before: String) {
    venue(input: $input) {
      id
      events(first: $first, after: $after, last: $last, before: $before) {
        edges {
          node {
            id
            name
            description
            attachments {
              mimeType
              url
            }
          }
          cursor
        }
        pageInfo {
          hasNextPage
          hasPreviousPage
          startCursor
          endCursor
        }
      }
    }
  }
`;

const Mutation_createVenue = `
  mutation CreateVenue($input: MutationCreateVenueInput!) {
    createVenue(input: $input) {
      id
      name
      description
      capacity
    }
  }
`;

const Mutation_createVenueBooking = `
  mutation CreateVenueBooking($input: MutationCreateVenueBookingInput!) {
    createVenueBooking(input: $input) {
      id
    }
  }
`;

suite("Venue events Field", () => {
	test("should allow access for organization administrator (non-global admin)", async () => {
		// Create organization with global admin
		const createOrgResult = await mercuriusClient.mutate(
			Mutation_createOrganization,
			{
				headers: { authorization: `Bearer ${authToken}` },
				variables: {
					input: {
						name: `Test Org ${faker.string.uuid()}`,
						description: "Test organization for venue events",
					},
				},
			},
		);
		const orgId = createOrgResult.data?.createOrganization?.id;
		assertToBeNonNullish(orgId);

		// Create venue
		const createVenueResult = await mercuriusClient.mutate(
			Mutation_createVenue,
			{
				headers: { authorization: `Bearer ${authToken}` },
				variables: {
					input: {
						organizationId: orgId,
						name: `Test Venue ${faker.string.uuid()}`,
						description: "Test venue for events",
						capacity: 100,
					},
				},
			},
		);
		const venueId = createVenueResult.data?.createVenue?.id;
		assertToBeNonNullish(venueId);

		// Create regular user and make them org admin
		const { authToken: orgAdminToken, userId: orgAdminUserId } =
			await createRegularUserUsingAdmin();

		// Add user as organization administrator
		const addMemberResult = await mercuriusClient.mutate(
			Mutation_createOrganizationMembership,
			{
				headers: { authorization: `Bearer ${authToken}` },
				variables: {
					input: {
						organizationId: orgId,
						memberId: orgAdminUserId,
						role: "administrator",
					},
				},
			},
		);
		expect(addMemberResult.errors).toBeUndefined();

		// Test that org admin CAN access venue events
		const result = await mercuriusClient.query(VenueEventsQuery, {
			headers: { authorization: `Bearer ${orgAdminToken}` },
			variables: { input: { id: venueId }, first: 10 },
		});

		expect(result.errors).toBeUndefined();
		expect(result.data?.venue?.events).toBeDefined();
		expect(result.data?.venue?.events?.edges).toEqual([]);
	});

	test("should deny access for organization member who is not an admin", async () => {
		// Create organization with global admin
		const createOrgResult = await mercuriusClient.mutate(
			Mutation_createOrganization,
			{
				headers: { authorization: `Bearer ${authToken}` },
				variables: {
					input: {
						name: `Test Org ${faker.string.uuid()}`,
						description: "Test organization for venue events",
					},
				},
			},
		);
		const orgId = createOrgResult.data?.createOrganization?.id;
		assertToBeNonNullish(orgId);

		// Create venue
		const createVenueResult = await mercuriusClient.mutate(
			Mutation_createVenue,
			{
				headers: { authorization: `Bearer ${authToken}` },
				variables: {
					input: {
						organizationId: orgId,
						name: `Test Venue ${faker.string.uuid()}`,
						description: "Test venue for events",
						capacity: 100,
					},
				},
			},
		);
		const venueId = createVenueResult.data?.createVenue?.id;
		assertToBeNonNullish(venueId);

		// Create regular user and make them regular org member
		const { authToken: memberToken, userId: memberUserId } =
			await createRegularUserUsingAdmin();

		// Add user as regular organization member (not admin)
		const addMemberResult = await mercuriusClient.mutate(
			Mutation_createOrganizationMembership,
			{
				headers: { authorization: `Bearer ${authToken}` },
				variables: {
					input: {
						organizationId: orgId,
						memberId: memberUserId,
						role: "regular",
					},
				},
			},
		);
		expect(addMemberResult.errors).toBeUndefined();

		// Test that regular member is DENIED access
		const result = await mercuriusClient.query(VenueEventsQuery, {
			headers: { authorization: `Bearer ${memberToken}` },
			variables: { input: { id: venueId }, first: 10 },
		});

		expect(result.data?.venue?.events).toBeNull();
		expect(result.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					extensions: expect.objectContaining({
						code: "unauthorized_action",
					}),
				}),
			]),
		);
	});

	test("should throw unauthenticated error if not logged in", async () => {
		const createOrgResult = await mercuriusClient.mutate(
			Mutation_createOrganization,
			{
				headers: { authorization: `Bearer ${authToken}` },
				variables: {
					input: {
						name: `Venue Events Test Org ${faker.string.uuid()}`,
						description: "Org to test venue events",
						countryCode: "us",
						state: "CA",
						city: "San Francisco",
						postalCode: "94101",
						addressLine1: "100 Test St",
						addressLine2: "Suite 1",
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
						name: `Test Venue ${faker.string.uuid()}`,
						description: "Test venue for events",
						organizationId: orgId,
						capacity: 100,
					},
				},
			},
		);

		const venueId = createVenueResult.data?.createVenue?.id;
		assertToBeNonNullish(venueId);

		const result = await mercuriusClient.query(VenueEventsQuery, {
			variables: { input: { id: venueId }, first: 10 },
		});

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

	test("should throw unauthenticated error when current user not found in database", async () => {
		const createOrgResult = await mercuriusClient.mutate(
			Mutation_createOrganization,
			{
				headers: { authorization: `Bearer ${authToken}` },
				variables: {
					input: {
						name: `Missing User Venue Org ${faker.string.uuid()}`,
						description: "Org to test missing user",
						countryCode: "us",
						state: "CA",
						city: "San Francisco",
						postalCode: "94101",
						addressLine1: "100 Test St",
						addressLine2: "Suite 1",
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
						name: `Test Venue ${faker.string.uuid()}`,
						description: "Test venue for missing user",
						organizationId: orgId,
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

		const result = await mercuriusClient.query(VenueEventsQuery, {
			headers: { authorization: `Bearer ${authToken}` },
			variables: { input: { id: venueId }, first: 10 },
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

	test("should return empty connection when no events exist for venue", async () => {
		const createOrgResult = await mercuriusClient.mutate(
			Mutation_createOrganization,
			{
				headers: { authorization: `Bearer ${authToken}` },
				variables: {
					input: {
						name: `No Events Venue Org ${faker.string.uuid()}`,
						description: "Org with venue with no events",
						countryCode: "us",
						state: "CA",
						city: "San Francisco",
						postalCode: "94101",
						addressLine1: "100 Test St",
						addressLine2: "Suite 1",
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
						name: `Test Venue ${faker.string.uuid()}`,
						description: "Test venue with no events",
						organizationId: orgId,
						capacity: 100,
					},
				},
			},
		);

		const venueId = createVenueResult.data?.createVenue?.id;
		assertToBeNonNullish(venueId);

		const result = await mercuriusClient.query(VenueEventsQuery, {
			headers: { authorization: `Bearer ${authToken}` },
			variables: { input: { id: venueId }, first: 10 },
		});

		expect(result.errors).toBeUndefined();
		expect(result.data?.venue?.events?.edges).toEqual([]);
		expect(result.data?.venue?.events?.pageInfo).toEqual({
			hasNextPage: false,
			hasPreviousPage: false,
			startCursor: null,
			endCursor: null,
		});
	});

	test("should throw unauthorized error for non-admin user", async () => {
		const createOrgResult = await mercuriusClient.mutate(
			Mutation_createOrganization,
			{
				headers: { authorization: `Bearer ${authToken}` },
				variables: {
					input: {
						name: `Unauthorized Venue Events Org ${faker.string.uuid()}`,
						description: "Org to test unauthorized access",
						countryCode: "us",
						state: "CA",
						city: "San Francisco",
						postalCode: "94101",
						addressLine1: "100 Test St",
						addressLine2: "Suite 1",
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
						name: `Test Venue ${faker.string.uuid()}`,
						description: "Test venue for unauthorized access",
						organizationId: orgId,
						capacity: 100,
					},
				},
			},
		);

		const venueId = createVenueResult.data?.createVenue?.id;
		assertToBeNonNullish(venueId);

		const { authToken: regularAuthToken } = await createRegularUserUsingAdmin();

		const result = await mercuriusClient.query(VenueEventsQuery, {
			headers: { authorization: `Bearer ${regularAuthToken}` },
			variables: { input: { id: venueId }, first: 10 },
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

	test("should throw invalid argument error for bad cursor", async () => {
		const createOrgResult = await mercuriusClient.mutate(
			Mutation_createOrganization,
			{
				headers: { authorization: `Bearer ${authToken}` },
				variables: {
					input: {
						name: `Invalid Cursor Venue Org ${faker.string.uuid()}`,
						description: "Org to test invalid cursor",
						countryCode: "us",
						state: "CA",
						city: "San Francisco",
						postalCode: "94101",
						addressLine1: "100 Test St",
						addressLine2: "Suite 1",
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
						name: `Test Venue ${faker.string.uuid()}`,
						description: "Test venue for invalid cursor",
						organizationId: orgId,
						capacity: 100,
					},
				},
			},
		);

		const venueId = createVenueResult.data?.createVenue?.id;
		assertToBeNonNullish(venueId);

		const result = await mercuriusClient.query(VenueEventsQuery, {
			headers: { authorization: `Bearer ${authToken}` },
			variables: { input: { id: venueId }, first: 10, after: "invalid-cursor" },
		});

		expect(result.data?.venue?.events).toBeNull();
		expect(result.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					extensions: expect.objectContaining({
						code: "invalid_arguments",
						issues: expect.arrayContaining([
							expect.objectContaining({
								argumentPath: ["after"],
							}),
						]),
					}),
				}),
			]),
		);
	});

	test("should throw resource not found if cursor returns no results", async () => {
		const createOrgResult = await mercuriusClient.mutate(
			Mutation_createOrganization,
			{
				headers: { authorization: `Bearer ${authToken}` },
				variables: {
					input: {
						name: `Cursor Test Venue Org ${faker.string.uuid()}`,
						description: "Org to test cursor not found",
						countryCode: "us",
						state: "CA",
						city: "San Francisco",
						postalCode: "94101",
						addressLine1: "100 Test St",
						addressLine2: "Suite 1",
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
						name: `Test Venue ${faker.string.uuid()}`,
						description: "Test venue for cursor test",
						organizationId: orgId,
						capacity: 100,
					},
				},
			},
		);

		const venueId = createVenueResult.data?.createVenue?.id;
		assertToBeNonNullish(venueId);

		const fakeCursor = Buffer.from(
			JSON.stringify({
				eventId: faker.string.uuid(),
				createdAt: new Date().toISOString(),
			}),
		).toString("base64url");

		const result = await mercuriusClient.query(VenueEventsQuery, {
			headers: { authorization: `Bearer ${authToken}` },
			variables: { input: { id: venueId }, first: 10, after: fakeCursor },
		});

		expect(result.data?.venue?.events).toBeNull();
		expect(result.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					extensions: expect.objectContaining({
						code: "arguments_associated_resources_not_found",
						issues: expect.arrayContaining([
							expect.objectContaining({
								argumentPath: ["after"],
							}),
						]),
					}),
				}),
			]),
		);
	});

	test("should throw invalid argument error for bad cursor in before parameter", async () => {
		const createOrgResult = await mercuriusClient.mutate(
			Mutation_createOrganization,
			{
				headers: { authorization: `Bearer ${authToken}` },
				variables: {
					input: {
						name: `Invalid Before Cursor Venue Org ${faker.string.uuid()}`,
						description: "Org to test invalid before cursor",
						countryCode: "us",
						state: "CA",
						city: "San Francisco",
						postalCode: "94101",
						addressLine1: "100 Test St",
						addressLine2: "Suite 1",
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
						name: `Test Venue ${faker.string.uuid()}`,
						description: "Test venue for invalid before cursor",
						organizationId: orgId,
						capacity: 100,
					},
				},
			},
		);

		const venueId = createVenueResult.data?.createVenue?.id;
		assertToBeNonNullish(venueId);

		const result = await mercuriusClient.query(VenueEventsQuery, {
			headers: { authorization: `Bearer ${authToken}` },
			variables: { input: { id: venueId }, last: 10, before: "invalid-cursor" },
		});

		expect(result.data?.venue?.events).toBeNull();
		expect(result.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					extensions: expect.objectContaining({
						code: "invalid_arguments",
						issues: expect.arrayContaining([
							expect.objectContaining({
								argumentPath: ["before"],
							}),
						]),
					}),
				}),
			]),
		);
	});

	test("should return events for venue with proper venue bookings", async () => {
		const createOrgResult = await mercuriusClient.mutate(
			Mutation_createOrganization,
			{
				headers: { authorization: `Bearer ${authToken}` },
				variables: {
					input: {
						name: `Events Venue Org ${faker.string.uuid()}`,
						description: "Org with venue with events",
						countryCode: "us",
						state: "CA",
						city: "San Francisco",
						postalCode: "94101",
						addressLine1: "100 Test St",
						addressLine2: "Suite 1",
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
						name: `Test Venue ${faker.string.uuid()}`,
						description: "Test venue with events",
						organizationId: orgId,
						capacity: 100,
					},
				},
			},
		);

		const venueId = createVenueResult.data?.createVenue?.id;
		assertToBeNonNullish(venueId);

		// Add regular user as organization member
		const { authToken: memberAuthToken } = await createRegularUserUsingAdmin();

		const joinResult = await mercuriusClient.mutate(
			Mutation_joinPublicOrganization,
			{
				headers: { authorization: `Bearer ${memberAuthToken}` },
				variables: {
					input: {
						organizationId: orgId,
					},
				},
			},
		);
		expect(joinResult.errors).toBeUndefined();

		// Create an event with the member token
		const createEventResult = await mercuriusClient.mutate(
			Mutation_createEvent,
			{
				headers: { authorization: `Bearer ${memberAuthToken}` },
				variables: {
					input: {
						name: `Test Event ${faker.string.uuid()}`,
						description: "Test event for venue",
						organizationId: orgId,
						startAt: new Date(Date.now() + 86400000).toISOString(),
						endAt: new Date(Date.now() + 90000000).toISOString(),
					},
				},
			},
		);

		const eventId = createEventResult.data?.createEvent?.id;
		assertToBeNonNullish(eventId);

		// Create venue booking with admin token
		await mercuriusClient.mutate(Mutation_createVenueBooking, {
			headers: { authorization: `Bearer ${authToken}` },
			variables: {
				input: {
					venueId: venueId,
					eventId: eventId,
				},
			},
		});

		const result = await mercuriusClient.query(VenueEventsQuery, {
			headers: { authorization: `Bearer ${authToken}` },
			variables: { input: { id: venueId }, first: 10 },
		});

		expect(result.errors).toBeUndefined();
		expect(result.data?.venue?.events?.edges).toHaveLength(1);
		expect(result.data?.venue?.events?.edges?.[0]?.node?.id).toBe(eventId);
	});

	test("should handle events with null attachmentsWhereEvent", async () => {
		const createOrgResult = await mercuriusClient.mutate(
			Mutation_createOrganization,
			{
				headers: { authorization: `Bearer ${authToken}` },
				variables: {
					input: {
						name: `Null Attachments Venue Org ${faker.string.uuid()}`,
						description: "Org with venue with events",
						countryCode: "us",
						state: "CA",
						city: "San Francisco",
						postalCode: "94101",
						addressLine1: "100 Test St",
						addressLine2: "Suite 1",
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
						name: `Test Venue ${faker.string.uuid()}`,
						description: "Test venue with events",
						organizationId: orgId,
						capacity: 100,
					},
				},
			},
		);

		const venueId = createVenueResult.data?.createVenue?.id;
		assertToBeNonNullish(venueId);

		// Add regular user as organization member
		const { authToken: memberAuthToken } = await createRegularUserUsingAdmin();

		await mercuriusClient.mutate(Mutation_joinPublicOrganization, {
			headers: { authorization: `Bearer ${memberAuthToken}` },
			variables: {
				input: {
					organizationId: orgId,
				},
			},
		});

		// Create an event with the member token (events created without attachments will have null attachmentsWhereEvent)
		const createEventResult = await mercuriusClient.mutate(
			Mutation_createEvent,
			{
				headers: { authorization: `Bearer ${memberAuthToken}` },
				variables: {
					input: {
						name: `Test Event ${faker.string.uuid()}`,
						description: "Test event for venue",
						organizationId: orgId,
						startAt: new Date(Date.now() + 86400000).toISOString(),
						endAt: new Date(Date.now() + 90000000).toISOString(),
					},
				},
			},
		);

		const eventId = createEventResult.data?.createEvent?.id;
		assertToBeNonNullish(eventId);

		// Create venue booking with admin token
		await mercuriusClient.mutate(Mutation_createVenueBooking, {
			headers: { authorization: `Bearer ${authToken}` },
			variables: {
				input: {
					venueId: venueId,
					eventId: eventId,
				},
			},
		});

		// Mock the query to return event with null attachmentsWhereEvent
		// The original query includes with: { event: { with: { attachmentsWhereEvent: true } } }
		// so the result will have the event relation, but TypeScript needs a type assertion
		const originalFindMany =
			server.drizzleClient.query.venueBookingsTable.findMany;
		server.drizzleClient.query.venueBookingsTable.findMany = vi
			.fn()
			.mockImplementation(async (options) => {
				// Call original but modify the result to set attachmentsWhereEvent to null
				// The options include the event relation, so the result will have it
				const result = await originalFindMany.call(
					server.drizzleClient.query.venueBookingsTable,
					options,
				);
				// Type assertion: the query includes event relation, so booking will have event property
				type BookingWithEvent = (typeof result)[number] & {
					event: { attachmentsWhereEvent: unknown } | null;
				};
				// Modify the event to have null attachmentsWhereEvent
				return result.map((booking) => {
					const bookingWithEvent = booking as BookingWithEvent;
					if (!bookingWithEvent.event) {
						return booking;
					}
					return {
						...bookingWithEvent,
						event: {
							...bookingWithEvent.event,
							attachmentsWhereEvent: null,
						},
					};
				});
			});

		try {
			const result = await mercuriusClient.query(VenueEventsQuery, {
				headers: { authorization: `Bearer ${authToken}` },
				variables: { input: { id: venueId }, first: 10 },
			});

			expect(result.errors).toBeUndefined();
			expect(result.data?.venue?.events?.edges).toHaveLength(1);
			expect(result.data?.venue?.events?.edges?.[0]?.node?.id).toBe(eventId);
			// Attachments should be empty array when attachmentsWhereEvent is null (covered by the || [] fallback)
			const attachments =
				result.data?.venue?.events?.edges?.[0]?.node?.attachments;
			expect(attachments).toBeDefined();
			expect(attachments).toEqual([]);
		} finally {
			server.drizzleClient.query.venueBookingsTable.findMany = originalFindMany;
		}
	});

	test("should handle forward pagination with cursor (first + after)", async () => {
		const createOrgResult = await mercuriusClient.mutate(
			Mutation_createOrganization,
			{
				headers: { authorization: `Bearer ${authToken}` },
				variables: {
					input: {
						name: `Forward Pagination Venue Org ${faker.string.uuid()}`,
						description: "Org for forward pagination test",
						countryCode: "us",
						state: "CA",
						city: "San Francisco",
						postalCode: "94101",
						addressLine1: "100 Test St",
						addressLine2: "Suite 1",
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
						name: `Test Venue ${faker.string.uuid()}`,
						description: "Test venue for forward pagination",
						organizationId: orgId,
						capacity: 100,
					},
				},
			},
		);

		const venueId = createVenueResult.data?.createVenue?.id;
		assertToBeNonNullish(venueId);

		// Create member and join organization
		const { authToken: memberAuthToken } = await createRegularUserUsingAdmin();

		await mercuriusClient.mutate(Mutation_joinPublicOrganization, {
			headers: { authorization: `Bearer ${memberAuthToken}` },
			variables: {
				input: {
					organizationId: orgId,
				},
			},
		});

		// Create multiple events
		const createEventPromises = Array.from({ length: 3 }, (_, i) =>
			mercuriusClient.mutate(Mutation_createEvent, {
				headers: { authorization: `Bearer ${memberAuthToken}` },
				variables: {
					input: {
						name: `Forward Event ${i} ${faker.string.uuid()}`,
						description: `Test event ${i} for venue`,
						organizationId: orgId,
						startAt: new Date(
							Date.now() + 86400000 + i * 3600000,
						).toISOString(),
						endAt: new Date(Date.now() + 90000000 + i * 3600000).toISOString(),
					},
				},
			}),
		);

		const eventResults = await Promise.all(createEventPromises);
		const eventIds = eventResults.map((result) => {
			const eventId = result.data?.createEvent?.id;
			assertToBeNonNullish(eventId);
			return eventId;
		});

		for (const eventId of eventIds) {
			await mercuriusClient.mutate(Mutation_createVenueBooking, {
				headers: { authorization: `Bearer ${authToken}` },
				variables: {
					input: {
						venueId: venueId,
						eventId: eventId,
					},
				},
			});
		}

		// Get first page
		const firstPageResult = await mercuriusClient.query(VenueEventsQuery, {
			headers: { authorization: `Bearer ${authToken}` },
			variables: { input: { id: venueId }, first: 2 },
		});

		expect(firstPageResult.errors).toBeUndefined();
		expect(firstPageResult.data?.venue?.events?.edges).toHaveLength(2);
		expect(firstPageResult.data?.venue?.events?.pageInfo?.hasNextPage).toBe(
			true,
		);

		// Get second page using cursor
		const endCursor = firstPageResult.data?.venue?.events?.pageInfo?.endCursor;
		assertToBeNonNullish(endCursor);

		const secondPageResult = await mercuriusClient.query(VenueEventsQuery, {
			headers: { authorization: `Bearer ${authToken}` },
			variables: { input: { id: venueId }, first: 2, after: endCursor },
		});

		expect(secondPageResult.errors).toBeUndefined();
		expect(secondPageResult.data?.venue?.events?.edges).toHaveLength(1);
		expect(secondPageResult.data?.venue?.events?.pageInfo?.hasNextPage).toBe(
			false,
		);
	});

	test("should handle backward pagination without cursor (last only)", async () => {
		const createOrgResult = await mercuriusClient.mutate(
			Mutation_createOrganization,
			{
				headers: { authorization: `Bearer ${authToken}` },
				variables: {
					input: {
						name: `Backward No Cursor Venue Org ${faker.string.uuid()}`,
						description: "Org for backward pagination without cursor",
						countryCode: "us",
						state: "CA",
						city: "San Francisco",
						postalCode: "94101",
						addressLine1: "100 Test St",
						addressLine2: "Suite 1",
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
						name: `Test Venue ${faker.string.uuid()}`,
						description: "Test venue for backward pagination",
						organizationId: orgId,
						capacity: 100,
					},
				},
			},
		);

		const venueId = createVenueResult.data?.createVenue?.id;
		assertToBeNonNullish(venueId);

		// Create member and join organization
		const { authToken: memberAuthToken } = await createRegularUserUsingAdmin();

		await mercuriusClient.mutate(Mutation_joinPublicOrganization, {
			headers: { authorization: `Bearer ${memberAuthToken}` },
			variables: {
				input: {
					organizationId: orgId,
				},
			},
		});

		// Create multiple events
		const createEventPromises = Array.from({ length: 3 }, (_, i) =>
			mercuriusClient.mutate(Mutation_createEvent, {
				headers: { authorization: `Bearer ${memberAuthToken}` },
				variables: {
					input: {
						name: `Backward Event ${i} ${faker.string.uuid()}`,
						description: `Test event ${i} for venue`,
						organizationId: orgId,
						startAt: new Date(
							Date.now() + 86400000 + i * 3600000,
						).toISOString(),
						endAt: new Date(Date.now() + 90000000 + i * 3600000).toISOString(),
					},
				},
			}),
		);

		const eventResults = await Promise.all(createEventPromises);
		const eventIds = eventResults.map((result) => {
			const eventId = result.data?.createEvent?.id;
			assertToBeNonNullish(eventId);
			return eventId;
		});

		for (const eventId of eventIds) {
			await mercuriusClient.mutate(Mutation_createVenueBooking, {
				headers: { authorization: `Bearer ${authToken}` },
				variables: {
					input: {
						venueId: venueId,
						eventId: eventId,
					},
				},
			});
		}

		// Query using last without before cursor
		const result = await mercuriusClient.query(VenueEventsQuery, {
			headers: { authorization: `Bearer ${authToken}` },
			variables: { input: { id: venueId }, last: 2 },
		});

		expect(result.errors).toBeUndefined();
		expect(result.data?.venue?.events?.edges).toHaveLength(2);
		expect(result.data?.venue?.events?.pageInfo?.hasPreviousPage).toBe(true);
		expect(result.data?.venue?.events?.pageInfo?.startCursor).toBeTruthy();
	});

	test("should handle backward pagination with cursor (last + before)", async () => {
		const createOrgResult = await mercuriusClient.mutate(
			Mutation_createOrganization,
			{
				headers: { authorization: `Bearer ${authToken}` },
				variables: {
					input: {
						name: `Backward With Cursor Venue Org ${faker.string.uuid()}`,
						description: "Org for backward pagination with cursor",
						countryCode: "us",
						state: "CA",
						city: "San Francisco",
						postalCode: "94101",
						addressLine1: "100 Test St",
						addressLine2: "Suite 1",
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
						name: `Test Venue ${faker.string.uuid()}`,
						description: "Test venue for backward pagination with cursor",
						organizationId: orgId,
						capacity: 100,
					},
				},
			},
		);

		const venueId = createVenueResult.data?.createVenue?.id;
		assertToBeNonNullish(venueId);

		// Create member and join organization
		const { authToken: memberAuthToken } = await createRegularUserUsingAdmin();

		await mercuriusClient.mutate(Mutation_joinPublicOrganization, {
			headers: { authorization: `Bearer ${memberAuthToken}` },
			variables: {
				input: {
					organizationId: orgId,
				},
			},
		});

		// Create multiple events
		const createEventPromises = Array.from({ length: 3 }, (_, i) =>
			mercuriusClient.mutate(Mutation_createEvent, {
				headers: { authorization: `Bearer ${memberAuthToken}` },
				variables: {
					input: {
						name: `Backward Cursor Event ${i} ${faker.string.uuid()}`,
						description: `Test event ${i} for venue`,
						organizationId: orgId,
						startAt: new Date(
							Date.now() + 86400000 + i * 3600000,
						).toISOString(),
						endAt: new Date(Date.now() + 90000000 + i * 3600000).toISOString(),
					},
				},
			}),
		);

		const eventResults = await Promise.all(createEventPromises);
		const eventIds = eventResults.map((result) => {
			const eventId = result.data?.createEvent?.id;
			assertToBeNonNullish(eventId);
			return eventId;
		});

		for (const eventId of eventIds) {
			await mercuriusClient.mutate(Mutation_createVenueBooking, {
				headers: { authorization: `Bearer ${authToken}` },
				variables: {
					input: {
						venueId: venueId,
						eventId: eventId,
					},
				},
			});
		}

		// Get all events to get a cursor
		const allResult = await mercuriusClient.query(VenueEventsQuery, {
			headers: { authorization: `Bearer ${authToken}` },
			variables: { input: { id: venueId }, first: 10 },
		});

		expect(allResult.errors).toBeUndefined();
		expect(allResult.data?.venue?.events?.edges).toHaveLength(3);

		// Use the second event's cursor for backward pagination
		const secondEventCursor = allResult.data?.venue?.events?.edges?.[1]?.cursor;
		assertToBeNonNullish(secondEventCursor);

		const backwardResult = await mercuriusClient.query(VenueEventsQuery, {
			headers: { authorization: `Bearer ${authToken}` },
			variables: { input: { id: venueId }, last: 1, before: secondEventCursor },
		});

		expect(backwardResult.errors).toBeUndefined();
		expect(backwardResult.data?.venue?.events?.edges).toHaveLength(1);
		expect(backwardResult.data?.venue?.events?.pageInfo?.hasPreviousPage).toBe(
			false,
		);
	});

	test("should throw resource not found if cursor returns no results (before)", async () => {
		const createOrgResult = await mercuriusClient.mutate(
			Mutation_createOrganization,
			{
				headers: { authorization: `Bearer ${authToken}` },
				variables: {
					input: {
						name: `Before Cursor Test Venue Org ${faker.string.uuid()}`,
						description: "Org to test before cursor not found",
						countryCode: "us",
						state: "CA",
						city: "San Francisco",
						postalCode: "94101",
						addressLine1: "100 Test St",
						addressLine2: "Suite 1",
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
						name: `Test Venue ${faker.string.uuid()}`,
						description: "Test venue for before cursor test",
						organizationId: orgId,
						capacity: 100,
					},
				},
			},
		);

		const venueId = createVenueResult.data?.createVenue?.id;
		assertToBeNonNullish(venueId);

		const fakeCursor = Buffer.from(
			JSON.stringify({
				eventId: faker.string.uuid(),
				createdAt: new Date().toISOString(),
			}),
		).toString("base64url");

		const result = await mercuriusClient.query(VenueEventsQuery, {
			headers: { authorization: `Bearer ${authToken}` },
			variables: { input: { id: venueId }, last: 10, before: fakeCursor },
		});

		expect(result.data?.venue?.events).toBeNull();
		expect(result.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					extensions: expect.objectContaining({
						code: "arguments_associated_resources_not_found",
						issues: expect.arrayContaining([
							expect.objectContaining({
								argumentPath: ["before"],
							}),
						]),
					}),
				}),
			]),
		);
	});
	test.each([
		{ description: "event is undefined", eventData: undefined },
		{ description: "event is missing entirely", eventData: null }, // Simulating missing property via null for test simplicity
	])("should throw internal server error when booking event data is corrupt ($description)", async ({
		eventData,
	}) => {
		const createOrgResult = await mercuriusClient.mutate(
			Mutation_createOrganization,
			{
				headers: { authorization: `Bearer ${authToken}` },
				variables: {
					input: {
						name: `Corrupt Event Org ${faker.string.uuid()}`,
						description: "Org with venue with corrupt events",
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
						name: `Test Venue ${faker.string.uuid()}`,
						description: "Test venue with corrupt events",
						organizationId: orgId,
						capacity: 100,
					},
				},
			},
		);

		const venueId = createVenueResult.data?.createVenue?.id;
		assertToBeNonNullish(venueId);

		// Mock findMany to return corrupted booking data
		const findManySpy = vi
			.spyOn(server.drizzleClient.query.venueBookingsTable, "findMany")
			.mockResolvedValueOnce([
				{
					createdAt: new Date(),
					eventId: "test-event-id",
					venueId: venueId,
					event: eventData, // Injected corrupt data
				} as unknown as Awaited<
					ReturnType<
						typeof server.drizzleClient.query.venueBookingsTable.findMany
					>
				>[0],
			]);

		const result = await mercuriusClient.query(VenueEventsQuery, {
			headers: { authorization: `Bearer ${authToken}` },
			variables: { input: { id: venueId }, first: 10 },
		});

		expect(findManySpy).toHaveBeenCalled();
		expect(result.data?.venue?.events).toBeNull();
		expect(result.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					extensions: expect.objectContaining({
						code: "internal_server_error",
					}),
				}),
			]),
		);
	});
});
