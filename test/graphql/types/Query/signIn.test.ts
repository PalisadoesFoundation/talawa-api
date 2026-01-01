import { faker } from "@faker-js/faker";
import { sql } from "drizzle-orm";
import type { VariablesOf } from "gql.tada";
import { print } from "graphql";
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
import { COOKIE_NAMES } from "~/src/utilities/cookieConfig";
import type {
	AccountLockedExtensions,
	ArgumentsAssociatedResourcesNotFoundExtensions,
	ForbiddenActionExtensions,
	InvalidArgumentsExtensions,
	InvalidCredentialsExtensions,
	TalawaGraphQLFormattedError,
} from "~/src/utilities/TalawaGraphQLError";
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
		// Save original value for restoration
		originalRecaptchaSecret = server.envConfig.RECAPTCHA_SECRET_KEY;

		// make reCaptcha key undefined as they are tested in different test suite
		server.envConfig.RECAPTCHA_SECRET_KEY = undefined;
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
		user1Email = `email${faker.string.ulid()}@email.com`;

		const createUserResult = await mercuriusClient.mutate(Mutation_createUser, {
			headers: {
				authorization: `bearer ${administratorUserSignInResult.data.signIn.authenticationToken}`,
			},
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

		// Create an organization
		const orgResult = await mercuriusClient.mutate(
			Mutation_createOrganization,
			{
				headers: {
					authorization: `bearer ${administratorUserSignInResult.data.signIn.authenticationToken}`,
				},
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
				headers: {
					authorization: `bearer ${administratorUserSignInResult.data.signIn.authenticationToken}`,
				},
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
		// Restore original env config
		server.envConfig.RECAPTCHA_SECRET_KEY = originalRecaptchaSecret;

		await mercuriusClient.mutate(Mutation_deleteUser, {
			headers: {
				authorization: `bearer ${adminAuth}`,
			},
			variables: {
				input: {
					id: user1Email,
				},
			},
		});

		await mercuriusClient.mutate(Mutation_deleteOrganizationMembership, {
			headers: {
				authorization: `bearer ${adminAuth}`,
			},
			variables: {
				input: {
					organizationId: orgId,
					memberId: user1Email,
				},
			},
		});

		await mercuriusClient.mutate(Mutation_deleteOrganization, {
			headers: {
				authorization: `bearer ${adminAuth}`,
			},
			variables: {
				input: {
					id: orgId,
				},
			},
		});
	});

	suite(
		"results in a graphql error with forbidden_action extensions code in the errors field and null as the value of data.signIn field if",
		() => {
			test("client triggering the graphql operation is already signed in.", async () => {
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

				const signInResult = await mercuriusClient.query(Query_signIn, {
					headers: {
						authorization: `bearer ${administratorUserSignInResult.data.signIn?.authenticationToken}`,
					},
					variables: {
						input: {
							emailAddress: `emailAddress${faker.string.ulid()}@email.com`,
							password: "password",
						},
					},
				});

				expect(signInResult.data.signIn).toEqual(null);
				expect(signInResult.errors).toEqual(
					expect.arrayContaining<TalawaGraphQLFormattedError>([
						expect.objectContaining<TalawaGraphQLFormattedError>({
							extensions: expect.objectContaining<ForbiddenActionExtensions>({
								code: "forbidden_action",
							}),
							message: expect.any(String),
							path: ["signIn"],
						}),
					]),
				);
			});
		},
	);

	suite(
		"results in a graphql error with invalid_credentials extensions code in the errors field and null as the value of data.signIn field if",
		() => {
			test("value of the input.emailAddress does not correspond to an existing user.", async () => {
				const result = await mercuriusClient.query(Query_signIn, {
					variables: {
						input: {
							emailAddress: `email${faker.string.ulid()}@email.com`,
							password: `password${faker.string.ulid()}`,
						},
					},
				});

				expect(result.data.signIn).toEqual(null);
				expect(result.errors).toEqual(
					expect.arrayContaining<TalawaGraphQLFormattedError>([
						expect.objectContaining<TalawaGraphQLFormattedError>({
							extensions: expect.objectContaining<InvalidCredentialsExtensions>(
								{
									code: "invalid_credentials",
									issues: expect.arrayContaining<
										InvalidCredentialsExtensions["issues"][number]
									>([
										{
											argumentPath: ["input"],
											message: "Invalid email address or password.",
										},
									]),
								},
							),
							message: expect.any(String),
							path: ["signIn"],
						}),
					]),
				);
			});

			test("value of the argument input.password is not equal to the password of the existing user corresponding to the value of the argument input.emailAddress", async () => {
				const result = await mercuriusClient.query(Query_signIn, {
					variables: {
						input: {
							emailAddress:
								server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
							password: `password${faker.string.ulid()}`,
						},
					},
				});

				expect(result.data.signIn).toEqual(null);
				expect(result.errors).toEqual(
					expect.arrayContaining<TalawaGraphQLFormattedError>([
						expect.objectContaining<TalawaGraphQLFormattedError>({
							extensions: expect.objectContaining<InvalidCredentialsExtensions>(
								{
									code: "invalid_credentials",
									issues: expect.arrayContaining<
										InvalidCredentialsExtensions["issues"][number]
									>([
										{
											argumentPath: ["input"],
											message: "Invalid email address or password.",
										},
									]),
								},
							),
							message: expect.any(String),
							path: ["signIn"],
						}),
					]),
				);
			});
		},
	);

	suite("handles malformed password hash gracefully", () => {
		let malformedHashUserEmail = "";
		let malformedHashUserId = "";
		let adminAuthToken = "";

		beforeAll(async () => {
			// Sign in as admin
			const adminSignIn = await mercuriusClient.query(Query_signIn, {
				variables: {
					input: {
						emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
						password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
					},
				},
			});
			assertToBeNonNullish(adminSignIn.data.signIn?.authenticationToken);
			adminAuthToken = adminSignIn.data.signIn.authenticationToken;

			// Create a user with a valid password first
			malformedHashUserEmail = `malformed${faker.string.ulid()}@email.com`;
			const createUserResult = await mercuriusClient.mutate(
				Mutation_createUser,
				{
					headers: {
						authorization: `bearer ${adminAuthToken}`,
					},
					variables: {
						input: {
							emailAddress: malformedHashUserEmail,
							isEmailAddressVerified: false,
							name: "Malformed Hash User",
							password: "password",
							role: "regular",
						},
					},
				},
			);

			assertToBeNonNullish(createUserResult.data.createUser?.user?.id);
			malformedHashUserId = createUserResult.data.createUser.user.id;

			// Directly update the user's password hash to an invalid value
			// This simulates a corrupted database entry
			await server.drizzleClient.execute(
				sql`UPDATE users SET password_hash = 'invalid_corrupted_hash' WHERE id = ${malformedHashUserId}`,
			);
		});

		afterAll(async () => {
			// Clean up the test user
			await mercuriusClient.mutate(Mutation_deleteUser, {
				headers: {
					authorization: `bearer ${adminAuthToken}`,
				},
				variables: {
					input: {
						id: malformedHashUserId,
					},
				},
			});
		});

		test("returns invalid_credentials when password hash is malformed/corrupted", async () => {
			const result = await mercuriusClient.query(Query_signIn, {
				variables: {
					input: {
						emailAddress: malformedHashUserEmail,
						password: "password",
					},
				},
			});

			expect(result.data.signIn).toEqual(null);
			expect(result.errors).toEqual(
				expect.arrayContaining<TalawaGraphQLFormattedError>([
					expect.objectContaining<TalawaGraphQLFormattedError>({
						extensions: expect.objectContaining<InvalidCredentialsExtensions>({
							code: "invalid_credentials",
							issues: expect.arrayContaining<
								InvalidCredentialsExtensions["issues"][number]
							>([
								{
									argumentPath: ["input"],
									message: "Invalid email address or password.",
								},
							]),
						}),
						message: expect.any(String),
						path: ["signIn"],
					}),
				]),
			);
		});
	});

	test("results in an empty errors field and the expected value for the data.signIn field.", async () => {
		const variables: VariablesOf<typeof Query_signIn> = {
			input: {
				emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
				password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
			},
		};

		const result = await mercuriusClient.query(Query_signIn, {
			variables,
		});

		expect(result.errors).toBeUndefined();
		expect(result.data.signIn).toEqual(
			expect.objectContaining({
				authenticationToken: expect.any(String),
				refreshToken: expect.any(String),
				user: expect.objectContaining({
					emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
				}),
			}),
		);
	});

	test("should set HTTP-Only cookies on successful sign-in", async () => {
		const response = await server.inject({
			method: "POST",
			url: "/graphql",
			payload: {
				query: print(Query_signIn),
				variables: {
					input: {
						emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
						password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
					},
				},
			},
		});

		expect(response.statusCode).toBe(200);

		const cookies = response.cookies;
		expect(cookies).toBeDefined();
		expect(cookies.length).toBeGreaterThanOrEqual(2);

		const accessTokenCookie = cookies.find(
			(c) => c.name === COOKIE_NAMES.ACCESS_TOKEN,
		);
		const refreshTokenCookie = cookies.find(
			(c) => c.name === COOKIE_NAMES.REFRESH_TOKEN,
		);

		expect(accessTokenCookie).toBeDefined();
		expect(accessTokenCookie?.httpOnly).toBe(true);
		expect(accessTokenCookie?.path).toBe("/");
		expect(accessTokenCookie?.sameSite).toBe("Lax");

		expect(refreshTokenCookie).toBeDefined();
		expect(refreshTokenCookie?.httpOnly).toBe(true);
		expect(refreshTokenCookie?.path).toBe("/");
		expect(refreshTokenCookie?.sameSite).toBe("Lax");
	});

	suite("refresh token functionality", () => {
		test("should return a valid refresh token on successful sign in", async () => {
			const result = await mercuriusClient.query(Query_signIn, {
				variables: {
					input: {
						emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
						password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
					},
				},
			});

			expect(result.errors).toBeUndefined();
			assertToBeNonNullish(result.data.signIn?.refreshToken);

			const refreshToken = result.data.signIn?.refreshToken as string;

			// Refresh token should be a 64-character hex string (256-bit)
			expect(refreshToken).toHaveLength(64);
			expect(/^[a-f0-9]+$/.test(refreshToken)).toBe(true);
		});

		test("should return different refresh tokens for each sign in", async () => {
			const result1 = await mercuriusClient.query(Query_signIn, {
				variables: {
					input: {
						emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
						password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
					},
				},
			});

			const result2 = await mercuriusClient.query(Query_signIn, {
				variables: {
					input: {
						emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
						password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
					},
				},
			});

			assertToBeNonNullish(result1.data.signIn?.refreshToken);
			assertToBeNonNullish(result2.data.signIn?.refreshToken);

			// Each sign in should generate a unique refresh token
			expect(result1.data.signIn?.refreshToken).not.toBe(
				result2.data.signIn?.refreshToken,
			);
		});

		test("refresh token should be stored atomically with sign in response", async () => {
			const result = await mercuriusClient.query(Query_signIn, {
				variables: {
					input: {
						emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
						password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
					},
				},
			});

			expect(result.errors).toBeUndefined();
			assertToBeNonNullish(result.data.signIn?.authenticationToken);
			assertToBeNonNullish(result.data.signIn?.refreshToken);

			// Both tokens should be present together (atomic operation)
			expect(result.data.signIn.authenticationToken).toBeDefined();
			expect(result.data.signIn.refreshToken).toBeDefined();
		});
	});

	test("sign in", async () => {
		const result = await mercuriusClient.query(Query_signIn, {
			variables: {
				input: {
					emailAddress: user1Email,
					password: "password",
				},
			},
		});

		assertToBeNonNullish(result.data.signIn?.authenticationToken);
		assertToBeNonNullish(result.data.signIn?.refreshToken);

		expect(result.errors).toBeUndefined();
		expect(result.data.signIn).toEqual(
			expect.objectContaining({
				authenticationToken: expect.any(String),
				refreshToken: expect.any(String),
				user: expect.objectContaining({
					emailAddress: user1Email,
				}),
			}),
		);
	});

	test("sign in upgrades role to administrator when user has admin org membership", async () => {
		// user1Email was granted an organization administrator membership in beforeAll
		const result = await mercuriusClient.query(Query_signIn, {
			variables: {
				input: {
					emailAddress: user1Email,
					password: "password",
				},
			},
		});

		expect(result.errors).toBeUndefined();
		expect(result.data.signIn?.user?.role).toBe("administrator");
	});

	test("sign in as regular user without organization admin membership", async () => {
		// Create a regular user WITHOUT making them an org admin
		const regularUserEmail = `regular${faker.string.ulid()}@email.com`;

		const createResult = await mercuriusClient.mutate(Mutation_createUser, {
			headers: {
				authorization: `bearer ${adminAuth}`,
			},
			variables: {
				input: {
					emailAddress: regularUserEmail,
					isEmailAddressVerified: false,
					name: "Regular User",
					password: "password",
					role: "regular",
				},
			},
		});

		assertToBeNonNullish(createResult.data.createUser?.user?.id);

		// Sign in without creating any org memberships
		const result = await mercuriusClient.query(Query_signIn, {
			variables: {
				input: {
					emailAddress: regularUserEmail,
					password: "password",
				},
			},
		});

		expect(result.errors).toBeUndefined();
		expect(result.data.signIn).toEqual(
			expect.objectContaining({
				authenticationToken: expect.any(String),
				user: expect.objectContaining({
					emailAddress: regularUserEmail,
					role: "regular", // Should remain regular, not upgraded to administrator
				}),
			}),
		);

		// Cleanup
		await mercuriusClient.mutate(Mutation_deleteUser, {
			headers: { authorization: `bearer ${adminAuth}` },
			variables: { input: { id: createResult.data.createUser?.user?.id } },
		});
	});

	test("sign in with invalid arguments", async () => {
		const result = await mercuriusClient.query(Query_signIn, {
			variables: {
				input: {
					emailAddress: user1Email,
					password: "",
				},
			},
		});

		expect(result.errors).toEqual(
			expect.arrayContaining<TalawaGraphQLFormattedError>([
				expect.objectContaining<TalawaGraphQLFormattedError>({
					extensions: expect.objectContaining<InvalidArgumentsExtensions>({
						code: "invalid_arguments",
						issues: expect.arrayContaining<
							ArgumentsAssociatedResourcesNotFoundExtensions["issues"][number]
						>([
							expect.objectContaining({
								argumentPath: ["input", "password"],
								message: "String must contain at least 1 character(s)",
							}),
						]),
					}),
					message: "You have provided invalid arguments for this action.",
					path: ["signIn"],
				}),
			]),
		);
	});

	suite("account lockout functionality", () => {
		let lockoutTestUserEmail = "";
		let lockoutTestUserId = "";
		let lockoutAdminAuth = "";

		beforeAll(async () => {
			// Sign in as admin
			const adminSignIn = await mercuriusClient.query(Query_signIn, {
				variables: {
					input: {
						emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
						password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
					},
				},
			});
			assertToBeNonNullish(adminSignIn.data.signIn?.authenticationToken);
			lockoutAdminAuth = adminSignIn.data.signIn.authenticationToken;

			// Create a test user for lockout tests
			lockoutTestUserEmail = `lockout${faker.string.ulid()}@email.com`;
			const createUserResult = await mercuriusClient.mutate(
				Mutation_createUser,
				{
					headers: {
						authorization: `bearer ${lockoutAdminAuth}`,
					},
					variables: {
						input: {
							emailAddress: lockoutTestUserEmail,
							isEmailAddressVerified: false,
							name: "Lockout Test User",
							password: "correctpassword",
							role: "regular",
						},
					},
				},
			);

			assertToBeNonNullish(createUserResult.data.createUser?.user?.id);
			lockoutTestUserId = createUserResult.data.createUser.user.id;
		});

		afterAll(async () => {
			// Reset lockout state and clean up the test user
			await server.drizzleClient.execute(
				sql`UPDATE users SET failed_login_attempts = 0, locked_until = NULL, last_failed_login_at = NULL WHERE id = ${lockoutTestUserId}`,
			);

			await mercuriusClient.mutate(Mutation_deleteUser, {
				headers: {
					authorization: `bearer ${lockoutAdminAuth}`,
				},
				variables: {
					input: {
						id: lockoutTestUserId,
					},
				},
			});
		});

		test("should increment failed login attempts on wrong password", async () => {
			// Reset state before test
			await server.drizzleClient.execute(
				sql`UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE id = ${lockoutTestUserId}`,
			);

			// First failed attempt
			await mercuriusClient.query(Query_signIn, {
				variables: {
					input: {
						emailAddress: lockoutTestUserEmail,
						password: "wrongpassword1",
					},
				},
			});

			// Check that failed attempts incremented
			const userAfterAttempt = await server.drizzleClient.execute(
				sql`SELECT failed_login_attempts FROM users WHERE id = ${lockoutTestUserId}`,
			);
			expect(
				(userAfterAttempt[0] as Record<string, unknown>)?.failed_login_attempts,
			).toBe(1);
		});

		test("failed login sets lastFailedLoginAt timestamp", async () => {
			// Reset before test
			await server.drizzleClient.execute(
				sql`UPDATE users SET failed_login_attempts = 0, last_failed_login_at = NULL, locked_until = NULL WHERE id = ${lockoutTestUserId}`,
			);

			// Cause one failed attempt
			await mercuriusClient.query(Query_signIn, {
				variables: {
					input: {
						emailAddress: lockoutTestUserEmail,
						password: "wrongpassword",
					},
				},
			});

			// Verify timestamp set
			const row = await server.drizzleClient.execute(
				sql`SELECT last_failed_login_at FROM users WHERE id = ${lockoutTestUserId}`,
			);
			const ts = (row[0] as Record<string, unknown>)?.last_failed_login_at;
			expect(ts).not.toBeNull();
		});

		test("should lock account after exceeding threshold (default 5)", async () => {
			// Reset state before test
			await server.drizzleClient.execute(
				sql`UPDATE users SET failed_login_attempts = 4, locked_until = NULL WHERE id = ${lockoutTestUserId}`,
			);

			// This should be the 5th failed attempt, triggering lockout
			const result = await mercuriusClient.query(Query_signIn, {
				variables: {
					input: {
						emailAddress: lockoutTestUserEmail,
						password: "wrongpassword",
					},
				},
			});

			// Should get invalid_credentials (not account_locked yet, lock happens after error)
			expect(result.data.signIn).toEqual(null);
			expect(result.errors).toEqual(
				expect.arrayContaining<TalawaGraphQLFormattedError>([
					expect.objectContaining<TalawaGraphQLFormattedError>({
						extensions: expect.objectContaining<InvalidCredentialsExtensions>({
							code: "invalid_credentials",
							issues: expect.any(Array),
						}),
						message: expect.any(String),
						path: ["signIn"],
					}),
				]),
			);

			// Verify account is now locked
			const userAfterLockout = await server.drizzleClient.execute(
				sql`SELECT failed_login_attempts, locked_until FROM users WHERE id = ${lockoutTestUserId}`,
			);
			const lockoutRow = userAfterLockout[0] as Record<string, unknown>;
			expect(lockoutRow?.failed_login_attempts).toBe(5);
			expect(lockoutRow?.locked_until).not.toBeNull();
		});

		test("should return account_locked error when account is locked", async () => {
			// Lock the account with a future timestamp
			const futureDate = new Date(Date.now() + 900000).toISOString(); // 15 minutes from now
			await server.drizzleClient.execute(
				sql`UPDATE users SET failed_login_attempts = 5, locked_until = ${futureDate}::timestamptz WHERE id = ${lockoutTestUserId}`,
			);

			const result = await mercuriusClient.query(Query_signIn, {
				variables: {
					input: {
						emailAddress: lockoutTestUserEmail,
						password: "correctpassword", // Even correct password should fail
					},
				},
			});

			expect(result.data.signIn).toEqual(null);
			expect(result.errors).toEqual(
				expect.arrayContaining<TalawaGraphQLFormattedError>([
					expect.objectContaining<TalawaGraphQLFormattedError>({
						extensions: expect.objectContaining<AccountLockedExtensions>({
							code: "account_locked",
							retryAfter: expect.any(String),
						}),
						message: expect.any(String),
						path: ["signIn"],
					}),
				]),
			);
		});

		test("locked account returns account_locked even with wrong password", async () => {
			// Lock the account with a future timestamp
			const futureDate = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 minutes from now
			await server.drizzleClient.execute(
				sql`UPDATE users SET failed_login_attempts = 5, locked_until = ${futureDate}::timestamptz WHERE id = ${lockoutTestUserId}`,
			);

			// Try with wrong password - should still get account_locked, not invalid_credentials
			const result = await mercuriusClient.query(Query_signIn, {
				variables: {
					input: {
						emailAddress: lockoutTestUserEmail,
						password: "nottherightpassword",
					},
				},
			});

			expect(result.data.signIn).toEqual(null);
			expect(result.errors).toEqual(
				expect.arrayContaining<TalawaGraphQLFormattedError>([
					expect.objectContaining<TalawaGraphQLFormattedError>({
						extensions: expect.objectContaining<AccountLockedExtensions>({
							code: "account_locked",
							retryAfter: expect.any(String),
						}),
						message: expect.any(String),
						path: ["signIn"],
					}),
				]),
			);
		});

		test("should allow login after lockout period expires", async () => {
			// Set lockout to a past timestamp (expired)
			const pastDate = new Date(Date.now() - 1000).toISOString(); // 1 second ago
			await server.drizzleClient.execute(
				sql`UPDATE users SET failed_login_attempts = 5, locked_until = ${pastDate}::timestamptz WHERE id = ${lockoutTestUserId}`,
			);

			const result = await mercuriusClient.query(Query_signIn, {
				variables: {
					input: {
						emailAddress: lockoutTestUserEmail,
						password: "correctpassword",
					},
				},
			});

			expect(result.errors).toBeUndefined();
			expect(result.data.signIn).toEqual(
				expect.objectContaining({
					authenticationToken: expect.any(String),
					user: expect.objectContaining({
						emailAddress: lockoutTestUserEmail,
					}),
				}),
			);
		});

		test("should reset failed login attempts on successful login", async () => {
			// Set some failed attempts but no lockout
			await server.drizzleClient.execute(
				sql`UPDATE users SET failed_login_attempts = 3, locked_until = NULL, last_failed_login_at = NOW() WHERE id = ${lockoutTestUserId}`,
			);

			// Successful login
			const result = await mercuriusClient.query(Query_signIn, {
				variables: {
					input: {
						emailAddress: lockoutTestUserEmail,
						password: "correctpassword",
					},
				},
			});

			expect(result.errors).toBeUndefined();
			expect(result.data.signIn).not.toBeNull();

			// Verify counter was reset
			const userAfterSuccess = await server.drizzleClient.execute(
				sql`SELECT failed_login_attempts, locked_until, last_failed_login_at FROM users WHERE id = ${lockoutTestUserId}`,
			);
			const successRow = userAfterSuccess[0] as Record<string, unknown>;
			expect(successRow?.failed_login_attempts).toBe(0);
			expect(successRow?.locked_until).toBeNull();
			expect(successRow?.last_failed_login_at).toBeNull();
		});

		test("should not reveal account existence for non-existent accounts", async () => {
			// Non-existent account should get invalid_credentials, not a different error
			const result = await mercuriusClient.query(Query_signIn, {
				variables: {
					input: {
						emailAddress: `nonexistent${faker.string.ulid()}@email.com`,
						password: "anypassword",
					},
				},
			});

			expect(result.data.signIn).toEqual(null);
			expect(result.errors).toEqual(
				expect.arrayContaining<TalawaGraphQLFormattedError>([
					expect.objectContaining<TalawaGraphQLFormattedError>({
						extensions: expect.objectContaining<InvalidCredentialsExtensions>({
							code: "invalid_credentials",
							issues: expect.arrayContaining([
								{
									argumentPath: ["input"],
									message: "Invalid email address or password.",
								},
							]),
						}),
						message: expect.any(String),
						path: ["signIn"],
					}),
				]),
			);
		});
	});

	suite("reCAPTCHA validation", () => {
		let originalRecaptchaSecret: string | undefined;
		let originalFetch: typeof global.fetch;

		beforeEach(() => {
			originalRecaptchaSecret = server.envConfig.RECAPTCHA_SECRET_KEY;
			originalFetch = global.fetch;
		});

		afterEach(() => {
			server.envConfig.RECAPTCHA_SECRET_KEY = originalRecaptchaSecret;
			global.fetch = originalFetch;
			vi.restoreAllMocks();
		});

		test("should skip reCAPTCHA validation when RECAPTCHA_SECRET_KEY is not configured", async () => {
			// Temporarily remove the reCAPTCHA secret key
			server.envConfig.RECAPTCHA_SECRET_KEY = undefined;

			const result = await mercuriusClient.query(Query_signIn, {
				variables: {
					input: {
						emailAddress: user1Email,
						password: "password",
						// No recaptchaToken provided, should be fine when secret key is not set
					},
				},
			});

			expect(result.errors).toBeUndefined();
			expect(result.data.signIn).not.toBeNull();
			expect(result.data.signIn?.user?.emailAddress).toBe(user1Email);
		});

		test.each([
			{ scenario: "token not provided", token: undefined },
			{ scenario: "token is empty string", token: "" },
		])("should require reCAPTCHA token when RECAPTCHA_SECRET_KEY is configured but $scenario", async ({
			token,
		}) => {
			// Set a mock reCAPTCHA secret key
			server.envConfig.RECAPTCHA_SECRET_KEY = "test-secret-key";

			const result = await mercuriusClient.query(Query_signIn, {
				variables: {
					input: {
						emailAddress: user1Email,
						password: "password",
						...(token !== undefined && { recaptchaToken: token }),
					},
				},
			});

			expect(result.data.signIn).toEqual(null);
			expect(result.errors).toEqual(
				expect.arrayContaining<TalawaGraphQLFormattedError>([
					expect.objectContaining<TalawaGraphQLFormattedError>({
						extensions: expect.objectContaining<InvalidArgumentsExtensions>({
							code: "invalid_arguments",
							issues: expect.arrayContaining<
								InvalidArgumentsExtensions["issues"][number]
							>([
								{
									argumentPath: ["input", "recaptchaToken"],
									message: "reCAPTCHA token is required.",
								},
							]),
						}),
						message: expect.any(String),
						path: ["signIn"],
					}),
				]),
			);
		});

		test("should require reCAPTCHA token when RECAPTCHA_SECRET_KEY is configured but token is null", async () => {
			// Set a mock reCAPTCHA secret key
			server.envConfig.RECAPTCHA_SECRET_KEY = "test-secret-key";

			const result = await mercuriusClient.query(Query_signIn, {
				variables: {
					input: {
						emailAddress: user1Email,
						password: "password",
						recaptchaToken: null,
					},
				},
			});

			expect(result.data.signIn).toEqual(null);
			expect(result.errors).toEqual(
				expect.arrayContaining<TalawaGraphQLFormattedError>([
					expect.objectContaining<TalawaGraphQLFormattedError>({
						extensions: expect.objectContaining<InvalidArgumentsExtensions>({
							code: "invalid_arguments",
							issues: expect.arrayContaining<
								InvalidArgumentsExtensions["issues"][number]
							>([
								{
									argumentPath: ["input", "recaptchaToken"],
									message: "Expected string, received null",
								},
							]),
						}),
						message: expect.any(String),
						path: ["signIn"],
					}),
				]),
			);
		});

		test("should reject invalid reCAPTCHA token", async () => {
			// Set a mock reCAPTCHA secret key
			server.envConfig.RECAPTCHA_SECRET_KEY = "test-secret-key";

			// Mock fetch to return failed verification
			global.fetch = vi.fn().mockResolvedValue({
				json: () => Promise.resolve({ success: false }),
			} as Response);

			const result = await mercuriusClient.query(Query_signIn, {
				variables: {
					input: {
						emailAddress: user1Email,
						password: "password",
						recaptchaToken: "invalid-token",
					},
				},
			});

			expect(result.data.signIn).toEqual(null);
			expect(result.errors).toEqual(
				expect.arrayContaining<TalawaGraphQLFormattedError>([
					expect.objectContaining<TalawaGraphQLFormattedError>({
						extensions: expect.objectContaining<InvalidArgumentsExtensions>({
							code: "invalid_arguments",
							issues: expect.arrayContaining<
								InvalidArgumentsExtensions["issues"][number]
							>([
								{
									argumentPath: ["input", "recaptchaToken"],
									message: "Invalid reCAPTCHA token.",
								},
							]),
						}),
						message: expect.any(String),
						path: ["signIn"],
					}),
				]),
			);
		});

		test("should accept valid reCAPTCHA token and proceed with authentication", async () => {
			// Set a mock reCAPTCHA secret key
			server.envConfig.RECAPTCHA_SECRET_KEY = "test-secret-key";

			// Mock fetch to return successful verification
			global.fetch = vi.fn().mockResolvedValue({
				json: () => Promise.resolve({ success: true }),
			} as Response);

			const result = await mercuriusClient.query(Query_signIn, {
				variables: {
					input: {
						emailAddress: user1Email,
						password: "password",
						recaptchaToken: "valid-token",
					},
				},
			});

			expect(result.errors).toBeUndefined();
			expect(result.data.signIn).not.toBeNull();
			expect(result.data.signIn?.user?.emailAddress).toBe(user1Email);

			// Verify fetch was called with correct URL and method
			expect(global.fetch).toHaveBeenCalledWith(
				"https://www.google.com/recaptcha/api/siteverify",
				expect.objectContaining({
					method: "POST",
					headers: {
						"Content-Type": "application/x-www-form-urlencoded",
					},
					body: expect.any(URLSearchParams),
				}),
			);

			// Verify the body contains the correct parameters
			const fetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock
				.calls[0];
			const body = fetchCall?.[1]?.body as URLSearchParams;
			expect(body.get("secret")).toBe("test-secret-key");
			expect(body.get("response")).toBe("valid-token");
		});

		test("should handle reCAPTCHA API network error gracefully", async () => {
			// Set a mock reCAPTCHA secret key
			server.envConfig.RECAPTCHA_SECRET_KEY = "test-secret-key";

			// Mock fetch to throw network error
			global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

			const result = await mercuriusClient.query(Query_signIn, {
				variables: {
					input: {
						emailAddress: user1Email,
						password: "password",
						recaptchaToken: "test-token",
					},
				},
			});

			expect(result.data.signIn).toEqual(null);
			expect(result.errors).toEqual(
				expect.arrayContaining<TalawaGraphQLFormattedError>([
					expect.objectContaining<TalawaGraphQLFormattedError>({
						extensions: expect.objectContaining({
							code: "unexpected",
						}),
						message: expect.any(String),
						path: ["signIn"],
					}),
				]),
			);
		});

		test("should handle malformed reCAPTCHA API response gracefully", async () => {
			// Set a mock reCAPTCHA secret key
			server.envConfig.RECAPTCHA_SECRET_KEY = "test-secret-key";

			// Mock fetch to return malformed response
			global.fetch = vi.fn().mockResolvedValue({
				json: () => Promise.resolve(null), // Malformed response
			} as Response);

			const result = await mercuriusClient.query(Query_signIn, {
				variables: {
					input: {
						emailAddress: user1Email,
						password: "password",
						recaptchaToken: "test-token",
					},
				},
			});

			expect(result.data.signIn).toEqual(null);
			expect(result.errors).toEqual(
				expect.arrayContaining<TalawaGraphQLFormattedError>([
					expect.objectContaining<TalawaGraphQLFormattedError>({
						extensions: expect.objectContaining({
							code: "unexpected",
						}),
						message: expect.any(String),
						path: ["signIn"],
					}),
				]),
			);
		});

		test("should handle reCAPTCHA validation with error-codes in response", async () => {
			// Set a mock reCAPTCHA secret key
			server.envConfig.RECAPTCHA_SECRET_KEY = "test-secret-key";

			// Mock fetch to return response with error codes
			global.fetch = vi.fn().mockResolvedValue({
				json: () =>
					Promise.resolve({
						success: false,
						"error-codes": ["timeout-or-duplicate", "invalid-input-response"],
					}),
			} as Response);

			const result = await mercuriusClient.query(Query_signIn, {
				variables: {
					input: {
						emailAddress: user1Email,
						password: "password",
						recaptchaToken: "expired-or-duplicate-token",
					},
				},
			});

			expect(result.data.signIn).toEqual(null);
			expect(result.errors).toEqual(
				expect.arrayContaining<TalawaGraphQLFormattedError>([
					expect.objectContaining<TalawaGraphQLFormattedError>({
						extensions: expect.objectContaining<InvalidArgumentsExtensions>({
							code: "invalid_arguments",
							issues: expect.arrayContaining<
								InvalidArgumentsExtensions["issues"][number]
							>([
								{
									argumentPath: ["input", "recaptchaToken"],
									message: "Invalid reCAPTCHA token.",
								},
							]),
						}),
						message: expect.any(String),
						path: ["signIn"],
					}),
				]),
			);
		});
	});
});
