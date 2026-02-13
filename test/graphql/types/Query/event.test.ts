import { faker } from "@faker-js/faker";
import { eq } from "drizzle-orm";
import { uuidv7 } from "uuidv7";
import { afterEach, expect, suite, test, vi } from "vitest";
import { eventsTable } from "~/src/drizzle/tables/events";
import type {
	ArgumentsAssociatedResourcesNotFoundExtensions,
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
	Mutation_deleteEntireRecurringEventSeries,
	Mutation_deleteOrganization,
	Mutation_deleteStandaloneEvent,
	Mutation_deleteUser,
	Mutation_inviteEventAttendee,
	Mutation_registerForEvent,
	Query_event,
	Query_getRecurringEvents,
	Query_signIn,
} from "../documentNodes";

async function signInAsAdmin(): Promise<{ token: string; userId: string }> {
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
	const token = res.data.signIn.authenticationToken;
	const userId = res.data.signIn.user.id;
	assertToBeNonNullish(token);
	assertToBeNonNullish(userId);
	return { token, userId };
}

suite("Query field event", () => {
	// Helper function to get admin auth token and user ID
	async function getAdminTokenAndUserId() {
		const { token, userId } = await signInAsAdmin();
		return { authToken: token, userId };
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
			// Offset from the far-future base date (in ms); default shifts start by 24h
			startOffset = 24 * 60 * 60 * 1000,
			description = "Test Event",
			name = "Test Event",
		} = options;

		// Use far-future fixed date to prevent past-date failures
		const baseDate = new Date("2099-03-01T10:00:00Z");
		const startAt = new Date(baseDate.getTime() + startOffset);
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

	// Helper function to set up invite-only test scenario
	async function setupInviteOnlyTestScenario(
		adminAuthToken: string,
		adminUserId: string,
		testCleanupFunctions: Array<() => Promise<void>>,
	) {
		// Create test organization
		const organization = await createTestOrganization(
			adminAuthToken,
			adminUserId,
		);

		// Cleanup: Delete organization
		testCleanupFunctions.push(async () => {
			await mercuriusClient.mutate(Mutation_deleteOrganization, {
				headers: { authorization: `bearer ${adminAuthToken}` },
				variables: { input: { id: organization.id } },
			});
		});

		// Create a regular user
		const regularUserResult = await mercuriusClient.mutate(
			Mutation_createUser,
			{
				headers: { authorization: `bearer ${adminAuthToken}` },
				variables: {
					input: {
						emailAddress: `${faker.string.ulid()}@test.com`,
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

		// Cleanup: Delete user
		testCleanupFunctions.push(async () => {
			await mercuriusClient.mutate(Mutation_deleteUser, {
				headers: { authorization: `bearer ${adminAuthToken}` },
				variables: { input: { id: regularUserId } },
			});
		});

		// Add user to organization
		const membershipResult = await mercuriusClient.mutate(
			Mutation_createOrganizationMembership,
			{
				headers: { authorization: `bearer ${adminAuthToken}` },
				variables: {
					input: {
						organizationId: organization.id,
						memberId: regularUserId,
						role: "regular",
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

		// Create invite-only event
		const startAt = "2099-03-01T10:00:00Z";
		const endAt = "2099-03-01T11:00:00Z";

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

		if (createEventResult.errors || !createEventResult.data?.createEvent?.id) {
			throw new Error(
				`Failed to create invite-only event: ${JSON.stringify(
					createEventResult.errors,
				)}`,
			);
		}

		const eventId = createEventResult.data.createEvent.id;

		// Cleanup: Delete event
		testCleanupFunctions.push(async () => {
			await mercuriusClient.mutate(Mutation_deleteStandaloneEvent, {
				headers: { authorization: `bearer ${adminAuthToken}` },
				variables: { input: { id: eventId } },
			});
		});

		return {
			organization,
			eventId,
			regularUserId,
			regularUserToken,
		};
	}

	suite(
		`results in a graphql error with "unauthenticated" extensions code in the "errors" field and "null" as the value of "data.event" field if`,
		() => {
			const testCleanupFunctions: Array<() => Promise<void>> = [];

			afterEach(async () => {
				vi.restoreAllMocks();
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
				const { event, organization } = await setupTestData(authToken, userId);
				const deletedUser = await createAndDeleteTestUser(authToken);

				// Cleanup: Delete organization
				testCleanupFunctions.push(async () => {
					await mercuriusClient.mutate(Mutation_deleteOrganization, {
						headers: { authorization: `bearer ${authToken}` },
						variables: { input: { id: organization.id } },
					});
				});

				// Cleanup: Delete event
				testCleanupFunctions.push(async () => {
					await mercuriusClient.mutate(Mutation_deleteStandaloneEvent, {
						headers: { authorization: `bearer ${authToken}` },
						variables: { input: { id: event.id } },
					});
				});

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
				expect(error?.message).toBe("Internal Server Error");
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
				expect(error?.message).toBe("Internal Server Error");
				expect(error?.path).toEqual(["event"]);
			});

			test("provided event ID is not a valid ULID.", async () => {
				const authToken = await getAdminToken();
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
				expect(error?.message).toBe("Internal Server Error");
				expect(error?.path).toEqual(["event"]);
			});
		},
	);

	suite(
		"returns arguments_associated_resources_not_found for valid-but-missing IDs",
		() => {
			test("returns error when event does not exist for a valid ULID", async () => {
				const authToken = await getAdminToken();
				const nonExistentId = uuidv7();
				const result = await mercuriusClient.query(Query_event, {
					headers: {
						authorization: `bearer ${authToken}`,
					},
					variables: {
						input: {
							id: nonExistentId,
						},
					},
				});

				expect(result.data.event).toBeNull();
				expect(result.errors).toBeDefined();
				expect(result.errors).toHaveLength(1);
				// Validate error structure safely
				const error = result.errors?.[0];
				expect(error).toBeDefined();
				expect(result.errors).toEqual(
					expect.arrayContaining<TalawaGraphQLFormattedError>([
						expect.objectContaining<TalawaGraphQLFormattedError>({
							extensions:
								expect.objectContaining<ArgumentsAssociatedResourcesNotFoundExtensions>(
									{
										code: "arguments_associated_resources_not_found",
										issues: expect.arrayContaining([
											expect.objectContaining({
												argumentPath: ["input", "id"],
											}),
										]),
									},
								),
							message:
								"No associated resources found for the provided arguments.",
							path: ["event"],
						}),
					]),
				);
			});
		},
	);

	suite("Access control tests", () => {
		const testCleanupFunctions: Array<() => Promise<void>> = [];

		afterEach(async () => {
			vi.restoreAllMocks();
			for (const cleanup of testCleanupFunctions.reverse()) {
				try {
					await cleanup();
				} catch (error) {
					console.error("Cleanup failed:", error);
				}
			}
			testCleanupFunctions.length = 0;
		});

		test("unauthorized regular user cannot access event from an organization they are not a member of", async () => {
			const { authToken: adminAuthToken, userId: adminUserId } =
				await getAdminTokenAndUserId();
			const organization = await createTestOrganization(
				adminAuthToken,
				adminUserId,
			);

			// Cleanup: Delete organization
			testCleanupFunctions.push(async () => {
				await mercuriusClient.mutate(Mutation_deleteOrganization, {
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: { input: { id: organization.id } },
				});
			});

			const event = await createTestEvent(adminAuthToken, organization.id);

			// Cleanup: Delete event
			testCleanupFunctions.push(async () => {
				await mercuriusClient.mutate(Mutation_deleteStandaloneEvent, {
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: { input: { id: event.id } },
				});
			});

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
			assertToBeNonNullish(user.user);
			const createdUserId = user.user.id;

			// Cleanup: Delete user
			testCleanupFunctions.push(async () => {
				await mercuriusClient.mutate(Mutation_deleteUser, {
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: { input: { id: createdUserId } },
				});
			});

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

		test("admin user can access event from any organization", async () => {
			const { authToken: adminAuthToken, userId: adminUserId } =
				await getAdminTokenAndUserId();

			// Create test organization
			const organization = await createTestOrganization(
				adminAuthToken,
				adminUserId,
			);

			// Cleanup: Delete organization
			testCleanupFunctions.push(async () => {
				await mercuriusClient.mutate(Mutation_deleteOrganization, {
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: { input: { id: organization.id } },
				});
			});

			// Create test event using helper
			const event = await createTestEvent(adminAuthToken, organization.id);

			// Cleanup: Delete event
			testCleanupFunctions.push(async () => {
				await mercuriusClient.mutate(Mutation_deleteStandaloneEvent, {
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: { input: { id: event.id } },
				});
			});

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
	});

	suite(
		`results in a graphql error with "invalid_arguments" extensions code in the "errors" field and "null" as the value of "data.event" field if`,
		() => {
			test("input validation fails", async () => {
				const authToken = await getAdminToken();

				// Pass invalid input that fails Zod validation
				const result = await mercuriusClient.query(Query_event, {
					headers: {
						authorization: `bearer ${authToken}`,
					},
					variables: {
						input: {
							id: "", // empty id as invalid argument
						},
					},
				});

				expect(result.data.event).toBeNull();
				expect(result.errors).toBeDefined();
				expect(result.errors).toEqual(
					expect.arrayContaining<TalawaGraphQLFormattedError>([
						expect.objectContaining<TalawaGraphQLFormattedError>({
							extensions: expect.objectContaining({
								code: "invalid_arguments",
								issues: expect.any(Array),
							}),
							message: expect.any(String),
							path: ["event"],
						}),
					]),
				);
			});
		},
	);

	// These additional test cases do not improve coverage from the actual files, However -> They help testing the application better
	suite("Additional event tests", () => {
		const testCleanupFunctions: Array<() => Promise<void>> = [];

		afterEach(async () => {
			vi.restoreAllMocks();
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

			// Cleanup: Delete organization
			testCleanupFunctions.push(async () => {
				await mercuriusClient.mutate(Mutation_deleteOrganization, {
					headers: { authorization: `bearer ${authToken}` },
					variables: { input: { id: organization.id } },
				});
			});

			// Create an event in the past directly in DB to bypass mutation validation
			// Use fixed UTC timestamps for deterministic assertions
			const pastStartAt = new Date("2025-01-01T10:00:00Z");
			const pastEndAt = new Date("2025-01-02T10:00:00Z");
			const pastEventId = uuidv7();
			await server.drizzleClient.insert(eventsTable).values({
				id: pastEventId,
				name: "Past Event",
				description: "Past Event",
				startAt: pastStartAt,
				endAt: pastEndAt,
				organizationId: organization.id,
				creatorId: userId,
				allDay: false,
				isInviteOnly: false,
				isPublic: true,
				isRegisterable: true,
				isRecurringEventTemplate: false,
			});

			// Cleanup: Delete the directly-inserted event
			testCleanupFunctions.push(async () => {
				await server.drizzleClient
					.delete(eventsTable)
					.where(eq(eventsTable.id, pastEventId));
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
			expect(new Date(queriedEvent.startAt).getTime()).toBe(
				pastStartAt.getTime(),
			);
			expect(new Date(queriedEvent.endAt).getTime()).toBe(pastEndAt.getTime());
		});

		test("handles multi-day events correctly", async () => {
			const { authToken, userId } = await getAdminTokenAndUserId();
			const organization = await createTestOrganization(authToken, userId);

			// Cleanup: Delete organization
			testCleanupFunctions.push(async () => {
				await mercuriusClient.mutate(Mutation_deleteOrganization, {
					headers: { authorization: `bearer ${authToken}` },
					variables: { input: { id: organization.id } },
				});
			});

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
							startAt: "2099-03-01T10:00:00Z", // Far-future fixed date
							endAt: "2099-03-04T10:00:00Z", // 3 days later
							name: "Annual Conference",
							organizationId: organization.id,
						},
					},
				},
			);

			const multiDayEvent = multiDayEventResult.data?.createEvent;
			assertToBeNonNullish(multiDayEvent);

			// Cleanup: Delete event
			testCleanupFunctions.push(async () => {
				await mercuriusClient.mutate(Mutation_deleteStandaloneEvent, {
					headers: { authorization: `bearer ${authToken}` },
					variables: { input: { id: multiDayEvent.id } },
				});
			});

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
			// Freeze time at a fixed mid-month UTC timestamp for deterministic date calculations
			vi.useFakeTimers({ now: new Date("2026-06-15T12:00:00Z") });

			// Calculate dates within the materialization window
			// Note: Cannot use fixed future dates (e.g., 2099) because the server calculates the materialization window as current_date + N months. If the event starts after this window, no instances are generated (windowStart > windowEnd), causing the test to fail.
			const baseDate = new Date();
			baseDate.setUTCMonth(baseDate.getUTCMonth() + 1); // Start event 1 month from now
			baseDate.setUTCHours(10, 0, 0, 0);
			const startAt = baseDate.toISOString();

			const endDate = new Date(baseDate);
			endDate.setUTCHours(11, 0, 0, 0);
			const endAt = endDate.toISOString();

			// Restore real timers before making async API calls
			vi.useRealTimers();

			const { authToken, userId } = await getAdminTokenAndUserId();

			const organization = await createTestOrganization(authToken, userId);
			assertToBeNonNullish(organization);
			const organizationId = organization.id;

			// Cleanup: Delete organization
			testCleanupFunctions.push(async () => {
				await mercuriusClient.mutate(Mutation_deleteOrganization, {
					headers: { authorization: `bearer ${authToken}` },
					variables: { input: { id: organizationId } },
				});
			});

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

			// Cleanup: Delete recurring event template (cascades to instances)
			testCleanupFunctions.push(async () => {
				await mercuriusClient.mutate(
					Mutation_deleteEntireRecurringEventSeries,
					{
						headers: { authorization: `bearer ${authToken}` },
						variables: { input: { id: baseRecurringEventId } },
					},
				);
			});

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

				const { eventId, regularUserToken } = await setupInviteOnlyTestScenario(
					adminAuthToken,
					adminUserId,
					testCleanupFunctions,
				);

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
			});

			test("invited user can access invite-only event", async () => {
				const { authToken: adminAuthToken, userId: adminUserId } =
					await getAdminTokenAndUserId();

				const { eventId, regularUserId, regularUserToken } =
					await setupInviteOnlyTestScenario(
						adminAuthToken,
						adminUserId,
						testCleanupFunctions,
					);

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
			});

			test("unauthorized regular member denied access", async () => {
				const { authToken: adminAuthToken, userId: adminUserId } =
					await getAdminTokenAndUserId();

				const { eventId, regularUserToken } = await setupInviteOnlyTestScenario(
					adminAuthToken,
					adminUserId,
					testCleanupFunctions,
				);

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

				// For invite-only events, the resolver returns null without an error
				// when the user is not creator/admin/invited/registered
				expect(queryResult.data?.event).toBeNull();
				expect(queryResult.errors).toBeUndefined();
			});

			test("event creator can access invite-only event", async () => {
				const { authToken: adminAuthToken, userId: adminUserId } =
					await getAdminTokenAndUserId();

				// Create test organization
				const organization = await createTestOrganization(
					adminAuthToken,
					adminUserId,
				);

				// Cleanup: Delete organization
				testCleanupFunctions.push(async () => {
					await mercuriusClient.mutate(Mutation_deleteOrganization, {
						headers: { authorization: `bearer ${adminAuthToken}` },
						variables: { input: { id: organization.id } },
					});
				});

				// Create invite-only event as admin (admin becomes the creator)
				const startAt = "2099-03-01T10:00:00Z";
				const endAt = "2099-03-01T11:00:00Z";

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

				// Cleanup: Delete event
				testCleanupFunctions.push(async () => {
					await mercuriusClient.mutate(Mutation_deleteStandaloneEvent, {
						headers: { authorization: `bearer ${adminAuthToken}` },
						variables: { input: { id: eventId } },
					});
				});

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

				// Cleanup: Delete organization
				testCleanupFunctions.push(async () => {
					await mercuriusClient.mutate(Mutation_deleteOrganization, {
						headers: { authorization: `bearer ${adminAuthToken}` },
						variables: { input: { id: organization.id } },
					});
				});

				// Create a regular user who will be an org admin
				const orgAdminUserResult = await mercuriusClient.mutate(
					Mutation_createUser,
					{
						headers: { authorization: `bearer ${adminAuthToken}` },
						variables: {
							input: {
								emailAddress: `${faker.string.ulid()}@test.com`,
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

				// Cleanup: Delete user
				testCleanupFunctions.push(async () => {
					await mercuriusClient.mutate(Mutation_deleteUser, {
						headers: { authorization: `bearer ${adminAuthToken}` },
						variables: { input: { id: orgAdminUserId } },
					});
				});

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
				const startAt = "2099-03-01T10:00:00Z";
				const endAt = "2099-03-01T11:00:00Z";

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

				// Cleanup: Delete event
				testCleanupFunctions.push(async () => {
					await mercuriusClient.mutate(Mutation_deleteStandaloneEvent, {
						headers: { authorization: `bearer ${adminAuthToken}` },
						variables: { input: { id: eventId } },
					});
				});

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
			});
		});
	});
});
