import { faker } from "@faker-js/faker";
import { sql } from "drizzle-orm";
import { assertToBeNonNullish } from "test/helpers";
import {
	afterAll,
	afterEach,
	beforeAll,
	expect,
	suite,
	test,
	vi,
} from "vitest";
import { COOKIE_NAMES } from "~/src/utilities/cookieConfig";
import { hashPasswordResetToken } from "~/src/utilities/passwordResetTokenUtils";
import type {
	ForbiddenActionExtensions,
	InvalidArgumentsExtensions,
	TalawaGraphQLFormattedError,
} from "~/src/utilities/TalawaGraphQLError";
import { getAdminAuthViaRest } from "../../../helpers/adminAuthRest";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	Mutation_createUser,
	Mutation_deleteUser,
	Mutation_resetPassword,
} from "../documentNodes";

suite("Mutation field resetPassword", () => {
	let adminAuth = "";
	let testUserId = "";
	let testUserEmail = "";
	let validTokenHash = "";
	const validRawToken = faker.string.hexadecimal({ length: 64 }).slice(2);

	beforeAll(async () => {
		const { accessToken } = await getAdminAuthViaRest(server);
		assertToBeNonNullish(accessToken);
		adminAuth = accessToken;

		// Create a test user
		testUserEmail = `resetpw${faker.string.ulid()}@email.com`;
		const createUserResult = await mercuriusClient.mutate(Mutation_createUser, {
			headers: {
				authorization: `bearer ${adminAuth}`,
			},
			variables: {
				input: {
					emailAddress: testUserEmail,
					isEmailAddressVerified: false,
					name: "Reset Password Test User",
					password: "oldpassword123",
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
		"results in a graphql error with forbidden_action extensions code if",
		() => {
			test("client is already authenticated", async () => {
				const result = await mercuriusClient.mutate(Mutation_resetPassword, {
					headers: {
						authorization: `bearer ${adminAuth}`,
					},
					variables: {
						input: {
							token: validRawToken,
							newPassword: "newpassword456",
						},
					},
				});

				expect(result.data.resetPassword).toEqual(null);
				expect(result.errors).toEqual(
					expect.arrayContaining<TalawaGraphQLFormattedError>([
						expect.objectContaining<TalawaGraphQLFormattedError>({
							extensions: expect.objectContaining<ForbiddenActionExtensions>({
								code: "forbidden_action",
							}),
							message: expect.any(String),
							path: ["resetPassword"],
						}),
					]),
				);
			});
		},
	);

	/*
	 * NOTE: Lines 98-103 (unexpected error when user not found) are intentionally uncovered.
	 * The database has a foreign key constraint on password_reset_tokens.user_id -> users.id,
	 * which prevents creating orphan tokens. This defensive check is unreachable in practice.
	 */

	suite(
		"results in a graphql error with invalid_arguments extensions code if",
		() => {
			test("token is invalid", async () => {
				const invalidToken = faker.string.hexadecimal({ length: 64 }).slice(2);

				const result = await mercuriusClient.mutate(Mutation_resetPassword, {
					variables: {
						input: {
							token: invalidToken,
							newPassword: "newpassword456",
						},
					},
				});

				expect(result.data.resetPassword).toEqual(null);
				expect(result.errors).toEqual(
					expect.arrayContaining<TalawaGraphQLFormattedError>([
						expect.objectContaining<TalawaGraphQLFormattedError>({
							extensions: expect.objectContaining<InvalidArgumentsExtensions>({
								code: "invalid_arguments",
								issues: expect.arrayContaining([
									expect.objectContaining({
										argumentPath: ["input", "token"],
										message: "Invalid or expired password reset token.",
									}),
								]),
							}),
							message: expect.any(String),
							path: ["resetPassword"],
						}),
					]),
				);
			});

			test("token is expired", async () => {
				const expiredToken = faker.string.hexadecimal({ length: 64 }).slice(2);
				const expiredTokenHash = hashPasswordResetToken(expiredToken);
				const expiredAt = new Date(Date.now() - 3600000); // 1 hour ago

				await server.drizzleClient.execute(
					sql`INSERT INTO password_reset_tokens (id, token_hash, user_id, expires_at, created_at)
					VALUES (gen_random_uuid(), ${expiredTokenHash}, ${testUserId}, ${expiredAt.toISOString()}::timestamptz, NOW())`,
				);

				const result = await mercuriusClient.mutate(Mutation_resetPassword, {
					variables: {
						input: {
							token: expiredToken,
							newPassword: "newpassword456",
						},
					},
				});

				expect(result.data.resetPassword).toEqual(null);
				expect(result.errors).toEqual(
					expect.arrayContaining<TalawaGraphQLFormattedError>([
						expect.objectContaining<TalawaGraphQLFormattedError>({
							extensions: expect.objectContaining<InvalidArgumentsExtensions>({
								code: "invalid_arguments",
								issues: expect.arrayContaining([
									expect.objectContaining({
										argumentPath: ["input", "token"],
										message: "Invalid or expired password reset token.",
									}),
								]),
							}),
							message: expect.any(String),
							path: ["resetPassword"],
						}),
					]),
				);
			});

			test("token is empty string", async () => {
				const result = await mercuriusClient.mutate(Mutation_resetPassword, {
					variables: {
						input: {
							token: "",
							newPassword: "validPassword123",
						},
					},
				});

				expect(result.data.resetPassword).toEqual(null);
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
							path: ["resetPassword"],
						}),
					]),
				);
			});

			test("token exceeds maximum length", async () => {
				const result = await mercuriusClient.mutate(Mutation_resetPassword, {
					variables: {
						input: {
							token: "a".repeat(129), // Max is 128
							newPassword: "validPassword123",
						},
					},
				});

				expect(result.data.resetPassword).toEqual(null);
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
							path: ["resetPassword"],
						}),
					]),
				);
			});

			test("password is too short", async () => {
				// Create a new token for this test
				const shortPwToken = faker.string.hexadecimal({ length: 64 }).slice(2);
				const shortPwTokenHash = hashPasswordResetToken(shortPwToken);
				const expiresAt = new Date(Date.now() + 3600000);

				await server.drizzleClient.execute(
					sql`INSERT INTO password_reset_tokens (id, token_hash, user_id, expires_at, created_at)
					VALUES (gen_random_uuid(), ${shortPwTokenHash}, ${testUserId}, ${expiresAt.toISOString()}::timestamptz, NOW())`,
				);

				const result = await mercuriusClient.mutate(Mutation_resetPassword, {
					variables: {
						input: {
							token: shortPwToken,
							newPassword: "short", // Less than 8 characters
						},
					},
				});

				expect(result.data.resetPassword).toEqual(null);
				expect(result.errors).toEqual(
					expect.arrayContaining<TalawaGraphQLFormattedError>([
						expect.objectContaining<TalawaGraphQLFormattedError>({
							extensions: expect.objectContaining<InvalidArgumentsExtensions>({
								code: "invalid_arguments",
								issues: expect.arrayContaining([
									expect.objectContaining({
										argumentPath: ["input", "newPassword"],
										message: expect.stringContaining("8"),
									}),
								]),
							}),
							message: expect.any(String),
							path: ["resetPassword"],
						}),
					]),
				);
			});

			test("password exceeds maximum length", async () => {
				// Create a new token for this test
				const longPwToken = faker.string.hexadecimal({ length: 64 }).slice(2);
				const longPwTokenHash = hashPasswordResetToken(longPwToken);
				const expiresAt = new Date(Date.now() + 3600000);

				await server.drizzleClient.execute(
					sql`INSERT INTO password_reset_tokens (id, token_hash, user_id, expires_at, created_at)
					VALUES (gen_random_uuid(), ${longPwTokenHash}, ${testUserId}, ${expiresAt.toISOString()}::timestamptz, NOW())`,
				);

				const result = await mercuriusClient.mutate(Mutation_resetPassword, {
					variables: {
						input: {
							token: longPwToken,
							newPassword: "a".repeat(65), // Max is 64
						},
					},
				});

				expect(result.data.resetPassword).toEqual(null);
				expect(result.errors).toEqual(
					expect.arrayContaining<TalawaGraphQLFormattedError>([
						expect.objectContaining<TalawaGraphQLFormattedError>({
							extensions: expect.objectContaining<InvalidArgumentsExtensions>({
								code: "invalid_arguments",
								issues: expect.arrayContaining([
									expect.objectContaining({
										argumentPath: ["input", "newPassword"],
										message: expect.stringContaining("64"),
									}),
								]),
							}),
							message: expect.any(String),
							path: ["resetPassword"],
						}),
					]),
				);
			});
		},
	);

	suite("successfully resets password", () => {
		test("with valid token and new password", async () => {
			// Create a fresh token for this test
			const freshToken = faker.string.hexadecimal({ length: 64 }).slice(2);
			const freshTokenHash = hashPasswordResetToken(freshToken);
			const expiresAt = new Date(Date.now() + 3600000);

			await server.drizzleClient.execute(
				sql`INSERT INTO password_reset_tokens (id, token_hash, user_id, expires_at, created_at)
				VALUES (gen_random_uuid(), ${freshTokenHash}, ${testUserId}, ${expiresAt.toISOString()}::timestamptz, NOW())`,
			);

			const newPassword = "mynewsecurepassword123";

			const result = await mercuriusClient.mutate(Mutation_resetPassword, {
				variables: {
					input: {
						token: freshToken,
						newPassword,
					},
				},
			});

			expect(result.errors).toBeUndefined();
			expect(result.data.resetPassword).toEqual({
				success: true,
				authenticationToken: expect.any(String),
				refreshToken: expect.any(String),
			});

			// Verify the new password works via REST signin
			const signInRes = await server.inject({
				method: "POST",
				url: "/auth/signin",
				payload: { email: testUserEmail, password: newPassword },
			});
			expect(signInRes.statusCode).toBe(200);
			const accessCookie = signInRes.cookies.find(
				(c: { name: string }) => c.name === COOKIE_NAMES.ACCESS_TOKEN,
			);
			expect(accessCookie?.value).toBeDefined();
		});
	});

	/**
	 * Tests for edge cases that require environment manipulation
	 */
	suite("uses correct refresh token expiry", () => {
		afterEach(() => {
			vi.restoreAllMocks();
		});

		/**
		 * Test: Uses default refresh token expiry when env config is undefined (line 134)
		 */
		test("uses default refresh token expiry when env config is undefined", async () => {
			// Save original value
			const originalValue = server.envConfig.API_REFRESH_TOKEN_EXPIRES_IN;

			// Temporarily set to undefined to trigger fallback
			(
				server.envConfig as Record<string, unknown>
			).API_REFRESH_TOKEN_EXPIRES_IN = undefined;

			try {
				// Create a fresh token for this test
				const tokenForExpiry = faker.string
					.hexadecimal({ length: 64 })
					.slice(2);
				const tokenHashForExpiry = hashPasswordResetToken(tokenForExpiry);
				const expiresAt = new Date(Date.now() + 3600000);

				await server.drizzleClient.execute(
					sql`INSERT INTO password_reset_tokens (id, token_hash, user_id, expires_at, created_at)
					VALUES (gen_random_uuid(), ${tokenHashForExpiry}, ${testUserId}, ${expiresAt.toISOString()}::timestamptz, NOW())`,
				);

				const result = await mercuriusClient.mutate(Mutation_resetPassword, {
					variables: {
						input: {
							token: tokenForExpiry,
							newPassword: "defaultexpirypassword123",
						},
					},
				});

				expect(result.errors).toBeUndefined();
				expect(result.data.resetPassword?.success).toBe(true);
			} finally {
				// Restore original value
				(
					server.envConfig as Record<string, unknown>
				).API_REFRESH_TOKEN_EXPIRES_IN = originalValue;
			}
		});
	});
});
