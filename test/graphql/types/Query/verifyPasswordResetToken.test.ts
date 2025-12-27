import { faker } from "@faker-js/faker";
import { sql } from "drizzle-orm";
import { assertToBeNonNullish } from "test/helpers";
import { afterAll, beforeAll, expect, suite, test } from "vitest";
import { hashPasswordResetToken } from "~/src/utilities/passwordResetTokenUtils";
import type {
	ForbiddenActionExtensions,
	InvalidArgumentsExtensions,
	TalawaGraphQLFormattedError,
} from "~/src/utilities/TalawaGraphQLError";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	Mutation_createUser,
	Mutation_deleteUser,
	Query_signIn,
	Query_verifyPasswordResetToken,
} from "../documentNodes";

suite("Query field verifyPasswordResetToken", () => {
	let adminAuth = "";
	let testUserId = "";
	let validTokenHash = "";
	const validRawToken = faker.string.hexadecimal({ length: 64 }).slice(2); // 64 char hex

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
		const testUserEmail = `verifytoken${faker.string.ulid()}@email.com`;
		const createUserResult = await mercuriusClient.mutate(Mutation_createUser, {
			headers: {
				authorization: `bearer ${adminAuth}`,
			},
			variables: {
				input: {
					emailAddress: testUserEmail,
					isEmailAddressVerified: false,
					name: "Verify Token Test User",
					password: "testpassword123",
					role: "regular",
				},
			},
		});

		assertToBeNonNullish(createUserResult.data.createUser?.user?.id);
		testUserId = createUserResult.data.createUser.user.id;

		// Create a valid password reset token directly in database
		validTokenHash = hashPasswordResetToken(validRawToken);
		const expiresAt = new Date(Date.now() + 3600000); // 1 hour from now

		await server.drizzleClient.execute(
			sql`INSERT INTO password_reset_tokens (id, token_hash, user_id, expires_at, created_at)
			VALUES (gen_random_uuid(), ${validTokenHash}, ${testUserId}, ${expiresAt.toISOString()}::timestamptz, NOW())`,
		);
	});

	afterAll(async () => {
		// Clean up tokens for this user
		await server.drizzleClient.execute(
			sql`DELETE FROM password_reset_tokens WHERE user_id = ${testUserId}`,
		);

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
		"results in a graphql error with invalid_arguments extensions code if",
		() => {
			test("token is empty string", async () => {
				const result = await mercuriusClient.query(
					Query_verifyPasswordResetToken,
					{
						variables: {
							input: {
								token: "",
							},
						},
					},
				);

				expect(result.data.verifyPasswordResetToken).toEqual(null);
				expect(result.errors).toEqual(
					expect.arrayContaining<TalawaGraphQLFormattedError>([
						expect.objectContaining<TalawaGraphQLFormattedError>({
							extensions: expect.objectContaining<InvalidArgumentsExtensions>({
								code: "invalid_arguments",
								issues: expect.arrayContaining([
									expect.objectContaining({
										argumentPath: ["input", "token"],
									}),
								]),
							}),
							message: expect.any(String),
							path: ["verifyPasswordResetToken"],
						}),
					]),
				);
			});

			test("token exceeds maximum length", async () => {
				const result = await mercuriusClient.query(
					Query_verifyPasswordResetToken,
					{
						variables: {
							input: {
								token: "a".repeat(129), // Max is 128
							},
						},
					},
				);

				expect(result.data.verifyPasswordResetToken).toEqual(null);
				expect(result.errors).toEqual(
					expect.arrayContaining<TalawaGraphQLFormattedError>([
						expect.objectContaining<TalawaGraphQLFormattedError>({
							extensions: expect.objectContaining<InvalidArgumentsExtensions>({
								code: "invalid_arguments",
								issues: expect.arrayContaining([
									expect.objectContaining({
										argumentPath: ["input", "token"],
									}),
								]),
							}),
							message: expect.any(String),
							path: ["verifyPasswordResetToken"],
						}),
					]),
				);
			});
		},
	);

	suite(
		"results in a graphql error with forbidden_action extensions code if",
		() => {
			test("client is already authenticated", async () => {
				const result = await mercuriusClient.query(
					Query_verifyPasswordResetToken,
					{
						headers: {
							authorization: `bearer ${adminAuth}`,
						},
						variables: {
							input: {
								token: validRawToken,
							},
						},
					},
				);

				expect(result.data.verifyPasswordResetToken).toEqual(null);
				expect(result.errors).toEqual(
					expect.arrayContaining<TalawaGraphQLFormattedError>([
						expect.objectContaining<TalawaGraphQLFormattedError>({
							extensions: expect.objectContaining<ForbiddenActionExtensions>({
								code: "forbidden_action",
							}),
							message: expect.any(String),
							path: ["verifyPasswordResetToken"],
						}),
					]),
				);
			});
		},
	);

	suite("returns valid token response", () => {
		test("when token is valid and not expired", async () => {
			const result = await mercuriusClient.query(
				Query_verifyPasswordResetToken,
				{
					variables: {
						input: {
							token: validRawToken,
						},
					},
				},
			);

			expect(result.errors).toBeUndefined();
			expect(result.data.verifyPasswordResetToken).toEqual({
				valid: true,
				expiresAt: expect.any(String),
			});
		});
	});

	suite("returns invalid token response", () => {
		test("when token does not exist", async () => {
			const nonExistentToken = faker.string
				.hexadecimal({ length: 64 })
				.slice(2);

			const result = await mercuriusClient.query(
				Query_verifyPasswordResetToken,
				{
					variables: {
						input: {
							token: nonExistentToken,
						},
					},
				},
			);

			expect(result.errors).toBeUndefined();
			expect(result.data.verifyPasswordResetToken).toEqual({
				valid: false,
				expiresAt: null,
			});
		});

		test("when token is expired", async () => {
			// Create an expired token
			const expiredToken = faker.string.hexadecimal({ length: 64 }).slice(2);
			const expiredTokenHash = hashPasswordResetToken(expiredToken);
			const expiredAt = new Date(Date.now() - 3600000); // 1 hour ago

			await server.drizzleClient.execute(
				sql`INSERT INTO password_reset_tokens (id, token_hash, user_id, expires_at, created_at)
				VALUES (gen_random_uuid(), ${expiredTokenHash}, ${testUserId}, ${expiredAt.toISOString()}::timestamptz, NOW())`,
			);

			const result = await mercuriusClient.query(
				Query_verifyPasswordResetToken,
				{
					variables: {
						input: {
							token: expiredToken,
						},
					},
				},
			);

			expect(result.errors).toBeUndefined();
			expect(result.data.verifyPasswordResetToken).toEqual({
				valid: false,
				expiresAt: null,
			});
		});

		test("when token is already used", async () => {
			// Create a used token
			const usedToken = faker.string.hexadecimal({ length: 64 }).slice(2);
			const usedTokenHash = hashPasswordResetToken(usedToken);
			const expiresAt = new Date(Date.now() + 3600000); // 1 hour from now
			const usedAt = new Date(); // now

			await server.drizzleClient.execute(
				sql`INSERT INTO password_reset_tokens (id, token_hash, user_id, expires_at, used_at, created_at)
				VALUES (gen_random_uuid(), ${usedTokenHash}, ${testUserId}, ${expiresAt.toISOString()}::timestamptz, ${usedAt.toISOString()}::timestamptz, NOW())`,
			);

			const result = await mercuriusClient.query(
				Query_verifyPasswordResetToken,
				{
					variables: {
						input: {
							token: usedToken,
						},
					},
				},
			);

			expect(result.errors).toBeUndefined();
			expect(result.data.verifyPasswordResetToken).toEqual({
				valid: false,
				expiresAt: null,
			});
		});
	});
});
