import { faker } from "@faker-js/faker";
import { assertToBeNonNullish } from "test/helpers";
import { getAdminAuthViaRest } from "test/helpers/adminAuthRest";
import { afterAll, beforeAll, expect, suite, test } from "vitest";
import type { TalawaGraphQLFormattedError } from "~/src/utilities/TalawaGraphQLError";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	Mutation_createOrganization,
	Mutation_createOrganizationMembership,
	Mutation_createUser,
	Mutation_deleteOrganization,
	Mutation_deleteOrganizationMembership,
	Mutation_deleteUser,
	Query_signIn,
} from "../documentNodes";

suite("Query field signIn", () => {
	let user1Email = "";
	let adminAuth = "";
	let orgId = "";
	let originalRecaptchaSecret: string | undefined;

	beforeAll(async () => {
		originalRecaptchaSecret = server.envConfig.RECAPTCHA_SECRET_KEY;
		server.envConfig.RECAPTCHA_SECRET_KEY = undefined;

		const { accessToken } = await getAdminAuthViaRest(server);
		adminAuth = accessToken;
		user1Email = `email${faker.string.ulid()}@email.com`;

		const createUserResult = await mercuriusClient.mutate(Mutation_createUser, {
			headers: { authorization: `bearer ${adminAuth}` },
			variables: {
				input: {
					emailAddress: user1Email,
					isEmailAddressVerified: false,
					name: "name",
					password: "password",
					role: "regular",
				},
			},
		});

		assertToBeNonNullish(createUserResult.data.createUser?.user?.id);

		const orgResult = await mercuriusClient.mutate(
			Mutation_createOrganization,
			{
				headers: { authorization: `bearer ${adminAuth}` },
				variables: {
					input: {
						countryCode: "us",
						name: `Test Organization ${faker.string.alphanumeric(8)}`,
					},
				},
			},
		);
		assertToBeNonNullish(orgResult.data?.createOrganization);
		orgId = orgResult.data.createOrganization.id;

		const orgMembership = await mercuriusClient.mutate(
			Mutation_createOrganizationMembership,
			{
				headers: { authorization: `bearer ${adminAuth}` },
				variables: {
					input: {
						memberId: createUserResult.data.createUser?.user?.id,
						organizationId: orgResult.data.createOrganization.id,
						role: "administrator",
					},
				},
			},
		);
		assertToBeNonNullish(orgMembership.data?.createOrganizationMembership);
	});

	afterAll(async () => {
		server.envConfig.RECAPTCHA_SECRET_KEY = originalRecaptchaSecret;

		await mercuriusClient.mutate(Mutation_deleteUser, {
			headers: { authorization: `bearer ${adminAuth}` },
			variables: { input: { id: user1Email } },
		});
		await mercuriusClient.mutate(Mutation_deleteOrganizationMembership, {
			headers: { authorization: `bearer ${adminAuth}` },
			variables: { input: { organizationId: orgId, memberId: user1Email } },
		});
		await mercuriusClient.mutate(Mutation_deleteOrganization, {
			headers: { authorization: `bearer ${adminAuth}` },
			variables: { input: { id: orgId } },
		});
	});

	suite("deprecation", () => {
		test("returns GraphQL error with code deprecated and message directing to REST when signIn query is called", async () => {
			const result = await mercuriusClient.query(Query_signIn, {
				variables: {
					input: {
						emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
						password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
					},
				},
			});

			expect(result.data.signIn).toEqual(null);
			expect(result.errors).toEqual(
				expect.arrayContaining<TalawaGraphQLFormattedError>([
					expect.objectContaining<TalawaGraphQLFormattedError>({
						extensions: expect.objectContaining({
							code: "deprecated",
						}),
						message: expect.stringContaining("Use REST POST /auth/signin"),
						path: ["signIn"],
					}),
				]),
			);
		});
	});
});
