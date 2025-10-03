import { faker } from "@faker-js/faker";
import { expect, suite, test, vi } from "vitest";
import type {
	TalawaGraphQLFormattedError,
	UnauthenticatedExtensions,
} from "~/src/utilities/TalawaGraphQLError";
import { createMockDrizzleClient } from "../../../_Mocks_/drizzleClientMock";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	Mutation_createUser,
	Mutation_deleteUser,
	Query_signIn,
	UPDATE_ACTION_ITEM_MUTATION,
} from "../documentNodes";

vi.mock("~/src/drizzle/client", () => {
	return {
		drizzleClient: createMockDrizzleClient(),
	};
});

suite("Mutation field updateActionItem", () => {
	test("should return unauthenticated error if client is not signed in", async () => {
		const result = await mercuriusClient.mutate(UPDATE_ACTION_ITEM_MUTATION, {
			variables: {
				input: {
					id: faker.string.uuid(),
					isCompleted: false,
				},
			},
		});

		const data =
			result.data === null ? { updateActionItem: null } : result.data;
		expect(data.updateActionItem).toBeNull();
		expect(result.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					extensions: expect.objectContaining({ code: "unauthenticated" }),
					path: ["updateActionItem"],
				}),
			]),
		);
	});

	test("should return invalid_arguments error when input is invalid", async () => {
		const signInResult = await mercuriusClient.query(Query_signIn, {
			variables: {
				input: {
					emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
					password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
				},
			},
		});
		const token = signInResult.data?.signIn?.authenticationToken;
		assertToBeNonNullish(token);

		const result = await mercuriusClient.mutate(UPDATE_ACTION_ITEM_MUTATION, {
			headers: {
				authorization: `bearer ${token}`,
			},
			variables: {
				input: {
					id: "invalid-uuid",
					isCompleted: false,
				},
			},
		});

		const data =
			result.data === null ? { updateActionItem: null } : result.data;
		expect(data.updateActionItem).toBeNull();
		expect(result.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					extensions: expect.objectContaining({ code: "invalid_arguments" }),
					path: ["updateActionItem"],
				}),
			]),
		);
	});

	suite(
		'results in a graphql error with "unauthenticated" extensions code in the "errors" field and "null" as the value of "data.updateActionItem" field if',
		() => {
			test("client triggering the graphql operation is not authenticated.", async () => {
				const result = await mercuriusClient.mutate(
					UPDATE_ACTION_ITEM_MUTATION,
					{
						variables: {
							input: {
								id: faker.string.uuid(),
								isCompleted: false,
								postCompletionNotes: "Updated Action Item",
							},
						},
					},
				);

				const data =
					result.data === null ? { updateActionItem: null } : result.data;
				expect(data.updateActionItem).toBeNull();
				expect(result.errors).toEqual(
					expect.arrayContaining<TalawaGraphQLFormattedError>([
						expect.objectContaining<TalawaGraphQLFormattedError>({
							extensions: expect.objectContaining<UnauthenticatedExtensions>({
								code: "unauthenticated",
							}),
							message: expect.any(String),
							path: ["updateActionItem"],
						}),
					]),
				);
			});

			test("client triggering the GraphQL operation has no existing user associated to their authentication context.", async () => {
				// Sign in as Administrator
				const administratorUserSignInResult = await mercuriusClient.query(
					Query_signIn,
					{
						variables: {
							input: {
								emailAddress:
									server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
								password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
							},
						},
					},
				);

				assertToBeNonNullish(
					administratorUserSignInResult.data.signIn?.authenticationToken,
				);

				// Create and delete user setup...
				const createUserResult = await mercuriusClient.mutate(
					Mutation_createUser,
					{
						headers: {
							authorization: `bearer ${administratorUserSignInResult.data.signIn.authenticationToken}`,
						},
						variables: {
							input: {
								emailAddress: `emailAddress${faker.string.ulid()}@email.com`,
								isEmailAddressVerified: false,
								name: "Test User",
								password: "TestPassword123",
								role: "regular",
							},
						},
					},
				);

				assertToBeNonNullish(
					createUserResult.data.createUser?.authenticationToken,
				);
				assertToBeNonNullish(createUserResult.data.createUser.user?.id);

				const userToken = createUserResult.data.createUser.authenticationToken;
				const userId = createUserResult.data.createUser.user.id;

				await mercuriusClient.mutate(Mutation_deleteUser, {
					headers: {
						authorization: `bearer ${administratorUserSignInResult.data.signIn.authenticationToken}`,
					},
					variables: {
						input: { id: userId },
					},
				});

				const result = await mercuriusClient.mutate(
					UPDATE_ACTION_ITEM_MUTATION,
					{
						headers: {
							authorization: `bearer ${userToken}`,
						},
						variables: {
							input: {
								id: faker.string.uuid(),
								isCompleted: false,
								postCompletionNotes: "Updated Action Item",
							},
						},
					},
				);

				const data =
					result.data === null ? { updateActionItem: null } : result.data;
				expect(data.updateActionItem).toBeNull();
				expect(result.errors).toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							extensions: expect.objectContaining({
								code: "unauthenticated",
							}),
							message: expect.any(String),
							path: ["updateActionItem"],
						}),
					]),
				);
			});
		},
	);

	suite("unauthenticated access", () => {
		test("returns unauthenticated error if client is not logged in", async () => {
			const result = await mercuriusClient.mutate(UPDATE_ACTION_ITEM_MUTATION, {
				variables: {
					input: {
						id: faker.string.uuid(),
						isCompleted: false,
					},
				},
			});

			const data =
				result.data === null ? { updateActionItem: null } : result.data;
			expect(data.updateActionItem).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining<TalawaGraphQLFormattedError>([
					expect.objectContaining({
						extensions: expect.objectContaining<UnauthenticatedExtensions>({
							code: "unauthenticated",
						}),
						path: ["updateActionItem"],
					}),
				]),
			);
		});

		test("returns unauthenticated error if user no longer exists", async () => {
			const signIn = await mercuriusClient.query(Query_signIn, {
				variables: {
					input: {
						emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
						password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
					},
				},
			});

			const adminToken = signIn.data?.signIn?.authenticationToken;
			assertToBeNonNullish(adminToken);

			const userResult = await mercuriusClient.mutate(Mutation_createUser, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: {
					input: {
						emailAddress: `temp${faker.string.uuid()}@example.com`,
						name: "Temp User",
						password: "TempPass123",
						isEmailAddressVerified: true,
						role: "regular",
					},
				},
			});

			const token = userResult.data?.createUser?.authenticationToken;
			const userId = userResult.data?.createUser?.user?.id;
			assertToBeNonNullish(token);
			assertToBeNonNullish(userId);

			await mercuriusClient.mutate(Mutation_deleteUser, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: { input: { id: userId } },
			});

			const result = await mercuriusClient.mutate(UPDATE_ACTION_ITEM_MUTATION, {
				headers: { authorization: `bearer ${token}` },
				variables: {
					input: {
						id: faker.string.uuid(),
						isCompleted: false,
						postCompletionNotes: "Update",
					},
				},
			});

			const data =
				result.data === null ? { updateActionItem: null } : result.data;
			expect(data.updateActionItem).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "unauthenticated",
						}),
						path: ["updateActionItem"],
					}),
				]),
			);
		});
	});

	test("returns not_found error when updating nonexistent item", async () => {
		const signIn = await mercuriusClient.query(Query_signIn, {
			variables: {
				input: {
					emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
					password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
				},
			},
		});

		const token = signIn.data?.signIn?.authenticationToken;
		assertToBeNonNullish(token);

		const result = await mercuriusClient.mutate(UPDATE_ACTION_ITEM_MUTATION, {
			headers: { authorization: `bearer ${token}` },
			variables: {
				input: {
					id: faker.string.uuid(),
					isCompleted: false,
					postCompletionNotes: "Invalid update",
				},
			},
		});

		const data =
			result.data === null ? { updateActionItem: null } : result.data;
		expect(data.updateActionItem).toBeNull();
		expect(result.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					extensions: expect.objectContaining({
						code: "arguments_associated_resources_not_found",
					}),
				}),
			]),
		);
	});
});
