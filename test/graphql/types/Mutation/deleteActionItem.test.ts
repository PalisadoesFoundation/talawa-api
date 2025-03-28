import { faker } from "@faker-js/faker";
import { expect, suite, test } from "vitest";
import type {
	TalawaGraphQLFormattedError,
	UnauthenticatedExtensions,
} from "~/src/utilities/TalawaGraphQLError";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import { Mutation_createUser, Query_signIn } from "../documentNodes";
import { DELETE_ACTION_ITEM_MUTATION } from "../documentNodes";

suite("Mutation field deleteActionItem", () => {
	suite(
		`results in a graphql error with "unauthenticated" extensions code in the "errors" field and "null" as the value of "data.deleteActionItem" field if`,
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

				expect(deleteActionItemResult.data.deleteActionItem).toEqual(null);
				expect(deleteActionItemResult.errors).toEqual(
					expect.arrayContaining<TalawaGraphQLFormattedError>([
						expect.objectContaining<TalawaGraphQLFormattedError>({
							extensions: expect.objectContaining<UnauthenticatedExtensions>({
								code: "unauthenticated",
							}),
							message: expect.any(String),
							path: ["deleteActionItem"],
						}),
					]),
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

				expect(deleteActionItemResult.data.deleteActionItem).toEqual(null);
				expect(deleteActionItemResult.errors).toEqual(
					expect.arrayContaining<TalawaGraphQLFormattedError>([
						expect.objectContaining<TalawaGraphQLFormattedError>({
							extensions: expect.objectContaining<UnauthenticatedExtensions>({
								code: "unauthenticated",
							}),
							message: expect.any(String),
							path: ["deleteActionItem"],
						}),
					]),
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

				expect(result.data.deleteActionItem).toEqual(null);
				expect(result.errors?.[0]?.extensions?.code).toBe("invalid_arguments");
				const issues = result.errors?.[0]?.extensions?.issues;

				if (Array.isArray(issues) && "argumentPath" in issues[0]) {
					expect(
						(issues[0] as { argumentPath: string[] }).argumentPath,
					).toEqual(["input", "id"]);
				} else {
					throw new Error(
						"issues array or argumentPath not found in error response",
					);
				}
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

				// Trigger delete with valid UUID that will not match anything
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

				expect(result.data.deleteActionItem).toBeNull();
				expect(result.errors?.[0]?.extensions?.code).toBe(
					"arguments_associated_resources_not_found",
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

		expect(result.data.deleteActionItem).toEqual(null);
		expect(result.errors?.[0]?.extensions?.code).toBe(
			"arguments_associated_resources_not_found",
		);
	});
});
