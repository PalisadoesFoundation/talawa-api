import { faker } from "@faker-js/faker";
import { expect, suite, test } from "vitest";
import type {
	TalawaGraphQLFormattedError,
	UnauthenticatedExtensions,
	UnauthorizedActionExtensions,
} from "~/src/utilities/TalawaGraphQLError";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	Mutation_createUser,
	Mutation_deleteUser,
	Mutation_updateUser,
	Query_signIn,
	Query_user_updatedAt,
} from "../documentNodes";

suite("User field updatedAt", () => {
	suite(
		`results in a graphql error with "unauthenticated" extensions code in the "errors" field and "null" as the value of "data.user.updatedAt" field if`,
		() => {
			test("client triggering the graphql operation is not authenticated.", async () => {
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
					administratorUserSignInResult.data.signIn?.user?.id,
				);

				const userUpdatedAtResult = await mercuriusClient.query(
					Query_user_updatedAt,
					{
						variables: {
							input: {
								id: administratorUserSignInResult.data.signIn.user.id,
							},
						},
					},
				);

				expect(userUpdatedAtResult.data.user?.updatedAt).toEqual(null);
				expect(userUpdatedAtResult.errors).toEqual(
					expect.arrayContaining<TalawaGraphQLFormattedError>([
						expect.objectContaining<TalawaGraphQLFormattedError>({
							extensions: expect.objectContaining<UnauthenticatedExtensions>({
								code: "unauthenticated",
							}),
							message: expect.any(String),
							path: ["user", "updatedAt"],
						}),
					]),
				);
			});

			test("client triggering the graphql operation has no existing user associated to their authentication context.", async () => {
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
				assertToBeNonNullish(
					administratorUserSignInResult.data.signIn.user?.id,
				);

				const userUpdatedAtResult = await mercuriusClient.query(
					Query_user_updatedAt,
					{
						headers: {
							authorization: `bearer ${createUserResult.data.createUser.authenticationToken}`,
						},
						variables: {
							input: {
								id: administratorUserSignInResult.data.signIn.user.id,
							},
						},
					},
				);

				expect(userUpdatedAtResult.data.user?.updatedAt).toEqual(null);
				expect(userUpdatedAtResult.errors).toEqual(
					expect.arrayContaining<TalawaGraphQLFormattedError>([
						expect.objectContaining<TalawaGraphQLFormattedError>({
							extensions: expect.objectContaining<UnauthenticatedExtensions>({
								code: "unauthenticated",
							}),
							message: expect.any(String),
							path: ["user", "updatedAt"],
						}),
					]),
				);
			});
		},
	);

	suite(
		`results in a graphql error with "unauthorized_action" extensions code in the "errors" field and "null" as the value of "data.user.updatedAt" field if`,
		() => {
			test(`client triggering the graphql operation is not associated to an administrator user.
                user associated to the argument "input.id" is not associated to the authentication context of the client triggering the graphql operation`, async () => {
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

				assertToBeNonNullish(
					createUserResult.data.createUser?.authenticationToken,
				);

				assertToBeNonNullish(
					administratorUserSignInResult.data.signIn.user?.id,
				);

				const userUpdatedAtResult = await mercuriusClient.query(
					Query_user_updatedAt,
					{
						headers: {
							authorization: `bearer ${createUserResult.data.createUser.authenticationToken}`,
						},
						variables: {
							input: {
								id: administratorUserSignInResult.data.signIn.user.id,
							},
						},
					},
				);

				expect(userUpdatedAtResult.data.user?.updatedAt).toEqual(null);
				expect(userUpdatedAtResult.errors).toEqual(
					expect.arrayContaining<TalawaGraphQLFormattedError>([
						expect.objectContaining<TalawaGraphQLFormattedError>({
							extensions: expect.objectContaining<UnauthorizedActionExtensions>(
								{
									code: "unauthorized_action",
								},
							),
							message: expect.any(String),
							path: ["user", "updatedAt"],
						}),
					]),
				);
			});
		},
	);

	suite(
		`results in an empty "errors" field and the expected value for the "data.user.updatedAt" field where`,
		() => {
			test(`"data.user.updatedAt" is "null" when the user has not been updated at least once after its creation.`, async () => {
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
				assertToBeNonNullish(
					administratorUserSignInResult.data.signIn.user?.id,
				);

				const userUpdatedAtResult = await mercuriusClient.mutate(
					Query_user_updatedAt,
					{
						headers: {
							authorization: `bearer ${administratorUserSignInResult.data.signIn.authenticationToken}`,
						},
						variables: {
							input: {
								id: administratorUserSignInResult.data.signIn.user.id,
							},
						},
					},
				);

				expect(userUpdatedAtResult.errors).toBeUndefined();
				expect(userUpdatedAtResult.data.user?.updatedAt).toEqual(null);
			});

			test(`"data.user.updatedAt" is non-null when the user has been updated at least once after its creation.`, async () => {
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

				const updateUserResult = await mercuriusClient.mutate(
					Mutation_updateUser,
					{
						headers: {
							authorization: `bearer ${administratorUserSignInResult.data.signIn.authenticationToken}`,
						},
						variables: {
							input: {
								addressLine1: null,
								id: createUserResult.data.createUser.user.id,
							},
						},
					},
				);

				assertToBeNonNullish(updateUserResult.data.updateUser?.id);

				const userUpdatedAtResult = await mercuriusClient.query(
					Query_user_updatedAt,
					{
						headers: {
							authorization: `bearer ${administratorUserSignInResult.data.signIn.authenticationToken}`,
						},
						variables: {
							input: {
								id: updateUserResult.data.updateUser.id,
							},
						},
					},
				);

				expect(userUpdatedAtResult.errors).toBeUndefined();
				expect(userUpdatedAtResult.data.user?.updatedAt).toBeTypeOf("string");
			});
		},
	);
});
