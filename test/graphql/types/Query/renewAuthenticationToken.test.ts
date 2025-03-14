import { setTimeout } from "node:timers/promises";
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
	Mutation_createUser,
	Mutation_deleteUser,
	Query_renewAuthenticationToken,
	Query_signIn,
} from "../documentNodes";

suite("Query field renewAuthenticationToken", () => {
	suite(
		`results in a graphql error with "unauthenticated" extensions code in the "errors" field and "null" as the value of "data.renewAuthenticationToken" field if`,
		() => {
			test("client triggering the graphql operation is not authenticated.", async () => {
				const renewAuthenticationTokenResult = await mercuriusClient.query(
					Query_renewAuthenticationToken,
				);

				expect(
					renewAuthenticationTokenResult.data.renewAuthenticationToken,
				).toEqual(null);
				expect(renewAuthenticationTokenResult.errors).toEqual(
					expect.arrayContaining<TalawaGraphQLFormattedError>([
						expect.objectContaining<TalawaGraphQLFormattedError>({
							extensions: expect.objectContaining<UnauthenticatedExtensions>({
								code: "unauthenticated",
							}),
							message: expect.any(String),
							path: ["renewAuthenticationToken"],
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
								emailAddress: `emailAddress${faker.string.ulid()}@email.com`,
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
				assertToBeNonNullish(createUserResult.data.createUser.user?.id);

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

				const renewAuthenticationTokenResult = await mercuriusClient.query(
					Query_renewAuthenticationToken,
					{
						headers: {
							authorization: `bearer ${createUserResult.data.createUser.authenticationToken}`,
						},
					},
				);

				expect(
					renewAuthenticationTokenResult.data.renewAuthenticationToken,
				).toEqual(null);
				expect(renewAuthenticationTokenResult.errors).toEqual(
					expect.arrayContaining<TalawaGraphQLFormattedError>([
						expect.objectContaining<TalawaGraphQLFormattedError>({
							extensions: expect.objectContaining<UnauthenticatedExtensions>({
								code: "unauthenticated",
							}),
							message: expect.any(String),
							path: ["renewAuthenticationToken"],
						}),
					]),
				);
			});
		},
	);

	test(`results in an empty "errors" field and the expected value for the "data.renewAuthenticationToken" field.`, async () => {
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

		// Since the `exp` field of a json web token must be a unix timestamp, at the very least a delay of 1 second is required to introduce a difference in the expiration time of the token for comparision between two or more tokens.
		await setTimeout(1000);

		const renewAuthenticationTokenResult = await mercuriusClient.query(
			Query_renewAuthenticationToken,
			{
				headers: {
					authorization: `bearer ${administratorUserSignInResult.data.signIn.authenticationToken}`,
				},
			},
		);

		expect(renewAuthenticationTokenResult.errors).toBeUndefined();
		expect(
			typeof renewAuthenticationTokenResult.data.renewAuthenticationToken,
		).toEqual("string");
		assertToBeNonNullish(
			renewAuthenticationTokenResult.data.renewAuthenticationToken,
		);

		const olderDecodedAuthenticationToken = server.jwt.decode<{
			exp: number;
		}>(administratorUserSignInResult.data.signIn.authenticationToken);
		const newerDecodedAuthenticationToken = server.jwt.decode<{
			exp: number;
		}>(renewAuthenticationTokenResult.data.renewAuthenticationToken);

		assertToBeNonNullish(olderDecodedAuthenticationToken);
		assertToBeNonNullish(newerDecodedAuthenticationToken);

		expect(newerDecodedAuthenticationToken.exp).toBeGreaterThan(
			olderDecodedAuthenticationToken.exp,
		);
	});
});
