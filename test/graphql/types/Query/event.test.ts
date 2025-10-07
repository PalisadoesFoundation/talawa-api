import { faker } from "@faker-js/faker";
import { afterEach, beforeAll, expect, suite, test } from "vitest";
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
	Query_event,
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
			startOffset = 0,
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

			// Create an event in the past
			const pastEventResult = await mercuriusClient.mutate(
				Mutation_createEvent,
				{
					headers: {
						authorization: `bearer ${authToken}`,
					},
					variables: {
						input: {
							description: "Past Event",
							// Set dates to last week
							startAt: new Date(
								Date.now() - 7 * 24 * 60 * 60 * 1000,
							).toISOString(),
							endAt: new Date(
								Date.now() - 6 * 24 * 60 * 60 * 1000,
							).toISOString(),
							name: "Past Event",
							organizationId: organization.id,
						},
					},
				},
			);

			const pastEvent = pastEventResult.data?.createEvent;
			assertToBeNonNullish(pastEvent);

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
	});
});
