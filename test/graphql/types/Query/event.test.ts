import { faker } from "@faker-js/faker";
import { uuidv7 } from "uuidv7";
import { afterEach, beforeAll, expect, suite, test } from "vitest";
import { eventsTable } from "~/src/drizzle/tables/events";
import type {
	TalawaGraphQLFormattedError,
	UnauthenticatedExtensions,
	UnauthorizedActionOnArgumentsAssociatedResourcesExtensions,
} from "~/src/utilities/TalawaGraphQLError";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	Mutation_createEvent,
	Mutation_createOrganization,
	Mutation_createOrganizationMembership,
	Mutation_createUser,
	Mutation_deleteUser,
	Mutation_inviteEventAttendee,
	Mutation_registerForEvent,
	Query_event,
	Query_getRecurringEvents,
	Query_signIn,
} from "../documentNodes";

// Admin auth (fetched once per suite)
let adminToken: string | null = null;
let adminUserId: string | null = null;
async function ensureAdminAuth(): Promise<{ token: string; userId: string }> {
	if (adminToken && adminUserId)
		return { token: adminToken, userId: adminUserId };
	if (
		!server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS ||
		!server.envConfig.API_ADMINISTRATOR_USER_PASSWORD
	) {
		throw new Error("Admin credentials missing in env config");
	}
	const res = await mercuriusClient.query(Query_signIn, {
		variables: {
			input: {
				emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
				password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
			},
		},
	});
	if (
		res.errors ||
		!res.data?.signIn?.authenticationToken ||
		!res.data?.signIn?.user?.id
	) {
		throw new Error(
			`Unable to sign in admin: ${res.errors?.[0]?.message || "unknown"}`,
		);
	}
	adminToken = res.data.signIn.authenticationToken;
	adminUserId = res.data.signIn.user.id;
	assertToBeNonNullish(adminToken);
	assertToBeNonNullish(adminUserId);
	return { token: adminToken, userId: adminUserId };
}

beforeAll(async () => {
	await ensureAdminAuth();
});

suite("Query field event", () => {
	// Helper function to get admin auth token and user ID
	async function getAdminTokenAndUserId() {
		const signInResult = await mercuriusClient.query(Query_signIn, {
			variables: {
				input: {
					emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
					password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
				},
			},
		});

		const authToken = signInResult.data?.signIn?.authenticationToken;
		const userId = signInResult.data?.signIn?.user?.id;
		if (!authToken || !userId) {
			throw new Error(
				`Failed to sign in as admin. Errors: ${JSON.stringify(
					signInResult.errors,
				)}`,
			);
		}
		assertToBeNonNullish(authToken);
		assertToBeNonNullish(userId);
		return { authToken, userId };
	}

	// Helper function to get admin auth token
	async function getAdminToken() {
		const { authToken } = await getAdminTokenAndUserId();
		return authToken;
	}

	// Helper function to create an organization
	async function createTestOrganization(authToken: string, userId: string) {
		const orgResult = await mercuriusClient.mutate(
			Mutation_createOrganization,
			{
				headers: {
					authorization: `bearer ${authToken}`,
				},
				variables: {
					input: {
						countryCode: "us",
						name: `Test Organization ${faker.string.alphanumeric(8)}`,
					},
				},
			},
		);

		const organization = orgResult.data?.createOrganization;
		if (!organization) {
			throw new Error(
				`Failed to create organization. Errors: ${JSON.stringify(
					orgResult.errors,
				)}`,
			);
		}
		assertToBeNonNullish(organization);

		// Create organization membership for the admin user
		const membershipResult = await mercuriusClient.mutate(
			Mutation_createOrganizationMembership,
			{
				headers: {
					authorization: `bearer ${authToken}`,
				},
				variables: {
					input: {
						organizationId: organization.id,
						memberId: userId,
						role: "administrator",
					},
				},
			},
		);

		if (membershipResult.errors) {
			throw new Error(
				`Failed to create organization membership. Errors: ${JSON.stringify(
					membershipResult.errors,
				)}`,
			);
		}

		return organization;
	}

	async function createTestEvent(
		authToken: string,
		organizationId: string,
		options: {
			durationInHours?: number;
			startOffset?: number; // milliseconds from now
			description?: string;
			name?: string;
		} = {},
	) {
		const {
			durationInHours = 24,
			// Default to 24 hours in future because createEvent rejects past startAt
			startOffset = 24 * 60 * 60 * 1000,
			description = "Test Event",
			name = "Test Event",
		} = options;

		const startAt = new Date(Date.now() + startOffset);
		const endAt = new Date(
			startAt.getTime() + durationInHours * 60 * 60 * 1000,
		);

		const eventResult = await mercuriusClient.mutate(Mutation_createEvent, {
			headers: {
				authorization: `bearer ${authToken}`,
			},
			variables: {
				input: {
					description,
					endAt: endAt.toISOString(),
					name,
					organizationId,
					startAt: startAt.toISOString(),
				},
			},
		});

		const event = eventResult.data?.createEvent;
		if (!event) {
			throw new Error(
				`Failed to create event. Errors: ${JSON.stringify(eventResult.errors)}`,
			);
		}
		assertToBeNonNullish(event);
		return event;
	}

	async function setupTestData(authToken: string, userId: string) {
		const organization = await createTestOrganization(authToken, userId);
		const event = await createTestEvent(authToken, organization.id);
		return { organization, event };
	}

	// Helper function to create and delete a test user
	async function createAndDeleteTestUser(authToken: string) {
		const userResult = await mercuriusClient.mutate(Mutation_createUser, {
			headers: {
				authorization: `bearer ${authToken}`,
			},
			variables: {
				input: {
					emailAddress: `${faker.string.ulid()}@test.com`,
					isEmailAddressVerified: true,
					name: "Test User",
					password: "password123",
					role: "regular",
				},
			},
		});

		const user = userResult.data?.createUser;
		assertToBeNonNullish(user);
		assertToBeNonNullish(user.authenticationToken);
		assertToBeNonNullish(user.user);

		await mercuriusClient.mutate(Mutation_deleteUser, {
			headers: {
				authorization: `bearer ${authToken}`,
			},
			variables: {
				input: {
					id: user.user.id,
				},
			},
		});

		return user;
	}

	suite(
		`results in a graphql error with "unauthenticated" extensions code in the "errors" field and "null" as the value of "data.event" field if`,
		() => {
			const testCleanupFunctions: Array<() => Promise<void>> = [];

			afterEach(async () => {
				for (const cleanup of testCleanupFunctions.reverse()) {
					try {
						await cleanup();
					} catch (error) {
						console.error("Cleanup failed:", error);
					}
				}
				testCleanupFunctions.length = 0;
			});
			test("client triggering the graphql operation is not authenticated.", async () => {
				const eventResult = await mercuriusClient.query(Query_event, {
					variables: {
						input: {
							id: faker.string.ulid(),
						},
					},
				});

				expect(eventResult.data.event).toBeNull();
				expect(eventResult.errors).toEqual(
					expect.arrayContaining<TalawaGraphQLFormattedError>([
						expect.objectContaining<TalawaGraphQLFormattedError>({
							extensions: expect.objectContaining<UnauthenticatedExtensions>({
								code: "unauthenticated",
							}),
							message: expect.any(String),
							path: ["event"],
						}),
					]),
				);
			});

			test("client triggering the graphql operation has no existing user associated to their authentication context.", async () => {
				const { authToken, userId } = await getAdminTokenAndUserId();
				const { event } = await setupTestData(authToken, userId);
				const deletedUser = await createAndDeleteTestUser(authToken);

				// Try to access event with deleted user's token
				const queryResult = await mercuriusClient.query(Query_event, {
					headers: {
						authorization: `bearer ${deletedUser.authenticationToken}`,
					},
					variables: {
						input: {
							id: event.id,
						},
					},
				});

				expect(queryResult.data.event).toBeNull();
				expect(queryResult.errors).toEqual(
					expect.arrayContaining<TalawaGraphQLFormattedError>([
						expect.objectContaining<TalawaGraphQLFormattedError>({
							extensions: expect.objectContaining<UnauthenticatedExtensions>({
								code: "unauthenticated",
							}),
							message: expect.any(String),
							path: ["event"],
						}),
					]),
				);
			});
		},
	);

	suite(
		`results in a graphql error with database query failure in the "errors" field and "null" as the value of "data.event" field if`,
		() => {
			test("fails with ULID of wrong length", async () => {
				const authToken = await getAdminToken();
				const result = await mercuriusClient.query(Query_event, {
					headers: {
						authorization: `bearer ${authToken}`,
					},
					variables: {
						input: {
							id: "01ARZ3NDEKTSV4RRFFQ69G5FAV", // 26 chars instead of 27
						},
					},
				});

				expect(result.data.event).toBeNull();
				expect(result.errors).toBeDefined();
				expect(result.errors).toHaveLength(1);
				// Validate error structure safely
				const error = result.errors?.[0];
				expect(error).toBeDefined();
				expect(error?.message).toContain("Failed query:");
				expect(error?.path).toEqual(["event"]);
			});

			test("fails with ULID containing invalid characters", async () => {
				const authToken = await getAdminToken();
				const result = await mercuriusClient.query(Query_event, {
					headers: {
						authorization: `bearer ${authToken}`,
					},
					variables: {
						input: {
							id: "01ARZ3NDEKTSV4RRFFQ69G5FA!", // Contains invalid '!'
						},
					},
				});

				expect(result.data.event).toBeNull();
				expect(result.errors).toBeDefined();
				expect(result.errors).toHaveLength(1);
				// Validate error structure safely
				const error = result.errors?.[0];
				expect(error).toBeDefined();
				expect(error?.message).toContain("Failed query:");
				expect(error?.path).toEqual(["event"]);
			});

			test("provided event ID is not a valid ULID.", async () => {
				const signInResult = await mercuriusClient.query(Query_signIn, {
					variables: {
						input: {
							emailAddress:
								server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
							password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
						},
					},
				});

				const authToken = signInResult.data?.signIn?.authenticationToken;
				assertToBeNonNullish(authToken);

				const eventResult = await mercuriusClient.query(Query_event, {
					headers: {
						authorization: `bearer ${authToken}`,
					},
					variables: {
						input: {
							id: "invalid-id",
						},
					},
				});

				expect(eventResult.data.event).toBeNull();
				expect(eventResult.errors).toBeDefined();
				expect(eventResult.errors).toHaveLength(1);
				// Validate error structure safely
				const error = eventResult.errors?.[0];
				expect(error).toBeDefined();
				expect(error?.message).toContain("Failed query:");
				expect(error?.path).toEqual(["event"]);
			});
		},
	);

	test("unauthorized regular user cannot access event from an organization they are not a member of", async () => {
		const { authToken: adminAuthToken, userId: adminUserId } =
			await getAdminTokenAndUserId();
		const organization = await createTestOrganization(
			adminAuthToken,
			adminUserId,
		);
		const event = await createTestEvent(adminAuthToken, organization.id);

		// Create a regular user who is not a member of the organization
		const userResult = await mercuriusClient.mutate(Mutation_createUser, {
			headers: {
				authorization: `bearer ${adminAuthToken}`,
			},
			variables: {
				input: {
					emailAddress: `${faker.string.ulid()}@test.com`,
					isEmailAddressVerified: true,
					name: "Test User",
					password: "password123",
					role: "regular",
				},
			},
		});

		const user = userResult.data?.createUser;
		assertToBeNonNullish(user);
		assertToBeNonNullish(user.authenticationToken);

		// Try to access event as regular user
		const queryResult = await mercuriusClient.query(Query_event, {
			headers: {
				authorization: `bearer ${user.authenticationToken}`,
			},
			variables: {
				input: {
					id: event.id,
				},
			},
		});

		expect(queryResult.data.event).toBeNull();
		expect(queryResult.errors).toEqual(
			expect.arrayContaining<TalawaGraphQLFormattedError>([
				expect.objectContaining<TalawaGraphQLFormattedError>({
					extensions:
						expect.objectContaining<UnauthorizedActionOnArgumentsAssociatedResourcesExtensions>(
							{
								code: "unauthorized_action_on_arguments_associated_resources",
								issues: expect.arrayContaining([
									expect.objectContaining({
										argumentPath: ["input", "id"],
									}),
								]),
							},
						),
					message: expect.any(String),
					path: ["event"],
				}),
			]),
		);
	});

	// Then refactor the "admin user can access event" test to:
	test("admin user can access event from any organization", async () => {
		const { authToken: adminAuthToken, userId: adminUserId } =
			await getAdminTokenAndUserId();

		// Create test organization
		const organization = await createTestOrganization(
			adminAuthToken,
			adminUserId,
		);

		// Create test event using helper
		const event = await createTestEvent(adminAuthToken, organization.id);

		// Try to access event as admin
		const queryResult = await mercuriusClient.query(Query_event, {
			headers: {
				authorization: `bearer ${adminAuthToken}`,
			},
			variables: {
				input: {
					id: event.id,
				},
			},
		});

		const queriedEvent = queryResult.data.event;
		expect(queriedEvent).not.toBeNull();
		assertToBeNonNullish(queriedEvent);
		expect(queriedEvent.id).toBe(event.id);
		expect(queryResult.errors).toBeUndefined();
	});

	// These additional test cases do not improve coverage from the actual files, However -> They help testing the application better
	suite("Additional event tests", () => {
		const testCleanupFunctions: Array<() => Promise<void>> = [];

		afterEach(async () => {
			for (const cleanup of testCleanupFunctions.reverse()) {
				try {
					await cleanup();
				} catch (error) {
					console.error("Cleanup failed:", error);
				}
			}
			testCleanupFunctions.length = 0;
		});
		test("handles events with past dates correctly", async () => {
			const { authToken, userId } = await getAdminTokenAndUserId();
			const organization = await createTestOrganization(authToken, userId);

			// Create an event in the past directly in DB to bypass mutation validation
			const pastEventId = uuidv7();
			await server.drizzleClient.insert(eventsTable).values({
				id: pastEventId,
				name: "Past Event",
				description: "Past Event",
				startAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
				endAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
				organizationId: organization.id,
				creatorId: userId,
				allDay: false,
				isInviteOnly: false,
				isPublic: true,
				isRegisterable: true,
				isRecurringEventTemplate: false,
			});

			const pastEvent = await server.drizzleClient.query.eventsTable.findFirst({
				where: (fields, operators) => operators.eq(fields.id, pastEventId),
			});
			assertToBeNonNullish(pastEvent); // Assert exists since we just created it

			// Query the past event
			const queryResult = await mercuriusClient.query(Query_event, {
				headers: {
					authorization: `bearer ${authToken}`,
				},
				variables: {
					input: {
						id: pastEvent.id,
					},
				},
			});

			const queriedEvent = queryResult.data.event;
			expect(queriedEvent).not.toBeNull();
			assertToBeNonNullish(queriedEvent);
			expect(queriedEvent.id).toBe(pastEvent.id);
			assertToBeNonNullish(queriedEvent.startAt);
			assertToBeNonNullish(queriedEvent.endAt);
			expect(new Date(queriedEvent.startAt).getTime()).toBeLessThan(Date.now());
			expect(new Date(queriedEvent.endAt).getTime()).toBeLessThan(Date.now());
		});

		test("handles multi-day events correctly", async () => {
			const { authToken, userId } = await getAdminTokenAndUserId();
			const organization = await createTestOrganization(authToken, userId);

			// Create a multi-day event
			const multiDayEventResult = await mercuriusClient.mutate(
				Mutation_createEvent,
				{
					headers: {
						authorization: `bearer ${authToken}`,
					},
					variables: {
						input: {
							description: "Multi-day Conference",
							startAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
							endAt: new Date(
								Date.now() + 3 * 24 * 60 * 60 * 1000,
							).toISOString(), // 3 days from now
							name: "Annual Conference",
							organizationId: organization.id,
						},
					},
				},
			);

			const multiDayEvent = multiDayEventResult.data?.createEvent;
			assertToBeNonNullish(multiDayEvent);

			// Query the multi-day event
			const queryResult = await mercuriusClient.query(Query_event, {
				headers: {
					authorization: `bearer ${authToken}`,
				},
				variables: {
					input: {
						id: multiDayEvent.id,
					},
				},
			});

			const queriedEvent = queryResult.data.event;
			expect(queriedEvent).not.toBeNull();
			assertToBeNonNullish(queriedEvent);
			expect(queriedEvent.id).toBe(multiDayEvent.id);

			assertToBeNonNullish(queriedEvent.startAt);
			assertToBeNonNullish(queriedEvent.endAt);
			const startDate = new Date(queriedEvent.startAt);
			const endDate = new Date(queriedEvent.endAt);
			const durationInDays =
				(endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
			expect(durationInDays).toBeGreaterThan(1);
		});

		test("creates a never-ending recurring event and materializes instances (recurrence.never)", async () => {
			const { authToken, userId } = await getAdminTokenAndUserId();

			const organization = await createTestOrganization(authToken, userId);
			assertToBeNonNullish(organization);
			const organizationId = organization.id;

			const startAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
			const endAt = new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString();

			// Create never-ending recurring event
			const createEventResult = await mercuriusClient.mutate(
				Mutation_createEvent,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: `Never Recurring ${faker.string.uuid()}`,
							organizationId,
							startAt,
							endAt,
							recurrence: {
								frequency: "WEEKLY",
								never: true,
							},
						},
					},
				},
			);

			if (createEventResult.errors && createEventResult.errors.length > 0) {
				throw new Error(
					`createEvent GraphQL errors: ${JSON.stringify(createEventResult.errors, null, 2)}`,
				);
			}
			if (!createEventResult.data || !createEventResult.data.createEvent) {
				throw new Error(
					`createEvent returned no data. full response: ${JSON.stringify(createEventResult, null, 2)}`,
				);
			}

			const baseRecurringEventId = createEventResult.data.createEvent.id;
			assertToBeNonNullish(baseRecurringEventId);

			const instancesResult = await mercuriusClient.query(
				Query_getRecurringEvents,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: { baseRecurringEventId },
				},
			);

			if (instancesResult.errors && instancesResult.errors.length > 0) {
				throw new Error(
					`getRecurringEvents GraphQL errors: ${JSON.stringify(instancesResult.errors, null, 2)}`,
				);
			}

			const generatedInstances = instancesResult.data?.getRecurringEvents;

			assertToBeNonNullish(generatedInstances);
			expect(Array.isArray(generatedInstances)).toBe(true);
			expect(generatedInstances.length).toBeGreaterThan(0);
		});

		suite("Invite-only event visibility", () => {
			test("registered-but-not-invited user can access invite-only event", async () => {
				const { authToken: adminAuthToken, userId: adminUserId } =
					await getAdminTokenAndUserId();

				// Create test organization
				const organization = await createTestOrganization(
					adminAuthToken,
					adminUserId,
				);

				// Create a regular user
				const regularUserResult = await mercuriusClient.mutate(
					Mutation_createUser,
					{
						headers: { authorization: `bearer ${adminAuthToken}` },
						variables: {
							input: {
								emailAddress: faker.internet.email(),
								password: faker.internet.password(),
								name: faker.person.fullName(),
								role: "regular",
								isEmailAddressVerified: false,
							},
						},
					},
				);

				const regularUser = regularUserResult.data?.createUser;
				if (!regularUser || regularUserResult.errors) {
					throw new Error(
						`Failed to create regular user: ${JSON.stringify(
							regularUserResult.errors,
						)}`,
					);
				}
				assertToBeNonNullish(regularUser.authenticationToken);
				assertToBeNonNullish(regularUser.user);

				const regularUserId = regularUser.user.id;
				const regularUserToken = regularUser.authenticationToken;

				// Add user to organization
				await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: {
						input: {
							organizationId: organization.id,
							memberId: regularUserId,
							role: "regular",
						},
					},
				});

				// Create invite-only event
				const startAt = new Date(
					Date.now() + 24 * 60 * 60 * 1000,
				).toISOString();
				const endAt = new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString();

				const createEventResult = await mercuriusClient.mutate(
					Mutation_createEvent,
					{
						headers: { authorization: `bearer ${adminAuthToken}` },
						variables: {
							input: {
								name: `Invite-Only Event ${faker.string.uuid()}`,
								organizationId: organization.id,
								startAt,
								endAt,
								isInviteOnly: true,
								isRegisterable: true,
							},
						},
					},
				);

				if (
					createEventResult.errors ||
					!createEventResult.data?.createEvent?.id
				) {
					throw new Error(
						`Failed to create invite-only event: ${JSON.stringify(
							createEventResult.errors,
						)}`,
					);
				}

				const eventId = createEventResult.data.createEvent.id;

				// Register the regular user for the event (but don't invite)
				// Use the regular user's token so they are the registered attendee
				await mercuriusClient.mutate(Mutation_registerForEvent, {
					headers: { authorization: `bearer ${regularUserToken}` },
					variables: {
						id: eventId,
					},
				});

				// Registered regular user can access the invite-only event
				const queryResult = await mercuriusClient.query(Query_event, {
					headers: {
						authorization: `bearer ${regularUserToken}`,
					},
					variables: {
						input: {
							id: eventId,
						},
					},
				});

				expect(queryResult.data?.event).not.toBeNull();
				expect(queryResult.data?.event?.id).toBe(eventId);
				expect(queryResult.data?.event?.isInviteOnly).toBe(true);

				// Cleanup
				testCleanupFunctions.push(async () => {
					await mercuriusClient.mutate(Mutation_deleteUser, {
						headers: { authorization: `bearer ${adminAuthToken}` },
						variables: { input: { id: regularUserId } },
					});
				});
			});

			test("invited user can access invite-only event", async () => {
				const { authToken: adminAuthToken, userId: adminUserId } =
					await getAdminTokenAndUserId();

				// Create test organization
				const organization = await createTestOrganization(
					adminAuthToken,
					adminUserId,
				);

				// Create a regular user
				const regularUserResult = await mercuriusClient.mutate(
					Mutation_createUser,
					{
						headers: { authorization: `bearer ${adminAuthToken}` },
						variables: {
							input: {
								emailAddress: faker.internet.email(),
								password: faker.internet.password(),
								name: faker.person.fullName(),
								role: "regular",
								isEmailAddressVerified: false,
							},
						},
					},
				);

				const regularUser = regularUserResult.data?.createUser;
				if (!regularUser || regularUserResult.errors) {
					throw new Error(
						`Failed to create regular user: ${JSON.stringify(
							regularUserResult.errors,
						)}`,
					);
				}
				assertToBeNonNullish(regularUser.authenticationToken);
				assertToBeNonNullish(regularUser.user);

				const regularUserId = regularUser.user.id;
				const regularUserToken = regularUser.authenticationToken;

				// Add user to organization
				await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: {
						input: {
							organizationId: organization.id,
							memberId: regularUserId,
							role: "regular",
						},
					},
				});

				// Create invite-only event
				const startAt = new Date(
					Date.now() + 24 * 60 * 60 * 1000,
				).toISOString();
				const endAt = new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString();

				const createEventResult = await mercuriusClient.mutate(
					Mutation_createEvent,
					{
						headers: { authorization: `bearer ${adminAuthToken}` },
						variables: {
							input: {
								name: `Invite-Only Event ${faker.string.uuid()}`,
								organizationId: organization.id,
								startAt,
								endAt,
								isInviteOnly: true,
								isRegisterable: true,
							},
						},
					},
				);

				if (
					createEventResult.errors ||
					!createEventResult.data?.createEvent?.id
				) {
					throw new Error(
						`Failed to create invite-only event: ${JSON.stringify(
							createEventResult.errors,
						)}`,
					);
				}

				const eventId = createEventResult.data.createEvent.id;

				// Invite the regular user to the event
				// This creates an event_attendees record with isInvited: true
				await mercuriusClient.mutate(Mutation_inviteEventAttendee, {
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: {
						data: {
							eventId,
							userId: regularUserId,
						},
					},
				});

				// Invited regular user can access the invite-only event
				const queryResult = await mercuriusClient.query(Query_event, {
					headers: {
						authorization: `bearer ${regularUserToken}`,
					},
					variables: {
						input: {
							id: eventId,
						},
					},
				});

				expect(queryResult.data?.event).not.toBeNull();
				expect(queryResult.data?.event?.id).toBe(eventId);
				expect(queryResult.data?.event?.isInviteOnly).toBe(true);

				// Cleanup
				testCleanupFunctions.push(async () => {
					await mercuriusClient.mutate(Mutation_deleteUser, {
						headers: { authorization: `bearer ${adminAuthToken}` },
						variables: { input: { id: regularUserId } },
					});
				});
			});

			test("unauthorized regular member denied access", async () => {
				const { authToken: adminAuthToken, userId: adminUserId } =
					await getAdminTokenAndUserId();

				// Create test organization
				const organization = await createTestOrganization(
					adminAuthToken,
					adminUserId,
				);

				// Create a regular user
				const regularUserResult = await mercuriusClient.mutate(
					Mutation_createUser,
					{
						headers: { authorization: `bearer ${adminAuthToken}` },
						variables: {
							input: {
								emailAddress: faker.internet.email(),
								password: faker.internet.password(),
								name: faker.person.fullName(),
								role: "regular",
								isEmailAddressVerified: false,
							},
						},
					},
				);

				const regularUser = regularUserResult.data?.createUser;
				if (!regularUser || regularUserResult.errors) {
					throw new Error(
						`Failed to create regular user: ${JSON.stringify(
							regularUserResult.errors,
						)}`,
					);
				}
				assertToBeNonNullish(regularUser.authenticationToken);
				assertToBeNonNullish(regularUser.user);

				const regularUserId = regularUser.user.id;
				const regularUserToken = regularUser.authenticationToken;

				// Add user to organization (but don't invite or register for event)
				await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: {
						input: {
							organizationId: organization.id,
							memberId: regularUserId,
							role: "regular",
						},
					},
				});

				// Create invite-only event
				const startAt = new Date(
					Date.now() + 24 * 60 * 60 * 1000,
				).toISOString();
				const endAt = new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString();

				const createEventResult = await mercuriusClient.mutate(
					Mutation_createEvent,
					{
						headers: { authorization: `bearer ${adminAuthToken}` },
						variables: {
							input: {
								name: `Invite-Only Event ${faker.string.uuid()}`,
								organizationId: organization.id,
								startAt,
								endAt,
								isInviteOnly: true,
								isRegisterable: true,
							},
						},
					},
				);

				if (
					createEventResult.errors ||
					!createEventResult.data?.createEvent?.id
				) {
					throw new Error(
						`Failed to create invite-only event: ${JSON.stringify(
							createEventResult.errors,
						)}`,
					);
				}

				const eventId = createEventResult.data.createEvent.id;

				// Unauthorized regular member cannot access the invite-only event
				const queryResult = await mercuriusClient.query(Query_event, {
					headers: {
						authorization: `bearer ${regularUserToken}`,
					},
					variables: {
						input: {
							id: eventId,
						},
					},
				});

				expect(queryResult.data?.event).toBeNull();

				// Cleanup
				testCleanupFunctions.push(async () => {
					await mercuriusClient.mutate(Mutation_deleteUser, {
						headers: { authorization: `bearer ${adminAuthToken}` },
						variables: { input: { id: regularUserId } },
					});
				});
			});

			test("event creator can access invite-only event", async () => {
				const { authToken: adminAuthToken, userId: adminUserId } =
					await getAdminTokenAndUserId();

				// Create test organization
				const organization = await createTestOrganization(
					adminAuthToken,
					adminUserId,
				);

				// Create invite-only event as admin (admin becomes the creator)
				const startAt = new Date(
					Date.now() + 24 * 60 * 60 * 1000,
				).toISOString();
				const endAt = new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString();

				const createEventResult = await mercuriusClient.mutate(
					Mutation_createEvent,
					{
						headers: { authorization: `bearer ${adminAuthToken}` },
						variables: {
							input: {
								name: `Invite-Only Event ${faker.string.uuid()}`,
								organizationId: organization.id,
								startAt,
								endAt,
								isInviteOnly: true,
								isRegisterable: true,
							},
						},
					},
				);

				if (
					createEventResult.errors ||
					!createEventResult.data?.createEvent?.id
				) {
					throw new Error(
						`Failed to create invite-only event: ${JSON.stringify(
							createEventResult.errors,
						)}`,
					);
				}

				const eventId = createEventResult.data.createEvent.id;

				// Event creator (admin) can access the invite-only event
				const queryResult = await mercuriusClient.query(Query_event, {
					headers: {
						authorization: `bearer ${adminAuthToken}`,
					},
					variables: {
						input: {
							id: eventId,
						},
					},
				});

				expect(queryResult.data?.event).not.toBeNull();
				expect(queryResult.data?.event?.id).toBe(eventId);
				expect(queryResult.data?.event?.isInviteOnly).toBe(true);
			});

			test("organization admin can access invite-only event", async () => {
				const { authToken: adminAuthToken, userId: adminUserId } =
					await getAdminTokenAndUserId();

				// Create test organization
				const organization = await createTestOrganization(
					adminAuthToken,
					adminUserId,
				);

				// Create a regular user who will be an org admin
				const orgAdminUserResult = await mercuriusClient.mutate(
					Mutation_createUser,
					{
						headers: { authorization: `bearer ${adminAuthToken}` },
						variables: {
							input: {
								emailAddress: faker.internet.email(),
								password: faker.internet.password(),
								name: faker.person.fullName(),
								role: "regular",
								isEmailAddressVerified: false,
							},
						},
					},
				);

				const orgAdminUser = orgAdminUserResult.data?.createUser;
				if (!orgAdminUser || orgAdminUserResult.errors) {
					throw new Error(
						`Failed to create org admin user: ${JSON.stringify(
							orgAdminUserResult.errors,
						)}`,
					);
				}
				assertToBeNonNullish(orgAdminUser.authenticationToken);
				assertToBeNonNullish(orgAdminUser.user);

				const orgAdminUserId = orgAdminUser.user.id;
				const orgAdminUserToken = orgAdminUser.authenticationToken;

				// Add user to organization as administrator
				await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: {
						input: {
							organizationId: organization.id,
							memberId: orgAdminUserId,
							role: "administrator",
						},
					},
				});

				// Create invite-only event
				const startAt = new Date(
					Date.now() + 24 * 60 * 60 * 1000,
				).toISOString();
				const endAt = new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString();

				const createEventResult = await mercuriusClient.mutate(
					Mutation_createEvent,
					{
						headers: { authorization: `bearer ${adminAuthToken}` },
						variables: {
							input: {
								name: `Invite-Only Event ${faker.string.uuid()}`,
								organizationId: organization.id,
								startAt,
								endAt,
								isInviteOnly: true,
								isRegisterable: true,
							},
						},
					},
				);

				if (
					createEventResult.errors ||
					!createEventResult.data?.createEvent?.id
				) {
					throw new Error(
						`Failed to create invite-only event: ${JSON.stringify(
							createEventResult.errors,
						)}`,
					);
				}

				const eventId = createEventResult.data.createEvent.id;

				// Organization admin can access the invite-only event
				const queryResult = await mercuriusClient.query(Query_event, {
					headers: {
						authorization: `bearer ${orgAdminUserToken}`,
					},
					variables: {
						input: {
							id: eventId,
						},
					},
				});

				expect(queryResult.data?.event).not.toBeNull();
				expect(queryResult.data?.event?.id).toBe(eventId);
				expect(queryResult.data?.event?.isInviteOnly).toBe(true);

				// Cleanup
				testCleanupFunctions.push(async () => {
					await mercuriusClient.mutate(Mutation_deleteUser, {
						headers: { authorization: `bearer ${adminAuthToken}` },
						variables: { input: { id: orgAdminUserId } },
					});
				});
			});
		});
	});
});
