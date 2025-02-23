import { faker } from "@faker-js/faker";
import { expect, suite, test } from "vitest";
import type {
	ArgumentsAssociatedResourcesNotFoundExtensions,
	InvalidArgumentsExtensions,
	TalawaGraphQLFormattedError,
} from "~/src/utilities/TalawaGraphQLError";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	Mutation_createUser,
	Mutation_deleteUser,
	Query_signIn,
	Query_user,
	Query_users,
} from "../documentNodes";

suite("Query field user", () => {
	suite(
		`results in a graphql error with "invalid_arguments" extensions code in the "errors" field and "null" as the value of "data.user" field if`,
		() => {
			test(`value of the argument "input.id" is not a valid user global id.`, async () => {
				const userResult = await mercuriusClient.query(Query_user, {
					variables: {
						input: {
							id: "an invalid user global id",
						},
					},
				});

				expect(userResult.data.user).toEqual(null);
				expect(userResult.errors).toEqual(
					expect.arrayContaining<TalawaGraphQLFormattedError>([
						expect.objectContaining<TalawaGraphQLFormattedError>({
							extensions: expect.objectContaining<InvalidArgumentsExtensions>({
								code: "invalid_arguments",
								issues: expect.arrayContaining<
									InvalidArgumentsExtensions["issues"][number]
								>([
									{
										argumentPath: ["input", "id"],
										message: expect.any(String),
									},
								]),
							}),
							message: expect.any(String),
							path: ["user"],
						}),
					]),
				);
			});
		},
	);

	suite(
		`results in a graphql error with "arguments_associated_resources_not_found" extensions code in the "errors" field and "null" as the value of "data.user" field if`,
		() => {
			test(`value of the argument "input.id" doesn't correspond to an existing user.`, async () => {
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

				const createUserResult = await mercuriusClient.mutate(
					Mutation_createUser,
					{
						headers: {
							authorization: `bearer ${administratorUserSignInResult.data.signIn.authenticationToken}`,
						},
						variables: {
							input: {
								emailAddress: `email${faker.string.ulid()}@email.com`,
								isEmailAddressVerified: false,
								name: "name",
								password: "password",
								role: "regular",
							},
						},
					},
				);

				assertToBeNonNullish(createUserResult.data.createUser?.user?.id);

				await mercuriusClient.mutate(Mutation_deleteUser, {
					headers: {
						authorization: `bearer ${administratorUserSignInResult.data.signIn.authenticationToken}`,
					},
					variables: {
						input: {
							id: createUserResult.data.createUser.user.id,
						},
					},
				});

				assertToBeNonNullish(
					createUserResult.data.createUser.authenticationToken,
				);

				const userResult = await mercuriusClient.query(Query_user, {
					variables: {
						input: {
							id: createUserResult.data.createUser.user.id,
						},
					},
				});

				expect(userResult.data.user).toEqual(null);
				expect(userResult.errors).toEqual(
					expect.arrayContaining<TalawaGraphQLFormattedError>([
						expect.objectContaining<TalawaGraphQLFormattedError>({
							extensions:
								expect.objectContaining<ArgumentsAssociatedResourcesNotFoundExtensions>(
									{
										code: "arguments_associated_resources_not_found",
										issues: expect.arrayContaining<
											ArgumentsAssociatedResourcesNotFoundExtensions["issues"][number]
										>([
											{
												argumentPath: ["input", "id"],
											},
										]),
									},
								),
							message: expect.any(String),
							path: ["user"],
						}),
					]),
				);
			});
		},
	);

	test(`results in an empty "errors" field and the expected value for the "data.user" field.`, async () => {
		const administratorUserSignInResult = await mercuriusClient.query(
			Query_signIn,
			{
				variables: {
					input: {
						emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
						password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
					},
				},
			},
		);

		assertToBeNonNullish(
			administratorUserSignInResult.data.signIn?.authenticationToken,
		);

		assertToBeNonNullish(administratorUserSignInResult.data.signIn?.user?.id);

		const userResult = await mercuriusClient.query(Query_user, {
			headers: {
				authorization: `bearer ${administratorUserSignInResult.data.signIn.authenticationToken}`,
			},
			variables: {
				input: {
					id: administratorUserSignInResult.data.signIn.user.id,
				},
			},
		});

		expect(userResult.errors).toBeUndefined();
		expect(userResult.data.user).toEqual(
			administratorUserSignInResult.data.signIn.user,
		);
	});
});

suite("Query field users", () => {
	test("returns an array of users when users exist", async () => {
		const adminSignIn = await mercuriusClient.query(Query_signIn, {
			variables: {
				input: {
					emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
					password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
				},
			},
		});

		assertToBeNonNullish(adminSignIn.data.signIn?.authenticationToken);

		const usersResult = await mercuriusClient.query(Query_users, {
			headers: {
				authorization: `bearer ${adminSignIn.data.signIn.authenticationToken}`,
			},
		});

		expect(usersResult.errors).toBeUndefined();
		expect(Array.isArray(usersResult.data.users)).toBeTruthy();
		expect(usersResult.data.users.length).toBeGreaterThan(0);
	});

	suite(
		"results in a graphql error with 'invalid_arguments' extensions code in the 'errors' field if",
		() => {
			test("pagination arguments are invalid", async () => {
				const adminSignIn = await mercuriusClient.query(Query_signIn, {
					variables: {
						input: {
							emailAddress:
								server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
							password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
						},
					},
				});

				assertToBeNonNullish(adminSignIn.data.signIn?.authenticationToken);

				const usersResult = await mercuriusClient.query(Query_users, {
					variables: {
						input: {
							limit: -1, // Invalid limit
						},
					},
					headers: {
						authorization: `bearer ${adminSignIn.data.signIn.authenticationToken}`,
					},
				});

				expect(usersResult.data.users).toEqual(null);
				expect(usersResult.errors).toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							extensions: expect.objectContaining({
								code: "invalid_arguments",
								issues: expect.arrayContaining([
									{
										argumentPath: ["input", "limit"],
										message: expect.any(String),
									},
								]),
							}),
							message: expect.any(String),
							path: ["users"],
						}),
					]),
				);
			});
		},
	);
});
