import { faker } from "@faker-js/faker";
import { assertToBeNonNullish } from "test/helpers";
import { getAdminAuthViaRest } from "test/helpers/adminAuthRest";
import { afterAll, beforeAll, expect, suite, test } from "vitest";
import type { TalawaGraphQLFormattedError } from "~/src/utilities/TalawaGraphQLError";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import { Mutation_signUp, Query_currentUser } from "../documentNodes";

let cachedAdminToken: string | null = null;
let cachedAdminId: string | null = null;

async function getAdminAuthTokenAndId(): Promise<{
	cachedAdminToken: string;
	cachedAdminId: string;
}> {
	if (cachedAdminToken && cachedAdminId) {
		return { cachedAdminToken, cachedAdminId };
	}

	const { accessToken } = await getAdminAuthViaRest(server);
	const currentUserResult = await mercuriusClient.query(Query_currentUser, {
		headers: { authorization: `bearer ${accessToken}` },
	});
	assertToBeNonNullish(currentUserResult.data?.currentUser?.id);
	cachedAdminToken = accessToken;
	cachedAdminId = currentUserResult.data.currentUser.id;
	return {
		cachedAdminToken: accessToken,
		cachedAdminId: currentUserResult.data.currentUser.id,
	};
}

suite("Mutation field signUp", () => {
	let originalRecaptchaSecretKey: string | undefined;
	beforeAll(() => {
		originalRecaptchaSecretKey = server.envConfig.RECAPTCHA_SECRET_KEY;
		server.envConfig.RECAPTCHA_SECRET_KEY = undefined;
	});
	afterAll(() => {
		server.envConfig.RECAPTCHA_SECRET_KEY = originalRecaptchaSecretKey;
		cachedAdminToken = null;
		cachedAdminId = null;
	});

	suite("deprecation", () => {
		test("returns GraphQL error with code deprecated and message directing to REST when signUp mutation is called", async () => {
			const signUpResult = await mercuriusClient.mutate(Mutation_signUp, {
				variables: {
					input: {
						emailAddress: `emailAddress${faker.string.ulid()}@email.com`,
						name: "name",
						password: "password",
						selectedOrganization: "3891785a-1760-48a2-8d72-f5632ad1371b",
					},
				},
			});

			expect(signUpResult.data.signUp).toEqual(null);
			expect(signUpResult.errors).toEqual(
				expect.arrayContaining<TalawaGraphQLFormattedError>([
					expect.objectContaining<TalawaGraphQLFormattedError>({
						extensions: expect.objectContaining({
							code: "deprecated",
						}),
						message: expect.stringContaining("Use REST POST /auth/signup"),
						path: ["signUp"],
					}),
				]),
			);
		});
	});

	suite(
		`results in a graphql error when signUp is called (deprecated; use REST)`,
		() => {
			test("returns deprecated error even when client is already signed in", async () => {
				const { cachedAdminToken: adminToken } = await getAdminAuthTokenAndId();

				const signUpResult = await mercuriusClient.mutate(Mutation_signUp, {
					headers: {
						authorization: `bearer ${adminToken}`,
					},
					variables: {
						input: {
							emailAddress: `emailAddress${faker.string.ulid()}@email.com`,
							name: "name",
							password: "password",
							selectedOrganization: "3891785a-1760-48a2-8d72-f5632ad1371b",
						},
					},
				});

				expect(signUpResult.data.signUp).toEqual(null);
				expect(signUpResult.errors).toEqual(
					expect.arrayContaining<TalawaGraphQLFormattedError>([
						expect.objectContaining<TalawaGraphQLFormattedError>({
							extensions: expect.objectContaining({
								code: "deprecated",
							}),
							message: expect.stringContaining("Use REST POST /auth/signup"),
							path: ["signUp"],
						}),
					]),
				);
			});
		},
	);
});
