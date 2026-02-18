import { faker } from "@faker-js/faker";
import { assertToBeNonNullish } from "test/helpers";
import {
	afterAll,
	afterEach,
	beforeAll,
	beforeEach,
	expect,
	suite,
	test,
	vi,
} from "vitest";
import { PASSWORD_RESET_RATE_LIMITS } from "~/src/utilities/passwordResetRateLimit";
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

	beforeEach(() => {
		// Clear rate limit state between tests to ensure isolation
		PASSWORD_RESET_RATE_LIMITS.clear();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	/*
	 * NOTE: Lines 59-68 (Zod invalid_arguments block) are intentionally uncovered.
	 * GraphQL schema validates email format before Zod validation can run,
	 * making this defensive check unreachable via normal GraphQL requests.
	 */

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

	/*
	 * The following tests cover edge cases that require mocking.
	 * We import and spy on the emailService singleton to test failure paths.
	 */
	suite("handles email service failures gracefully", () => {
		/**
		 * Test: Email send returns failure (lines 137-144)
		 * This covers the case where emailService.sendEmail returns { success: false }
		 * The resolver should log the error but still return success to the user
		 * (to prevent email enumeration attacks)
		 */
		test("returns success even when email send fails (logs error)", async () => {
			// Import the emailService singleton to spy on it
			const { emailService } = await import(
				"~/src/services/email/emailServiceInstance"
			);
			const sendEmailSpy = vi
				.spyOn(emailService, "sendEmail")
				.mockResolvedValueOnce({
					id: "test-id",
					success: false,
					error: "Simulated email failure",
				});

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

			// Should still return success (prevents email enumeration)
			expect(result.errors).toBeUndefined();
			expect(result.data.requestPasswordReset).toEqual({
				success: true,
				message:
					"If an account with this email exists, a password reset link has been sent.",
			});

			// Verify sendEmail was called
			expect(sendEmailSpy).toHaveBeenCalledTimes(1);
			sendEmailSpy.mockRestore();
		});

		/**
		 * Test: Email send throws exception (lines 146-156)
		 * This covers the catch block when emailService.sendEmail throws an error
		 * The resolver should catch, log the error, and still return success
		 */
		test("returns success even when email send throws exception (logs error)", async () => {
			const { emailService } = await import(
				"~/src/services/email/emailServiceInstance"
			);
			const sendEmailSpy = vi
				.spyOn(emailService, "sendEmail")
				.mockRejectedValueOnce(new Error("Simulated network error"));

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

			// Should still return success (prevents email enumeration)
			expect(result.errors).toBeUndefined();
			expect(result.data.requestPasswordReset).toEqual({
				success: true,
				message:
					"If an account with this email exists, a password reset link has been sent.",
			});

			expect(sendEmailSpy).toHaveBeenCalledTimes(1);
			sendEmailSpy.mockRestore();
		});

		/**
		 * Test: Email send throws non-Error exception (line 151-153)
		 * This covers the branch where the caught error is not an Error instance
		 */
		test("handles non-Error exceptions gracefully", async () => {
			const { emailService } = await import(
				"~/src/services/email/emailServiceInstance"
			);
			const sendEmailSpy = vi
				.spyOn(emailService, "sendEmail")
				.mockRejectedValueOnce("String error instead of Error object");

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
			expect(result.data.requestPasswordReset?.success).toBe(true);

			sendEmailSpy.mockRestore();
		});
	});

	/**
	 * Test: Admin user token expiry logic (lines 89-94)
	 * Admin users should use API_PASSWORD_RESET_ADMIN_TOKEN_EXPIRES_SECONDS
	 * Regular users should use API_PASSWORD_RESET_USER_TOKEN_EXPIRES_SECONDS
	 * Note: The admin email is server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS
	 */
	suite("uses correct token expiry based on user role", () => {
		test("processes password reset request for admin user", async () => {
			// Request password reset for the admin user to cover admin token expiry path
			const result = await mercuriusClient.mutate(
				Mutation_requestPasswordReset,
				{
					variables: {
						input: {
							emailAddress:
								server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
						},
					},
				},
			);

			// Should return success regardless of user role
			expect(result.errors).toBeUndefined();
			expect(result.data.requestPasswordReset).toEqual({
				success: true,
				message:
					"If an account with this email exists, a password reset link has been sent.",
			});
		});

		/**
		 * Test: Uses default admin token expiry when env config is undefined (line 92)
		 * This temporarily sets the admin expiry config to undefined to hit the fallback
		 */
		test("uses default admin token expiry when env config is undefined", async () => {
			// Save original value
			const originalValue =
				server.envConfig.API_PASSWORD_RESET_ADMIN_TOKEN_EXPIRES_SECONDS;

			// Temporarily set to undefined to trigger fallback (line 92)
			(
				server.envConfig as Record<string, unknown>
			).API_PASSWORD_RESET_ADMIN_TOKEN_EXPIRES_SECONDS = undefined;

			try {
				const result = await mercuriusClient.mutate(
					Mutation_requestPasswordReset,
					{
						variables: {
							input: {
								emailAddress:
									server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
							},
						},
					},
				);

				expect(result.errors).toBeUndefined();
				expect(result.data.requestPasswordReset?.success).toBe(true);
			} finally {
				// Restore original value
				(
					server.envConfig as Record<string, unknown>
				).API_PASSWORD_RESET_ADMIN_TOKEN_EXPIRES_SECONDS = originalValue;
			}
		});

		/**
		 * Test: Uses default user token expiry when env config is undefined (line 94)
		 * This temporarily sets the user expiry config to undefined to hit the fallback
		 */
		test("uses default user token expiry when env config is undefined", async () => {
			// Save original value
			const originalValue =
				server.envConfig.API_PASSWORD_RESET_USER_TOKEN_EXPIRES_SECONDS;

			// Temporarily set to undefined to trigger fallback (line 94)
			(
				server.envConfig as Record<string, unknown>
			).API_PASSWORD_RESET_USER_TOKEN_EXPIRES_SECONDS = undefined;

			try {
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
				expect(result.data.requestPasswordReset?.success).toBe(true);
			} finally {
				// Restore original value
				(
					server.envConfig as Record<string, unknown>
				).API_PASSWORD_RESET_USER_TOKEN_EXPIRES_SECONDS = originalValue;
			}
		});

		/**
		 * Test: Token never expires when expiry is set to 0 (line 99)
		 * This temporarily sets the token expiry to 0 to test the null expiresAt branch
		 */
		test("sets token to never expire when expiry is 0", async () => {
			// Save original value
			const originalValue =
				server.envConfig.API_PASSWORD_RESET_USER_TOKEN_EXPIRES_SECONDS;

			// Set to 0 to trigger the "never expires" branch (line 99)
			(
				server.envConfig as Record<string, unknown>
			).API_PASSWORD_RESET_USER_TOKEN_EXPIRES_SECONDS = 0;

			try {
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
				expect(result.data.requestPasswordReset?.success).toBe(true);
			} finally {
				// Restore original value
				(
					server.envConfig as Record<string, unknown>
				).API_PASSWORD_RESET_USER_TOKEN_EXPIRES_SECONDS = originalValue;
			}
		});
	});

	suite("Rate limiting", () => {
		test("fails when rate limit is exceeded", async () => {
			// Mock the rate limiter to return false
			const passwordResetRateLimit = await import(
				"~/src/utilities/passwordResetRateLimit"
			);
			const rateLimitSpy = vi
				.spyOn(passwordResetRateLimit, "checkPasswordResetRateLimit")
				.mockReturnValue(false);

			const result = await mercuriusClient.mutate(
				Mutation_requestPasswordReset,
				{
					variables: {
						input: {
							emailAddress: "spam@example.com",
						},
					},
				},
			);

			expect(result.data.requestPasswordReset).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining<TalawaGraphQLFormattedError>([
					expect.objectContaining<TalawaGraphQLFormattedError>({
						extensions: expect.objectContaining({
							code: "too_many_requests",
						}),
						message: expect.any(String),
						path: ["requestPasswordReset"],
					}),
				]),
			);

			rateLimitSpy.mockRestore();
		});
	});
});
