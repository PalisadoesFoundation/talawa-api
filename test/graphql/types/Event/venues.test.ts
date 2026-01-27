import { faker } from "@faker-js/faker";
import { afterEach, beforeAll, expect, suite, test, vi } from "vitest";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	Mutation_createEvent,
	Mutation_createOrganization,
	Mutation_createOrganizationMembership,
	Mutation_createVenue,
	Mutation_createVenueBooking,
	Query_eventVenues,
	Query_signIn,
} from "../documentNodes";

let authToken: string;
let adminUserId: string;

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
	assertToBeNonNullish(signInResult.data.signIn.user?.id);
	authToken = signInResult.data.signIn.authenticationToken;
	adminUserId = signInResult.data.signIn.user.id;
});

afterEach(() => {
	vi.restoreAllMocks();
});

async function createOrganizationWithMembership(): Promise<string> {
	const createOrgResult = await mercuriusClient.mutate(
		Mutation_createOrganization,
		{
			headers: { authorization: `Bearer ${authToken}` },
			variables: {
				input: {
					name: `Test Org ${faker.string.uuid()}`,
					description: "Test organization for event venues",
				},
			},
		},
	);
	expect(createOrgResult.errors).toBeUndefined();
	assertToBeNonNullish(createOrgResult.data?.createOrganization?.id);
	const orgId = createOrgResult.data.createOrganization.id;

	const membershipResult = await mercuriusClient.mutate(
		Mutation_createOrganizationMembership,
		{
			headers: { authorization: `Bearer ${authToken}` },
			variables: {
				input: {
					memberId: adminUserId,
					organizationId: orgId,
					role: "administrator",
				},
			},
		},
	);
	expect(membershipResult.errors).toBeUndefined();
	assertToBeNonNullish(membershipResult.data?.createOrganizationMembership?.id);

	return orgId;
}

suite("Event venues Field", () => {
	test("should return empty venues connection when event has no venue bookings", async () => {
		// Create organization
		const orgId = await createOrganizationWithMembership();

		// Create event
		const createEventResult = await mercuriusClient.mutate(
			Mutation_createEvent,
			{
				headers: { authorization: `Bearer ${authToken}` },
				variables: {
					input: {
						organizationId: orgId,
						name: `Test Event ${faker.string.uuid()}`,
						description: "Test event for venues",
						startAt: new Date(Date.now() + 86400000).toISOString(),
						endAt: new Date(Date.now() + 90000000).toISOString(),
					},
				},
			},
		);
		const eventId = createEventResult.data?.createEvent?.id;
		assertToBeNonNullish(eventId);

		// Query event venues
		const result = await mercuriusClient.query(Query_eventVenues, {
			headers: { authorization: `Bearer ${authToken}` },
			variables: { input: { id: eventId }, first: 10 },
		});

		expect(result.errors).toBeUndefined();
		expect(result.data?.event?.venues).toBeDefined();
		expect(result.data?.event?.venues?.edges).toEqual([]);
		expect(result.data?.event?.venues?.pageInfo).toEqual({
			hasNextPage: false,
			hasPreviousPage: false,
			startCursor: null,
			endCursor: null,
		});
	});

	test("should return venues when event has venue bookings", async () => {
		// Create organization
		const orgId = await createOrganizationWithMembership();

		// Create venue
		const createVenueResult = await mercuriusClient.mutate(
			Mutation_createVenue,
			{
				headers: { authorization: `Bearer ${authToken}` },
				variables: {
					input: {
						organizationId: orgId,
						name: `Test Venue ${faker.string.uuid()}`,
						description: "Test venue",
						capacity: 100,
					},
				},
			},
		);
		const venueId = createVenueResult.data?.createVenue?.id;
		assertToBeNonNullish(venueId);

		// Create event
		const createEventResult = await mercuriusClient.mutate(
			Mutation_createEvent,
			{
				headers: { authorization: `Bearer ${authToken}` },
				variables: {
					input: {
						organizationId: orgId,
						name: `Test Event ${faker.string.uuid()}`,
						description: "Test event for venues",
						startAt: new Date(Date.now() + 86400000).toISOString(),
						endAt: new Date(Date.now() + 90000000).toISOString(),
					},
				},
			},
		);
		const eventId = createEventResult.data?.createEvent?.id;
		assertToBeNonNullish(eventId);

		// Create venue booking
		const bookingResult = await mercuriusClient.mutate(
			Mutation_createVenueBooking,
			{
				headers: { authorization: `Bearer ${authToken}` },
				variables: {
					input: {
						venueId: venueId,
						eventId: eventId,
					},
				},
			},
		);
		expect(bookingResult.errors).toBeUndefined();

		// Query event venues
		const result = await mercuriusClient.query(Query_eventVenues, {
			headers: { authorization: `Bearer ${authToken}` },
			variables: { input: { id: eventId }, first: 10 },
		});

		expect(result.errors).toBeUndefined();
		expect(result.data?.event?.venues).toBeDefined();
		expect(result.data?.event?.venues?.edges).toHaveLength(1);
		expect(result.data?.event?.venues?.edges?.[0]?.node?.id).toBe(venueId);
		expect(result.data?.event?.venues?.pageInfo?.hasNextPage).toBe(false);
		expect(result.data?.event?.venues?.pageInfo?.hasPreviousPage).toBe(false);
	});

	test("should handle forward pagination correctly with first parameter", async () => {
		// Create organization
		const orgId = await createOrganizationWithMembership();

		// Create event
		const createEventResult = await mercuriusClient.mutate(
			Mutation_createEvent,
			{
				headers: { authorization: `Bearer ${authToken}` },
				variables: {
					input: {
						organizationId: orgId,
						name: `Test Event ${faker.string.uuid()}`,
						description: "Test event for venues",
						startAt: new Date(Date.now() + 86400000).toISOString(),
						endAt: new Date(Date.now() + 90000000).toISOString(),
					},
				},
			},
		);
		const eventId = createEventResult.data?.createEvent?.id;
		assertToBeNonNullish(eventId);

		// Create multiple venues and bookings
		const venueIds = [];
		for (let i = 0; i < 3; i++) {
			const venueResult = await mercuriusClient.mutate(Mutation_createVenue, {
				headers: { authorization: `Bearer ${authToken}` },
				variables: {
					input: {
						organizationId: orgId,
						name: `Test Venue ${i} ${faker.string.uuid()}`,
						description: `Test venue ${i}`,
						capacity: 100 + i * 10,
					},
				},
			});
			const venueId = venueResult.data?.createVenue?.id;
			assertToBeNonNullish(venueId);
			venueIds.push(venueId);

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

		// Query with first: 2
		const result = await mercuriusClient.query(Query_eventVenues, {
			headers: { authorization: `Bearer ${authToken}` },
			variables: { input: { id: eventId }, first: 2 },
		});

		expect(result.errors).toBeUndefined();
		expect(result.data?.event?.venues?.edges).toHaveLength(2);
		expect(result.data?.event?.venues?.pageInfo?.hasNextPage).toBe(true);
		expect(result.data?.event?.venues?.pageInfo?.hasPreviousPage).toBe(false);
		expect(result.data?.event?.venues?.pageInfo?.endCursor).toBeDefined();
	});

	test("should handle backward pagination correctly with last parameter", async () => {
		// Create organization
		const orgId = await createOrganizationWithMembership();

		// Create event
		const createEventResult = await mercuriusClient.mutate(
			Mutation_createEvent,
			{
				headers: { authorization: `Bearer ${authToken}` },
				variables: {
					input: {
						organizationId: orgId,
						name: `Test Event ${faker.string.uuid()}`,
						description: "Test event for venues",
						startAt: new Date(Date.now() + 86400000).toISOString(),
						endAt: new Date(Date.now() + 90000000).toISOString(),
					},
				},
			},
		);
		const eventId = createEventResult.data?.createEvent?.id;
		assertToBeNonNullish(eventId);

		// Create multiple venues and bookings
		for (let i = 0; i < 3; i++) {
			const venueResult = await mercuriusClient.mutate(Mutation_createVenue, {
				headers: { authorization: `Bearer ${authToken}` },
				variables: {
					input: {
						organizationId: orgId,
						name: `Test Venue ${i} ${faker.string.uuid()}`,
						description: `Test venue ${i}`,
						capacity: 100 + i * 10,
					},
				},
			});
			const venueId = venueResult.data?.createVenue?.id;
			assertToBeNonNullish(venueId);

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

		// Query with last: 2
		const result = await mercuriusClient.query(Query_eventVenues, {
			headers: { authorization: `Bearer ${authToken}` },
			variables: { input: { id: eventId }, last: 2 },
		});

		expect(result.errors).toBeUndefined();
		expect(result.data?.event?.venues?.edges).toHaveLength(2);
		expect(result.data?.event?.venues?.pageInfo?.hasNextPage).toBe(false);
		expect(result.data?.event?.venues?.pageInfo?.hasPreviousPage).toBe(true);
		expect(result.data?.event?.venues?.pageInfo?.startCursor).toBeDefined();
	});

	test("should return GraphQL error when both first and last are provided", async () => {
		// Create organization
		const orgId = await createOrganizationWithMembership();

		// Create event
		const createEventResult = await mercuriusClient.mutate(
			Mutation_createEvent,
			{
				headers: { authorization: `Bearer ${authToken}` },
				variables: {
					input: {
						organizationId: orgId,
						name: `Test Event ${faker.string.uuid()}`,
						description: "Test event for venues",
						startAt: new Date(Date.now() + 86400000).toISOString(),
						endAt: new Date(Date.now() + 90000000).toISOString(),
					},
				},
			},
		);
		const eventId = createEventResult.data?.createEvent?.id;
		assertToBeNonNullish(eventId);

		// Query with both first and last (invalid)
		const result = await mercuriusClient.query(Query_eventVenues, {
			headers: { authorization: `Bearer ${authToken}` },
			variables: { input: { id: eventId }, first: 10, last: 5 },
		});

		expect(result.errors).toBeDefined();
		expect(result.errors?.[0]?.extensions?.code).toBe("invalid_arguments");
	});

	test("should return GraphQL error when neither first nor last is provided", async () => {
		// Create organization
		const orgId = await createOrganizationWithMembership();

		// Create event
		const createEventResult = await mercuriusClient.mutate(
			Mutation_createEvent,
			{
				headers: { authorization: `Bearer ${authToken}` },
				variables: {
					input: {
						organizationId: orgId,
						name: `Test Event ${faker.string.uuid()}`,
						description: "Test event for venues",
						startAt: new Date(Date.now() + 86400000).toISOString(),
						endAt: new Date(Date.now() + 90000000).toISOString(),
					},
				},
			},
		);
		const eventId = createEventResult.data?.createEvent?.id;
		assertToBeNonNullish(eventId);

		// Query without first or last (invalid)
		const result = await mercuriusClient.query(Query_eventVenues, {
			headers: { authorization: `Bearer ${authToken}` },
			variables: { input: { id: eventId } },
		});

		expect(result.errors).toBeDefined();
		expect(result.errors?.[0]?.extensions?.code).toBe("invalid_arguments");
	});

	test("should return GraphQL error when before is used with first", async () => {
		// Create organization
		const orgId = await createOrganizationWithMembership();

		// Create event
		const createEventResult = await mercuriusClient.mutate(
			Mutation_createEvent,
			{
				headers: { authorization: `Bearer ${authToken}` },
				variables: {
					input: {
						organizationId: orgId,
						name: `Test Event ${faker.string.uuid()}`,
						description: "Test event for venues",
						startAt: new Date(Date.now() + 86400000).toISOString(),
						endAt: new Date(Date.now() + 90000000).toISOString(),
					},
				},
			},
		);
		const eventId = createEventResult.data?.createEvent?.id;
		assertToBeNonNullish(eventId);

		// Query with before and first (invalid combination)
		const someCursor = Buffer.from(
			JSON.stringify({
				venueId: "test-id",
				createdAt: new Date().toISOString(),
			}),
		).toString("base64url");

		const result = await mercuriusClient.query(Query_eventVenues, {
			headers: { authorization: `Bearer ${authToken}` },
			variables: { input: { id: eventId }, first: 10, before: someCursor },
		});

		expect(result.errors).toBeDefined();
		expect(result.errors?.[0]?.extensions?.code).toBe("invalid_arguments");
	});

	test("should return GraphQL error when after is used with last", async () => {
		// Create organization
		const orgId = await createOrganizationWithMembership();

		// Create event
		const createEventResult = await mercuriusClient.mutate(
			Mutation_createEvent,
			{
				headers: { authorization: `Bearer ${authToken}` },
				variables: {
					input: {
						organizationId: orgId,
						name: `Test Event ${faker.string.uuid()}`,
						description: "Test event for venues",
						startAt: new Date(Date.now() + 86400000).toISOString(),
						endAt: new Date(Date.now() + 90000000).toISOString(),
					},
				},
			},
		);
		const eventId = createEventResult.data?.createEvent?.id;
		assertToBeNonNullish(eventId);

		// Query with after and last (invalid combination)
		const someCursor = Buffer.from(
			JSON.stringify({
				venueId: "test-id",
				createdAt: new Date().toISOString(),
			}),
		).toString("base64url");

		const result = await mercuriusClient.query(Query_eventVenues, {
			headers: { authorization: `Bearer ${authToken}` },
			variables: { input: { id: eventId }, last: 10, after: someCursor },
		});

		expect(result.errors).toBeDefined();
		expect(result.errors?.[0]?.extensions?.code).toBe("invalid_arguments");
	});

	test("should handle pagination with after cursor", async () => {
		// Create organization
		const orgId = await createOrganizationWithMembership();

		// Create event
		const createEventResult = await mercuriusClient.mutate(
			Mutation_createEvent,
			{
				headers: { authorization: `Bearer ${authToken}` },
				variables: {
					input: {
						organizationId: orgId,
						name: `Test Event ${faker.string.uuid()}`,
						description: "Test event for venues",
						startAt: new Date(Date.now() + 86400000).toISOString(),
						endAt: new Date(Date.now() + 90000000).toISOString(),
					},
				},
			},
		);
		const eventId = createEventResult.data?.createEvent?.id;
		assertToBeNonNullish(eventId);

		// Create multiple venues and bookings
		for (let i = 0; i < 3; i++) {
			const venueResult = await mercuriusClient.mutate(Mutation_createVenue, {
				headers: { authorization: `Bearer ${authToken}` },
				variables: {
					input: {
						organizationId: orgId,
						name: `Test Venue ${i} ${faker.string.uuid()}`,
						description: `Test venue ${i}`,
						capacity: 100 + i * 10,
					},
				},
			});
			const venueId = venueResult.data?.createVenue?.id;
			assertToBeNonNullish(venueId);

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

		// Query first page
		const firstPage = await mercuriusClient.query(Query_eventVenues, {
			headers: { authorization: `Bearer ${authToken}` },
			variables: { input: { id: eventId }, first: 2 },
		});

		expect(firstPage.errors).toBeUndefined();
		expect(firstPage.data?.event?.venues?.edges).toHaveLength(2);
		const cursor = firstPage.data?.event?.venues?.pageInfo?.endCursor;
		assertToBeNonNullish(cursor);

		// Query second page using cursor
		const secondPage = await mercuriusClient.query(Query_eventVenues, {
			headers: { authorization: `Bearer ${authToken}` },
			variables: { input: { id: eventId }, first: 2, after: cursor },
		});

		expect(secondPage.errors).toBeUndefined();
		expect(secondPage.data?.event?.venues?.edges).toHaveLength(1);
		expect(secondPage.data?.event?.venues?.pageInfo?.hasNextPage).toBe(false);
		expect(secondPage.data?.event?.venues?.pageInfo?.hasPreviousPage).toBe(
			true,
		);
	});

	test("should respect maximum limit for items per page", async () => {
		// Create organization
		const orgId = await createOrganizationWithMembership();

		// Create event
		const createEventResult = await mercuriusClient.mutate(
			Mutation_createEvent,
			{
				headers: { authorization: `Bearer ${authToken}` },
				variables: {
					input: {
						organizationId: orgId,
						name: `Test Event ${faker.string.uuid()}`,
						description: "Test event for venues",
						startAt: new Date(Date.now() + 86400000).toISOString(),
						endAt: new Date(Date.now() + 90000000).toISOString(),
					},
				},
			},
		);
		const eventId = createEventResult.data?.createEvent?.id;
		assertToBeNonNullish(eventId);

		// Query with maximum allowed limit (32)
		const result = await mercuriusClient.query(Query_eventVenues, {
			headers: { authorization: `Bearer ${authToken}` },
			variables: {
				input: { id: eventId },
				first: 32,
			},
		});

		// Should not error with valid maximum limit
		expect(result.errors).toBeUndefined();
		expect(result.data?.event?.venues).toBeDefined();
	});

	test("should return GraphQL error for malformed cursor", async () => {
		// Create organization
		const orgId = await createOrganizationWithMembership();

		// Create event
		const createEventResult = await mercuriusClient.mutate(
			Mutation_createEvent,
			{
				headers: { authorization: `Bearer ${authToken}` },
				variables: {
					input: {
						organizationId: orgId,
						name: `Test Event ${faker.string.uuid()}`,
						description: "Test event for venues",
						startAt: new Date(Date.now() + 86400000).toISOString(),
						endAt: new Date(Date.now() + 90000000).toISOString(),
					},
				},
			},
		);
		const eventId = createEventResult.data?.createEvent?.id;
		assertToBeNonNullish(eventId);

		// Query with invalid cursor
		const result = await mercuriusClient.query(Query_eventVenues, {
			headers: { authorization: `Bearer ${authToken}` },
			variables: {
				input: { id: eventId },
				first: 10,
				after: "invalid-cursor@#$",
			},
		});

		expect(result.errors).toBeDefined();
		expect(result.errors?.[0]?.extensions?.code).toBe("invalid_arguments");
	});

	test("should handle pagination with before cursor", async () => {
		// Create organization
		const orgId = await createOrganizationWithMembership();

		// Create event
		const createEventResult = await mercuriusClient.mutate(
			Mutation_createEvent,
			{
				headers: { authorization: `Bearer ${authToken}` },
				variables: {
					input: {
						organizationId: orgId,
						name: `Test Event ${faker.string.uuid()}`,
						description: "Test event for venues",
						startAt: new Date(Date.now() + 86400000).toISOString(),
						endAt: new Date(Date.now() + 90000000).toISOString(),
					},
				},
			},
		);
		const eventId = createEventResult.data?.createEvent?.id;
		assertToBeNonNullish(eventId);

		// Create multiple venues and bookings
		for (let i = 0; i < 3; i++) {
			const venueResult = await mercuriusClient.mutate(Mutation_createVenue, {
				headers: { authorization: `Bearer ${authToken}` },
				variables: {
					input: {
						organizationId: orgId,
						name: `Test Venue ${i} ${faker.string.uuid()}`,
						description: `Test venue ${i}`,
						capacity: 100 + i * 10,
					},
				},
			});
			const venueId = venueResult.data?.createVenue?.id;
			assertToBeNonNullish(venueId);

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

		// Query last page
		const lastPage = await mercuriusClient.query(Query_eventVenues, {
			headers: { authorization: `Bearer ${authToken}` },
			variables: { input: { id: eventId }, last: 2 },
		});

		expect(lastPage.errors).toBeUndefined();
		expect(lastPage.data?.event?.venues?.edges).toHaveLength(2);
		const cursor = lastPage.data?.event?.venues?.pageInfo?.startCursor;
		assertToBeNonNullish(cursor);

		// Query previous page using cursor
		const prevPage = await mercuriusClient.query(Query_eventVenues, {
			headers: { authorization: `Bearer ${authToken}` },
			variables: { input: { id: eventId }, last: 2, before: cursor },
		});

		expect(prevPage.errors).toBeUndefined();
		expect(prevPage.data?.event?.venues?.edges).toHaveLength(1);
		expect(prevPage.data?.event?.venues?.pageInfo?.hasNextPage).toBe(true);
		expect(prevPage.data?.event?.venues?.pageInfo?.hasPreviousPage).toBe(false);
	});
});
