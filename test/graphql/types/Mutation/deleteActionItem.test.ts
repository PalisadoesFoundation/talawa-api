import { faker } from "@faker-js/faker";
import { expect, suite, test } from "vitest";
import type {
	TalawaGraphQLFormattedError,
	UnauthenticatedExtensions,
} from "~/src/utilities/TalawaGraphQLError";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	DELETE_ACTION_ITEM_MUTATION,
	Mutation_createUser,
	Query_signIn,
} from "../documentNodes";

suite("Mutation field deleteActionItem", () => {
	suite(
		'results in a graphql error with "unauthenticated" extensions code in the "errors" field and "null" as the value of "data.deleteActionItem" field if',
		() => {
			test("client triggering the graphql operation is not authenticated.", async () => {
				const deleteActionItemResult = await mercuriusClient.mutate(
					DELETE_ACTION_ITEM_MUTATION,
					{
						variables: {
							input: {
								id: faker.string.uuid(),
							},
						},
					},
				);

				const data =
					deleteActionItemResult.data === null
						? { deleteActionItem: null }
						: deleteActionItemResult.data;

				expect(data.deleteActionItem).toEqual(null);
				expect(deleteActionItemResult.errors?.[0]).toEqual(
					expect.objectContaining<TalawaGraphQLFormattedError>({
						extensions: expect.objectContaining<UnauthenticatedExtensions>({
							code: "unauthenticated",
						}),
						message: expect.any(String),
						path: ["deleteActionItem"],
					}),
				);
			});

			test("client is authenticated but has no user associated in the system.", async () => {
				const adminSignInResult = await mercuriusClient.query(Query_signIn, {
					variables: {
						input: {
							emailAddress:
								server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
							password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
						},
					},
				});

				assertToBeNonNullish(
					adminSignInResult.data.signIn?.authenticationToken,
				);

				const createUserResult = await mercuriusClient.mutate(
					Mutation_createUser,
					{
						headers: {
							authorization: `bearer ${adminSignInResult.data.signIn.authenticationToken}`,
						},
						variables: {
							input: {
								emailAddress: `email${faker.string.ulid()}@test.com`,
								isEmailAddressVerified: false,
								name: "test",
								password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
								role: "regular",
							},
						},
					},
				);

				assertToBeNonNullish(createUserResult.data.createUser?.user?.id);

				await mercuriusClient.mutate(
					`#graphql
            mutation DeleteUser($input: MutationDeleteUserInput!) {
              deleteUser(input: $input) { id }
            }`,
					{
						headers: {
							authorization: `bearer ${adminSignInResult.data.signIn.authenticationToken}`,
						},
						variables: {
							input: {
								id: createUserResult.data.createUser.user.id,
							},
						},
					},
				);

				assertToBeNonNullish(
					createUserResult.data.createUser.authenticationToken,
				);

				const deleteActionItemResult = await mercuriusClient.mutate(
					DELETE_ACTION_ITEM_MUTATION,
					{
						headers: {
							authorization: `bearer ${createUserResult.data.createUser.authenticationToken}`,
						},
						variables: {
							input: {
								id: faker.string.uuid(),
							},
						},
					},
				);

				const data =
					deleteActionItemResult.data === null
						? { deleteActionItem: null }
						: deleteActionItemResult.data;

				expect(data.deleteActionItem).toEqual(null);
				expect(deleteActionItemResult.errors?.[0]).toEqual(
					expect.objectContaining<TalawaGraphQLFormattedError>({
						extensions: expect.objectContaining<UnauthenticatedExtensions>({
							code: "unauthenticated",
						}),
						message: expect.any(String),
						path: ["deleteActionItem"],
					}),
				);
			});

			test("client sends invalid input arguments.", async () => {
				const signInResult = await mercuriusClient.query(Query_signIn, {
					variables: {
						input: {
							emailAddress:
								server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
							password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
						},
					},
				});

				assertToBeNonNullish(signInResult.data.signIn?.authenticationToken);

				const result = await mercuriusClient.mutate(
					DELETE_ACTION_ITEM_MUTATION,
					{
						headers: {
							authorization: `bearer ${signInResult.data.signIn.authenticationToken}`,
						},
						variables: {
							input: {
								id: "invalid-uuid-format",
							},
						},
					},
				);

				const data =
					result.data === null ? { deleteActionItem: null } : result.data;

				expect(data.deleteActionItem).toEqual(null);
				expect(result.errors?.[0]).toEqual(
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "invalid_arguments",
						}),
					}),
				);
			});

			test("deletion fails at database level and returns 'unexpected' error.", async () => {
				const signInResult = await mercuriusClient.query(Query_signIn, {
					variables: {
						input: {
							emailAddress:
								server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
							password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
						},
					},
				});

				assertToBeNonNullish(signInResult.data.signIn?.authenticationToken);

				const result = await mercuriusClient.mutate(
					DELETE_ACTION_ITEM_MUTATION,
					{
						headers: {
							authorization: `bearer ${signInResult.data.signIn.authenticationToken}`,
						},
						variables: {
							input: {
								id: faker.string.uuid(),
							},
						},
					},
				);

				const data =
					result.data === null ? { deleteActionItem: null } : result.data;

				expect(data.deleteActionItem).toBeNull();
				expect(result.errors?.[0]).toEqual(
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "arguments_associated_resources_not_found",
						}),
					}),
				);
			});
		},
	);

	test("returns graphql error with 'arguments_associated_resources_not_found' when action item doesn't exist", async () => {
		const signInResult = await mercuriusClient.query(Query_signIn, {
			variables: {
				input: {
					emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
					password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
				},
			},
		});

		assertToBeNonNullish(signInResult.data.signIn?.authenticationToken);

		const result = await mercuriusClient.mutate(DELETE_ACTION_ITEM_MUTATION, {
			headers: {
				authorization: `bearer ${signInResult.data.signIn.authenticationToken}`,
			},
			variables: {
				input: {
					id: faker.string.uuid(),
				},
			},
		});

		const data =
			result.data === null ? { deleteActionItem: null } : result.data;

		expect(data.deleteActionItem).toEqual(null);
		expect(result.errors?.[0]).toEqual(
			expect.objectContaining({
				extensions: expect.objectContaining({
					code: "arguments_associated_resources_not_found",
				}),
			}),
		);
	});
});
