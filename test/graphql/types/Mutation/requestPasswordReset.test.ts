import { faker } from "@faker-js/faker";
import { assertToBeNonNullish } from "test/helpers";
import { afterAll, beforeAll, expect, suite, test } from "vitest";
import type {
	ForbiddenActionExtensions,
	TalawaGraphQLFormattedError,
} from "~/src/utilities/TalawaGraphQLError";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	Mutation_createUser,
	Mutation_deleteUser,
	Mutation_requestPasswordReset,
	Query_signIn,
} from "../documentNodes";

suite("Mutation field requestPasswordReset", () => {
	let adminAuth = "";
	let testUserEmail = "";
	let testUserId = "";

	beforeAll(async () => {
		// Sign in as admin
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
		adminAuth = administratorUserSignInResult.data.signIn.authenticationToken;

		// Create a test user
		testUserEmail = `passwordreset${faker.string.ulid()}@email.com`;
		const createUserResult = await mercuriusClient.mutate(Mutation_createUser, {
			headers: {
				authorization: `bearer ${adminAuth}`,
			},
			variables: {
				input: {
					emailAddress: testUserEmail,
					isEmailAddressVerified: false,
					name: "Password Reset Test User",
					password: "testpassword123",
					role: "regular",
				},
			},
		});

		assertToBeNonNullish(createUserResult.data.createUser?.user?.id);
		testUserId = createUserResult.data.createUser.user.id;
	});

	afterAll(async () => {
		// Clean up test user
		await mercuriusClient.mutate(Mutation_deleteUser, {
			headers: {
				authorization: `bearer ${adminAuth}`,
			},
			variables: {
				input: {
					id: testUserId,
				},
			},
		});
	});

	suite(
		"results in a graphql error with forbidden_action extensions code if",
		() => {
			test("client is already authenticated", async () => {
				const result = await mercuriusClient.mutate(
					Mutation_requestPasswordReset,
					{
						headers: {
							authorization: `bearer ${adminAuth}`,
						},
						variables: {
							input: {
								emailAddress: testUserEmail,
							},
						},
					},
				);

				expect(result.data.requestPasswordReset).toEqual(null);
				expect(result.errors).toEqual(
					expect.arrayContaining<TalawaGraphQLFormattedError>([
						expect.objectContaining<TalawaGraphQLFormattedError>({
							extensions: expect.objectContaining<ForbiddenActionExtensions>({
								code: "forbidden_action",
							}),
							message: expect.any(String),
							path: ["requestPasswordReset"],
						}),
					]),
				);
			});
		},
	);

	suite("returns success response", () => {
		test("when email exists", async () => {
			const result = await mercuriusClient.mutate(
				Mutation_requestPasswordReset,
				{
					variables: {
						input: {
							emailAddress: testUserEmail,
						},
					},
				},
			);

			expect(result.errors).toBeUndefined();
			expect(result.data.requestPasswordReset).toEqual({
				success: true,
				message:
					"If an account with this email exists, a password reset link has been sent.",
			});
		});

		test("when email does not exist (prevents user enumeration)", async () => {
			const nonExistentEmail = `nonexistent${faker.string.ulid()}@email.com`;

			const result = await mercuriusClient.mutate(
				Mutation_requestPasswordReset,
				{
					variables: {
						input: {
							emailAddress: nonExistentEmail,
						},
					},
				},
			);

			// Should return the same response to prevent email enumeration
			expect(result.errors).toBeUndefined();
			expect(result.data.requestPasswordReset).toEqual({
				success: true,
				message:
					"If an account with this email exists, a password reset link has been sent.",
			});
		});
	});
});
