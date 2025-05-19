import { faker } from "@faker-js/faker";
import { expect, suite, test } from "vitest";
import type {
	InvalidArgumentsExtensions,
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
	Mutation_createUser,
	Mutation_deleteUser,
	Query_event,
	Query_signIn,
} from "../documentNodes";

suite("Query field event", () => {
	// Helper function to get admin auth token
	async function getAdminToken() {
		const signInResult = await mercuriusClient.query(Query_signIn, {
			variables: {
				input: {
					emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
					password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
				},
			},
		});

		const authToken = signInResult.data?.signIn?.authenticationToken;
		assertToBeNonNullish(authToken);
		return authToken;
	}

	// Helper function to create an organization
	async function createTestOrganization(authToken: string) {
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
		assertToBeNonNullish(organization);
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
		assertToBeNonNullish(event);
		return event;
	}

	async function setupTestData(authToken: string) {
		const organization = await createTestOrganization(authToken);
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
				const authToken = await getAdminToken();
				const { event } = await setupTestData(authToken);
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
		`results in a graphql error with "invalid_arguments" extensions code in the "errors" field and "null" as the value of "data.event" field if`,
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
				expect(result.errors).toEqual(
					expect.arrayContaining<TalawaGraphQLFormattedError>([
						expect.objectContaining<TalawaGraphQLFormattedError>({
							extensions: expect.objectContaining<InvalidArgumentsExtensions>({
								code: "invalid_arguments",
								issues: expect.arrayContaining([
									expect.objectContaining({
										argumentPath: ["input", "id"],
										message: "Invalid uuid",
									}),
								]),
							}),
							message: "You have provided invalid arguments for this action.",
							path: ["event"],
						}),
					]),
				);
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
				expect(result.errors).toEqual(
					expect.arrayContaining<TalawaGraphQLFormattedError>([
						expect.objectContaining<TalawaGraphQLFormattedError>({
							extensions: expect.objectContaining<InvalidArgumentsExtensions>({
								code: "invalid_arguments",
								issues: expect.arrayContaining([
									expect.objectContaining({
										argumentPath: ["input", "id"],
										message: "Invalid uuid",
									}),
								]),
							}),
							message: "You have provided invalid arguments for this action.",
							path: ["event"],
						}),
					]),
				);
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
				expect(eventResult.errors).toEqual(
					expect.arrayContaining<TalawaGraphQLFormattedError>([
						expect.objectContaining<TalawaGraphQLFormattedError>({
							extensions: expect.objectContaining<InvalidArgumentsExtensions>({
								code: "invalid_arguments",
								issues: expect.arrayContaining([
									expect.objectContaining({
										argumentPath: ["input", "id"],
										message: "Invalid uuid",
									}),
								]),
							}),
							message: "You have provided invalid arguments for this action.",
							path: ["event"],
						}),
					]),
				);
			});
		},
	);

	test("unauthorized regular user cannot access event from an organization they are not a member of", async () => {
		const adminAuthToken = await getAdminToken();
		const organization = await createTestOrganization(adminAuthToken);
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
		const adminAuthToken = await getAdminToken();

		// Create test organization
		const orgResult = await mercuriusClient.mutate(
			Mutation_createOrganization,
			{
				headers: {
					authorization: `bearer ${adminAuthToken}`,
				},
				variables: {
					input: {
						countryCode: "us",
						name: "Test Organization",
					},
				},
			},
		);

		const organization = orgResult.data?.createOrganization;
		assertToBeNonNullish(organization);

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
		test("handles events with past dates correctly", async () => {
			const authToken = await getAdminToken();
			const organization = await createTestOrganization(authToken);

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
			const authToken = await getAdminToken();
			const organization = await createTestOrganization(authToken);

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

		test("handles events with minimal fields correctly", async () => {
			const authToken = await getAdminToken();
			const organization = await createTestOrganization(authToken);

			// Create an event with only required fields
			const minimalEventResult = await mercuriusClient.mutate(
				Mutation_createEvent,
				{
					headers: {
						authorization: `bearer ${authToken}`,
					},
					variables: {
						input: {
							name: "Minimal Event",
							startAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour from now
							endAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
							organizationId: organization.id,
						},
					},
				},
			);

			const minimalEvent = minimalEventResult.data?.createEvent;
			assertToBeNonNullish(minimalEvent);

			// Query the minimal event
			const queryResult = await mercuriusClient.query(Query_event, {
				headers: {
					authorization: `bearer ${authToken}`,
				},
				variables: {
					input: {
						id: minimalEvent.id,
					},
				},
			});

			const queriedEvent = queryResult.data.event;
			expect(queriedEvent).not.toBeNull();
			assertToBeNonNullish(queriedEvent);
			expect(queriedEvent.id).toBe(minimalEvent.id);
			expect(queriedEvent.description).toBeNull();
		});

		test("handles concurrent access patterns correctly", async () => {
			const authToken = await getAdminToken();
			const organization = await createTestOrganization(authToken);

			// Create an initial event
			const eventResult = await mercuriusClient.mutate(Mutation_createEvent, {
				headers: {
					authorization: `bearer ${authToken}`,
				},
				variables: {
					input: {
						name: "Concurrent Access Event",
						startAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
						endAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
						organizationId: organization.id,
					},
				},
			});

			const event = eventResult.data?.createEvent;
			assertToBeNonNullish(event);

			// Perform multiple concurrent queries
			const concurrentQueries = Array(5)
				.fill(null)
				.map(() =>
					mercuriusClient.query(Query_event, {
						headers: {
							authorization: `bearer ${authToken}`,
						},
						variables: {
							input: {
								id: event.id,
							},
						},
					}),
				);

			const results = await Promise.all(concurrentQueries);

			// Verify all queries returned the same data
			for (const result of results) {
				const queriedEvent = result.data.event;
				expect(queriedEvent).not.toBeNull();
				assertToBeNonNullish(queriedEvent);
				expect(queriedEvent.id).toBe(event.id);
				expect(queriedEvent.name).toBe("Concurrent Access Event");
			}
		});
	});
});
