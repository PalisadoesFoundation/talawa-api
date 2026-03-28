import { randomUUID } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { initGraphQLTada } from "gql.tada";
import { print } from "graphql";
import { uuidv7 } from "uuidv7";
import {
	afterEach,
	beforeEach,
	describe,
	expect,
	suite,
	test,
	vi,
} from "vitest";
import { oauthAccountsTable } from "~/src/drizzle/tables/oauthAccount";
import { usersTable } from "~/src/drizzle/tables/users";
import type { ClientCustomScalars } from "~/src/graphql/scalars/index";
import {
	InvalidAuthorizationCodeError,
	ProfileFetchError,
} from "~/src/utilities/auth/oauth/errors";
import type { OAuthProviderRegistry } from "~/src/utilities/auth/oauth/OAuthProviderRegistry";
import type { OAuthUserProfile } from "~/src/utilities/auth/oauth/types";
import { COOKIE_NAMES } from "~/src/utilities/cookieConfig";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import { Query_signIn } from "../documentNodes";
import type { introspection } from "../gql.tada";

const gql = initGraphQLTada<{
	introspection: introspection;
	scalars: ClientCustomScalars;
}>();

const Mutation_signInWithOAuth =
	gql(`mutation Mutation_signInWithOAuth($input: OAuthLoginInput!) {
    signInWithOAuth(input: $input) {
        authenticationToken
        refreshToken
        user {
            id
            name
            emailAddress
            isEmailAddressVerified
            role
        }
    }
}`);

suite("Mutation signInWithOAuth", () => {
	let mockProvider: {
		getProviderName: ReturnType<typeof vi.fn>;
		exchangeCodeForTokens: ReturnType<typeof vi.fn>;
		getUserProfile: ReturnType<typeof vi.fn>;
	};
	let originalRegistry: OAuthProviderRegistry;

	beforeEach(() => {
		// Save original registry
		originalRegistry = server.oauthProviderRegistry;

		// Create mock provider
		mockProvider = {
			getProviderName: vi.fn().mockReturnValue("google"),
			exchangeCodeForTokens: vi.fn(),
			getUserProfile: vi.fn(),
		};

		// Mock the registry to return our mock provider
		server.oauthProviderRegistry = {
			get: vi.fn().mockReturnValue(mockProvider),
			has: vi.fn().mockReturnValue(true),
			listProviders: vi.fn().mockReturnValue(["google"]),
			register: vi.fn(),
			unregister: vi.fn(),
			clear: vi.fn(),
			getInstance: vi.fn(),
		} as unknown as OAuthProviderRegistry;
	});

	afterEach(() => {
		// Restore original registry
		server.oauthProviderRegistry = originalRegistry;
		vi.clearAllMocks();
	});

	describe("successful scenarios", () => {
		test("should sign in existing user with linked OAuth account", async () => {
			// Setup: Create a user with linked OAuth account
			const testEmail = `test-${randomUUID()}@example.com`;
			const [existingUser] = await server.drizzleClient
				.insert(usersTable)
				.values({
					emailAddress: testEmail,
					name: "Existing User",
					passwordHash: "test-hash",
					role: "regular",
					isEmailAddressVerified: true,
				})
				.returning();

			if (!existingUser) {
				throw new Error("Failed to create test user");
			}

			const seedLastUsedAt = new Date("2000-01-01T00:00:00.000Z");
			const [existingOAuthAccount] = await server.drizzleClient
				.insert(oauthAccountsTable)
				.values({
					userId: existingUser.id,
					provider: "google",
					providerId: "google-123",
					email: testEmail,
					profile: {
						name: "Existing User",
						picture: "https://example.com/pic.jpg",
					},
					lastUsedAt: seedLastUsedAt,
				})
				.returning();

			// Mock OAuth provider responses
			mockProvider.exchangeCodeForTokens.mockResolvedValueOnce({
				access_token: "mock-access-token",
				token_type: "Bearer",
			});

			mockProvider.getUserProfile.mockResolvedValueOnce({
				providerId: "google-123",
				email: testEmail,
				name: "Existing User",
				emailVerified: true,
			} as OAuthUserProfile);

			const res = await mercuriusClient.mutate(Mutation_signInWithOAuth, {
				variables: {
					input: {
						provider: "GOOGLE",
						authorizationCode: "valid-auth-code",
						redirectUri: "http://localhost:3000/callback",
					},
				},
			});

			expect(res.errors).toBeUndefined();
			expect(res.data?.signInWithOAuth).toBeDefined();
			expect(res.data?.signInWithOAuth?.authenticationToken).toBeDefined();
			expect(res.data?.signInWithOAuth?.refreshToken).toBeDefined();
			expect(res.data?.signInWithOAuth?.user?.id).toBe(existingUser?.id);
			expect(res.data?.signInWithOAuth?.user?.emailAddress).toBe(testEmail);

			// Verify lastUsedAt was updated
			if (!existingOAuthAccount) {
				throw new Error("Failed to create OAuth account");
			}

			const [updatedOAuthAccount] = await server.drizzleClient
				.select()
				.from(oauthAccountsTable)
				.where(eq(oauthAccountsTable.id, existingOAuthAccount.id));

			if (!updatedOAuthAccount) {
				throw new Error("Failed to find updated OAuth account");
			}

			expect(updatedOAuthAccount.lastUsedAt.getTime()).toBeGreaterThan(
				seedLastUsedAt.getTime(),
			);

			// Cleanup
			await server.drizzleClient
				.delete(oauthAccountsTable)
				.where(eq(oauthAccountsTable.id, existingOAuthAccount.id));
			await server.drizzleClient
				.delete(usersTable)
				.where(eq(usersTable.id, existingUser.id));
		});

		test("should upgrade user role from regular to administrator when user has admin membership", async () => {
			// Setup: Create organization using raw SQL with proper UUID
			const organizationId = uuidv7();
			const orgName = `Test Organization ${randomUUID()}`;
			await server.drizzleClient.execute(
				sql`INSERT INTO organizations (id, name, description) VALUES (${organizationId}, ${orgName}, 'Organization for role upgrade test')`,
			);

			if (!organizationId) {
				throw new Error("Failed to create test organization");
			}

			// Setup: Create user with regular role
			const testEmail = `admin-upgrade-${randomUUID()}@example.com`;
			const uniqueProviderId = `google-admin-${randomUUID()}`;
			const [user] = await server.drizzleClient
				.insert(usersTable)
				.values({
					emailAddress: testEmail,
					name: "User To Upgrade",
					passwordHash: "test-hash",
					role: "regular", // Important: starts as regular
					isEmailAddressVerified: true,
				})
				.returning();

			if (!user) {
				throw new Error("Failed to create test user");
			}

			// Setup: Create organization membership with administrator role using raw SQL
			await server.drizzleClient.execute(
				sql`INSERT INTO organization_memberships (member_id, organization_id, role, creator_id) VALUES (${user.id}, ${organizationId}, 'administrator', ${user.id})`,
			);

			// Setup: Create OAuth account for the user
			const [oauthAccount] = await server.drizzleClient
				.insert(oauthAccountsTable)
				.values({
					userId: user.id,
					provider: "google",
					providerId: uniqueProviderId,
					email: testEmail,
					profile: {
						name: "User To Upgrade",
						picture: "https://example.com/admin.jpg",
					},
				})
				.returning();

			if (!oauthAccount) {
				throw new Error("Failed to create OAuth account");
			}

			// Mock OAuth provider responses
			mockProvider.exchangeCodeForTokens.mockResolvedValueOnce({
				access_token: "mock-access-token",
				token_type: "Bearer",
			});

			mockProvider.getUserProfile.mockResolvedValueOnce({
				providerId: uniqueProviderId,
				email: testEmail,
				name: "User To Upgrade",
				emailVerified: true,
			} as OAuthUserProfile);

			try {
				// Act: Sign in with OAuth
				const res = await mercuriusClient.mutate(Mutation_signInWithOAuth, {
					variables: {
						input: {
							provider: "GOOGLE",
							authorizationCode: "valid-auth-code",
							redirectUri: "http://localhost:3000/callback",
						},
					},
				});

				// Assert: OAuth sign-in succeeded
				expect(res.errors).toBeUndefined();
				expect(res.data?.signInWithOAuth).toBeDefined();
				expect(res.data?.signInWithOAuth?.user?.id).toBe(user.id);

				// Debug: Check if membership exists
				const membershipCheck = await server.drizzleClient.execute(
					sql`SELECT role FROM organization_memberships WHERE member_id = ${user.id} AND role = 'administrator'`,
				);
				expect(membershipCheck.length).toBeGreaterThan(0); // Verify membership exists

				// Assert: User role was upgraded from regular to administrator
				// Note: The role upgrade happens in-memory during the transaction,
				// so we check the response data rather than the database
				expect(res.data?.signInWithOAuth?.user?.role).toBe("administrator"); // This is the key assertion for the uncovered line
			} finally {
				// Cleanup using raw SQL
				await server.drizzleClient
					.delete(oauthAccountsTable)
					.where(eq(oauthAccountsTable.id, oauthAccount.id));
				await server.drizzleClient.execute(
					sql`DELETE FROM organization_memberships WHERE member_id = ${user.id}`,
				);
				await server.drizzleClient
					.delete(usersTable)
					.where(eq(usersTable.id, user.id));
				await server.drizzleClient.execute(
					sql`DELETE FROM organizations WHERE id = ${organizationId}`,
				);
			}
		});

		test("should set HTTP-Only cookies when cookie helper is available", async () => {
			const testEmail = `cookie-test-${randomUUID()}@example.com`;

			// Setup: Create user and OAuth account first
			const [testUser] = await server.drizzleClient
				.insert(usersTable)
				.values({
					emailAddress: testEmail,
					name: "Cookie Test User",
					passwordHash: "test-hash",
					role: "regular",
					isEmailAddressVerified: true,
				})
				.returning();

			if (!testUser) {
				throw new Error("Failed to create test user");
			}

			const [oauthAccount] = await server.drizzleClient
				.insert(oauthAccountsTable)
				.values({
					userId: testUser.id,
					provider: "google",
					providerId: "google-cookie-test",
					email: testEmail,
					profile: {
						name: "Cookie Test User",
						picture: "https://example.com/cookie.jpg",
					},
				})
				.returning();

			if (!oauthAccount) {
				throw new Error("Failed to create OAuth account");
			}

			// Mock OAuth provider responses
			mockProvider.exchangeCodeForTokens.mockResolvedValueOnce({
				access_token: "mock-access-token",
				token_type: "Bearer",
			});

			mockProvider.getUserProfile.mockResolvedValueOnce({
				providerId: "google-cookie-test",
				email: testEmail,
				name: "Cookie Test User",
				picture: "https://example.com/cookie.jpg",
				emailVerified: true,
			} as OAuthUserProfile);

			// Use server.inject to make direct HTTP request
			const response = await server.inject({
				method: "POST",
				url: "/graphql",
				payload: {
					query: print(Mutation_signInWithOAuth),
					variables: {
						input: {
							provider: "GOOGLE",
							authorizationCode: "valid-auth-code",
							redirectUri: "http://localhost:3000/callback",
						},
					},
				},
			});

			// Assert: HTTP response is successful
			expect(response.statusCode).toBe(200);

			// Assert: Cookies are set correctly
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

			// Cleanup
			await server.drizzleClient
				.delete(oauthAccountsTable)
				.where(eq(oauthAccountsTable.id, oauthAccount.id));
			await server.drizzleClient
				.delete(usersTable)
				.where(eq(usersTable.id, testUser.id));
		});
	});

	describe("error scenarios", () => {
		test("should throw error when OAuth provider registry is not available", async () => {
			// Temporarily remove registry
			server.oauthProviderRegistry =
				undefined as unknown as OAuthProviderRegistry;

			const res = await mercuriusClient.mutate(Mutation_signInWithOAuth, {
				variables: {
					input: {
						provider: "GOOGLE",
						authorizationCode: "valid-auth-code",
						redirectUri: "http://localhost:3000/callback",
					},
				},
			});

			expect(res.errors).toBeDefined();
			expect(res.errors?.[0]?.extensions?.code).toBe("unexpected");
			expect(res.errors?.[0]?.message).toContain(
				"OAuth authentication is not available",
			);

			// Restore registry (done in afterEach)
		});

		test("should throw error when user is already authenticated", async () => {
			// First, sign in to get a valid authentication token
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

			const authToken =
				administratorUserSignInResult.data?.signIn?.authenticationToken;
			if (!authToken) {
				throw new Error("Failed to get authentication token for test");
			}

			// Now try to call signInWithOAuth while already authenticated
			const res = await mercuriusClient.mutate(Mutation_signInWithOAuth, {
				headers: {
					authorization: `bearer ${authToken}`,
				},
				variables: {
					input: {
						provider: "GOOGLE",
						authorizationCode: "valid-auth-code",
						redirectUri: "http://localhost:3000/callback",
					},
				},
			});

			expect(res.errors).toBeDefined();
			expect(res.errors?.[0]?.extensions?.code).toBe("forbidden_action");
			expect(res.errors?.[0]?.message).toContain(
				"You are already signed in. Please sign out first.",
			);
		});

		test("should throw error when OAuth provider is not enabled", async () => {
			// Mock registry to throw error when getting provider
			server.oauthProviderRegistry.get = vi.fn().mockImplementation(() => {
				throw new Error("Provider not found");
			});

			const res = await mercuriusClient.mutate(Mutation_signInWithOAuth, {
				variables: {
					input: {
						provider: "GOOGLE",
						authorizationCode: "valid-auth-code",
						redirectUri: "http://localhost:3000/callback",
					},
				},
			});

			expect(res.errors).toBeDefined();
			expect(res.errors?.[0]?.extensions?.code).toBe("invalid_arguments");
			// Check that error has issues array with specific message
			const issues = res.errors?.[0]?.extensions?.issues as
				| Array<{ argumentPath: string[]; message: string }>
				| undefined;
			expect(issues).toBeDefined();
			expect(issues?.[0]?.message).toContain(
				'OAuth provider "google" is not enabled or not found.',
			);
		});

		test("should throw error when authorization code is invalid", async () => {
			mockProvider.exchangeCodeForTokens.mockRejectedValueOnce(
				new InvalidAuthorizationCodeError("Invalid code"),
			);

			const res = await mercuriusClient.mutate(Mutation_signInWithOAuth, {
				variables: {
					input: {
						provider: "GOOGLE",
						authorizationCode: "invalid-code",
						redirectUri: "http://localhost:3000/callback",
					},
				},
			});

			expect(res.errors).toBeDefined();
			expect(res.errors?.[0]?.extensions?.code).toBe("invalid_arguments");
			// Check that error has issues array with specific message
			const issues = res.errors?.[0]?.extensions?.issues as
				| Array<{ argumentPath: string[]; message: string }>
				| undefined;
			expect(issues).toBeDefined();
			expect(issues?.[0]?.message).toContain("Invalid or expired");
		});

		test("should throw error when token exchange fails with general error", async () => {
			mockProvider.exchangeCodeForTokens.mockRejectedValueOnce(
				new Error("Network error"),
			);

			const res = await mercuriusClient.mutate(Mutation_signInWithOAuth, {
				variables: {
					input: {
						provider: "GOOGLE",
						authorizationCode: "valid-code",
						redirectUri: "http://localhost:3000/callback",
					},
				},
			});

			expect(res.errors).toBeDefined();
			expect(res.errors?.[0]?.extensions?.code).toBe("unexpected");
			expect(res.errors?.[0]?.message).toContain(
				"Failed to sign in with OAuth due to a temporary problem",
			);
		});

		test("should throw error when profile fetch fails", async () => {
			mockProvider.exchangeCodeForTokens.mockResolvedValueOnce({
				access_token: "mock-access-token",
				token_type: "Bearer",
			});

			mockProvider.getUserProfile.mockRejectedValueOnce(
				new ProfileFetchError("Profile fetch failed"),
			);

			const res = await mercuriusClient.mutate(Mutation_signInWithOAuth, {
				variables: {
					input: {
						provider: "GOOGLE",
						authorizationCode: "valid-code",
						redirectUri: "http://localhost:3000/callback",
					},
				},
			});

			expect(res.errors).toBeDefined();
			expect(res.errors?.[0]?.extensions?.code).toBe("unexpected");
			expect(res.errors?.[0]?.message).toContain(
				"Failed to retrieve user information",
			);
		});

		test("should throw error when provider does not return provider ID", async () => {
			mockProvider.exchangeCodeForTokens.mockResolvedValueOnce({
				access_token: "mock-access-token",
				token_type: "Bearer",
			});

			mockProvider.getUserProfile.mockResolvedValueOnce({
				providerId: "",
				email: "test@example.com",
				name: "Test User",
			} as OAuthUserProfile);

			const res = await mercuriusClient.mutate(Mutation_signInWithOAuth, {
				variables: {
					input: {
						provider: "GOOGLE",
						authorizationCode: "valid-code",
						redirectUri: "http://localhost:3000/callback",
					},
				},
			});

			expect(res.errors).toBeDefined();
			expect(res.errors?.[0]?.extensions?.code).toBe("unexpected");
			expect(res.errors?.[0]?.message).toContain("Invalid user profile");
		});

		test("should throw error when OAuth account is not linked", async () => {
			const unlinkedProviderId = `google-unlinked-${randomUUID()}`;

			mockProvider.exchangeCodeForTokens.mockResolvedValueOnce({
				access_token: "mock-access-token",
				token_type: "Bearer",
			});

			mockProvider.getUserProfile.mockResolvedValueOnce({
				providerId: unlinkedProviderId,
				email: `unlinked-${randomUUID()}@example.com`,
				name: "Unlinked OAuth User",
				emailVerified: true,
			} as OAuthUserProfile);

			const res = await mercuriusClient.mutate(Mutation_signInWithOAuth, {
				variables: {
					input: {
						provider: "GOOGLE",
						authorizationCode: "valid-code",
						redirectUri: "http://localhost:3000/callback",
					},
				},
			});

			expect(res.errors).toBeDefined();
			expect(res.errors?.[0]?.extensions?.code).toBe("forbidden_action");
			expect(res.errors?.[0]?.message).toContain("OAuth account not found.");
		});

		test("should handle database anomaly - OAuth account without user", async () => {
			const testEmail = `anomaly-${randomUUID()}@example.com`;
			const orphanedUserId = randomUUID();

			// Mock the entire transaction to simulate the anomaly
			const mockTx = {
				select: vi.fn().mockImplementation(() => ({
					from: vi.fn().mockImplementation((table) => ({
						where: vi.fn().mockResolvedValueOnce(
							table === oauthAccountsTable
								? [
										{
											id: randomUUID(),
											userId: orphanedUserId, // References non-existent user
											provider: "google",
											providerId: "google-orphaned",
											email: testEmail,
											profile: { name: "Test" },
										},
									]
								: [], // No user found
						),
					})),
				})),
			};

			const originalTransaction = server.drizzleClient.transaction;
			server.drizzleClient.transaction = vi.fn(async (callback) =>
				callback(mockTx),
			);

			try {
				// Test with mock OAuth provider
				mockProvider.exchangeCodeForTokens.mockResolvedValueOnce({
					access_token: "mock-token",
					token_type: "Bearer",
				});

				mockProvider.getUserProfile.mockResolvedValueOnce({
					providerId: "google-orphaned",
					email: testEmail,
					name: "Test",
					emailVerified: true,
				});

				const res = await mercuriusClient.mutate(Mutation_signInWithOAuth, {
					variables: {
						input: {
							provider: "GOOGLE",
							authorizationCode: "valid-code",
							redirectUri: "http://localhost:3000/callback",
						},
					},
				});

				expect(res.errors?.[0]?.extensions?.code).toBe("unexpected");
			} finally {
				server.drizzleClient.transaction = originalTransaction;
			}
		});
	});

	describe("edge cases", () => {
		test("should use default refresh token expiry when not configured", async () => {
			const testEmail = `default-expiry-${randomUUID()}@example.com`;

			// Setup: Create user and OAuth account first
			const [testUser] = await server.drizzleClient
				.insert(usersTable)
				.values({
					emailAddress: testEmail,
					name: "Default Expiry User",
					passwordHash: "test-hash",
					role: "regular",
					isEmailAddressVerified: true,
				})
				.returning();

			if (!testUser) {
				throw new Error("Failed to create test user");
			}

			const [oauthAccount] = await server.drizzleClient
				.insert(oauthAccountsTable)
				.values({
					userId: testUser.id,
					provider: "google",
					providerId: "google-default-expiry",
					email: testEmail,
					profile: {
						name: "Default Expiry User",
						picture: "https://example.com/pic.jpg",
					},
				})
				.returning();

			if (!oauthAccount) {
				throw new Error("Failed to create OAuth account");
			}

			// Temporarily remove the config value
			const originalExpiry = server.envConfig.API_REFRESH_TOKEN_EXPIRES_IN;

			try {
				delete (server.envConfig as { API_REFRESH_TOKEN_EXPIRES_IN?: number })
					.API_REFRESH_TOKEN_EXPIRES_IN;
				mockProvider.exchangeCodeForTokens.mockResolvedValueOnce({
					access_token: "mock-access-token",
					token_type: "Bearer",
				});
				mockProvider.getUserProfile.mockResolvedValueOnce({
					providerId: "google-default-expiry",
					email: testEmail,
					name: "Default Expiry User",
					emailVerified: true,
				} as OAuthUserProfile);
				const res = await mercuriusClient.mutate(Mutation_signInWithOAuth, {
					variables: {
						input: {
							provider: "GOOGLE",
							authorizationCode: "valid-code",
							redirectUri: "http://localhost:3000/callback",
						},
					},
				});
				expect(res.errors).toBeUndefined();
				expect(res.data?.signInWithOAuth?.authenticationToken).toBeDefined();
				expect(res.data?.signInWithOAuth?.refreshToken).toBeDefined();
				// Cleanup
				await server.drizzleClient
					.delete(oauthAccountsTable)
					.where(eq(oauthAccountsTable.id, oauthAccount.id));
				await server.drizzleClient
					.delete(usersTable)
					.where(eq(usersTable.id, testUser.id));
			} finally {
				// Restore config
				server.envConfig.API_REFRESH_TOKEN_EXPIRES_IN = originalExpiry;
			}
		});
		test("should reset failed login attempts on successful OAuth authentication", async () => {
			const testEmail = `locked-${randomUUID()}@example.com`;
			const futureDate = new Date(Date.now() + 60000); // 1 minute from now

			const [lockedUser] = await server.drizzleClient
				.insert(usersTable)
				.values({
					emailAddress: testEmail,
					name: "Locked User",
					passwordHash: "test-hash",
					role: "regular",
					isEmailAddressVerified: true,
					failedLoginAttempts: 5,
					lockedUntil: futureDate,
					lastFailedLoginAt: new Date(),
				})
				.returning();

			if (!lockedUser) {
				throw new Error("Failed to create test user");
			}

			// Setup: Create OAuth account
			const [oauthAccount] = await server.drizzleClient
				.insert(oauthAccountsTable)
				.values({
					userId: lockedUser.id,
					provider: "google",
					providerId: "google-unlock",
					email: testEmail,
					profile: { name: "Locked User" },
				})
				.returning();

			if (!oauthAccount) {
				throw new Error("Failed to create OAuth account");
			}

			mockProvider.exchangeCodeForTokens.mockResolvedValueOnce({
				access_token: "mock-access-token",
				token_type: "Bearer",
			});

			mockProvider.getUserProfile.mockResolvedValueOnce({
				providerId: "google-unlock",
				email: testEmail,
				name: "Locked User",
				emailVerified: true,
			} as OAuthUserProfile);

			const res = await mercuriusClient.mutate(Mutation_signInWithOAuth, {
				variables: {
					input: {
						provider: "GOOGLE",
						authorizationCode: "valid-code",
						redirectUri: "http://localhost:3000/callback",
					},
				},
			});

			expect(res.errors).toBeUndefined();
			expect(res.data?.signInWithOAuth?.authenticationToken).toBeDefined();

			// Verify failed login attempts were reset
			const [updatedUser] = await server.drizzleClient
				.select()
				.from(usersTable)
				.where(eq(usersTable.id, lockedUser.id));

			expect(updatedUser).toBeDefined();
			expect(updatedUser?.failedLoginAttempts).toBe(0);
			expect(updatedUser?.lockedUntil).toBeNull();
			expect(updatedUser?.lastFailedLoginAt).toBeNull();

			// Cleanup
			await server.drizzleClient
				.delete(oauthAccountsTable)
				.where(eq(oauthAccountsTable.userId, lockedUser.id));
			await server.drizzleClient
				.delete(usersTable)
				.where(eq(usersTable.id, lockedUser.id));
		});
	});
});
