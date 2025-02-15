import { faker } from "@faker-js/faker";
import { expect, suite, test } from "vitest";
import type {
	ArgumentsAssociatedResourcesNotFoundExtensions,
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

				// Create test organization and event
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

				const eventResult = await mercuriusClient.mutate(Mutation_createEvent, {
					headers: {
						authorization: `bearer ${authToken}`,
					},
					variables: {
						input: {
							description: "Test Event",
							endAt: new Date(Date.now() + 86400000).toISOString(),
							name: "Test Event",
							organizationId: organization.id,
							startAt: new Date().toISOString(),
						},
					},
				});

				const event = eventResult.data?.createEvent;
				assertToBeNonNullish(event);

				// Create and sign in as a regular user
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

				// Delete the user to make authentication context invalid
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

				// Try to access event with deleted user's token
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

	// For this test, we'll need to generate a valid ULID that doesn't exist in the database
	test("fails with resource not found when event with valid ID doesn't exist", async () => {
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

		const validNonExistentId = crypto.randomUUID();

		const eventResult = await mercuriusClient.query(Query_event, {
			headers: {
				authorization: `bearer ${authToken}`,
			},
			variables: {
				input: {
					id: validNonExistentId,
				},
			},
		});

		expect(eventResult.data.event).toBeNull();
		expect(eventResult.errors).toEqual(
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
					message: expect.any(String),
					path: ["event"],
				}),
			]),
		);
	});

	test("unauthorized regular user cannot access event from an organization they are not a member of", async () => {
		// First sign in as admin to create test data
		const signInResult = await mercuriusClient.query(Query_signIn, {
			variables: {
				input: {
					emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
					password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
				},
			},
		});

		const adminAuthToken = signInResult.data?.signIn?.authenticationToken;
		assertToBeNonNullish(adminAuthToken);

		// Create test organization and event
		const orgResult = await mercuriusClient.mutate(
			Mutation_createOrganization,
			{
				headers: {
					authorization: `bearer ${adminAuthToken}`,
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

		const eventResult = await mercuriusClient.mutate(Mutation_createEvent, {
			headers: {
				authorization: `bearer ${adminAuthToken}`,
			},
			variables: {
				input: {
					description: "Test Event",
					endAt: new Date(Date.now() + 86400000).toISOString(),
					name: "Test Event",
					organizationId: organization.id,
					startAt: new Date().toISOString(),
				},
			},
		});

		const event = eventResult.data?.createEvent;
		assertToBeNonNullish(event);

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

	test("admin user can access event from any organization", async () => {
		// Sign in as admin
		const signInResult = await mercuriusClient.query(Query_signIn, {
			variables: {
				input: {
					emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
					password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
				},
			},
		});

		const adminAuthToken = signInResult.data?.signIn?.authenticationToken;
		assertToBeNonNullish(adminAuthToken);

		// Create test organization and event
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

		const eventResult = await mercuriusClient.mutate(Mutation_createEvent, {
			headers: {
				authorization: `bearer ${adminAuthToken}`,
			},
			variables: {
				input: {
					description: "Test Event",
					endAt: new Date(Date.now() + 86400000).toISOString(),
					name: "Test Event",
					organizationId: organization.id,
					startAt: new Date().toISOString(),
				},
			},
		});

		const event = eventResult.data?.createEvent;
		assertToBeNonNullish(event);

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
