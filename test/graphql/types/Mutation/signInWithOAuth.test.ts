import { eq } from "drizzle-orm";
import { initGraphQLTada } from "gql.tada";
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
			const testEmail = `test-${Date.now()}@example.com`;
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

			expect(updatedOAuthAccount.lastUsedAt.getTime()).toBeGreaterThanOrEqual(
				existingOAuthAccount.lastUsedAt.getTime(),
			);

			// Cleanup
			await server.drizzleClient
				.delete(oauthAccountsTable)
				.where(eq(oauthAccountsTable.id, existingOAuthAccount.id));
			await server.drizzleClient
				.delete(usersTable)
				.where(eq(usersTable.id, existingUser.id));
		});

		test("should link OAuth account to existing user with matching email", async () => {
			// Setup: Create user WITHOUT OAuth account
			const testEmail = `test-link-${Date.now()}@example.com`;
			const [existingUser] = await server.drizzleClient
				.insert(usersTable)
				.values({
					emailAddress: testEmail,
					name: "User To Link",
					passwordHash: "test-hash",
					role: "regular",
					isEmailAddressVerified: false,
				})
				.returning();

			// Mock OAuth provider responses
			mockProvider.exchangeCodeForTokens.mockResolvedValueOnce({
				access_token: "mock-access-token",
				token_type: "Bearer",
			});

			mockProvider.getUserProfile.mockResolvedValueOnce({
				providerId: "google-456",
				email: testEmail,
				name: "User To Link",
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
			expect(res.data?.signInWithOAuth?.user?.id).toBe(existingUser?.id);
			expect(res.data?.signInWithOAuth?.user?.isEmailAddressVerified).toBe(
				true,
			);

			if (!existingUser) {
				throw new Error("Failed to create test user");
			}

			// Verify OAuth account was created
			const [createdOAuthAccount] = await server.drizzleClient
				.select()
				.from(oauthAccountsTable)
				.where(eq(oauthAccountsTable.userId, existingUser.id));

			expect(createdOAuthAccount).toBeDefined();
			expect(createdOAuthAccount?.userId).toBe(existingUser?.id);
			expect(createdOAuthAccount?.email).toBe(testEmail);

			// Verify user email was marked as verified
			const [updatedUser] = await server.drizzleClient
				.select()
				.from(usersTable)
				.where(eq(usersTable.id, existingUser.id));

			expect(updatedUser).toBeDefined();
			expect(updatedUser?.isEmailAddressVerified).toBe(true);

			// Cleanup
			if (createdOAuthAccount) {
				await server.drizzleClient
					.delete(oauthAccountsTable)
					.where(eq(oauthAccountsTable.id, createdOAuthAccount.id));
			}
			await server.drizzleClient
				.delete(usersTable)
				.where(eq(usersTable.id, existingUser.id));
		});

		test("should create new user and link OAuth account", async () => {
			const testEmail = `newuser-${Date.now()}@example.com`;

			// Mock OAuth provider responses
			mockProvider.exchangeCodeForTokens.mockResolvedValueOnce({
				access_token: "mock-access-token",
				token_type: "Bearer",
			});

			mockProvider.getUserProfile.mockResolvedValueOnce({
				providerId: "google-789",
				email: testEmail,
				name: "New OAuth User",
				picture: "https://example.com/newuser.jpg",
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
			expect(res.data?.signInWithOAuth?.user?.emailAddress).toBe(testEmail);
			expect(res.data?.signInWithOAuth?.user?.name).toBe("New OAuth User");
			expect(res.data?.signInWithOAuth?.user?.isEmailAddressVerified).toBe(
				true,
			);

			const userId = res.data?.signInWithOAuth?.user?.id;

			expect(userId).toBeDefined();
			if (!userId) throw new Error("User ID is undefined");

			// Verify user was created
			const [createdUser] = await server.drizzleClient
				.select()
				.from(usersTable)
				.where(eq(usersTable.id, userId));

			expect(createdUser).toBeDefined();
			expect(createdUser?.emailAddress).toBe(testEmail);
			expect(createdUser?.isEmailAddressVerified).toBe(true);

			// Verify OAuth account was created
			const [createdOAuthAccount] = await server.drizzleClient
				.select()
				.from(oauthAccountsTable)
				.where(eq(oauthAccountsTable.userId, userId));

			expect(createdOAuthAccount).toBeDefined();
			expect(createdOAuthAccount?.userId).toBe(userId);

			// Cleanup
			if (createdOAuthAccount) {
				await server.drizzleClient
					.delete(oauthAccountsTable)
					.where(eq(oauthAccountsTable.id, createdOAuthAccount.id));
			}
			await server.drizzleClient
				.delete(usersTable)
				.where(eq(usersTable.id, userId));
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

		test("should throw error when creating new user without email", async () => {
			mockProvider.exchangeCodeForTokens.mockResolvedValueOnce({
				access_token: "mock-access-token",
				token_type: "Bearer",
			});

			mockProvider.getUserProfile.mockResolvedValueOnce({
				providerId: "google-no-email",
				name: "User Without Email",
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
			expect(res.errors?.[0]?.message).toContain("did not share your email");
		});

		test("should throw error when creating new user without name", async () => {
			mockProvider.exchangeCodeForTokens.mockResolvedValueOnce({
				access_token: "mock-access-token",
				token_type: "Bearer",
			});

			mockProvider.getUserProfile.mockResolvedValueOnce({
				providerId: "google-no-name",
				email: "noname@example.com",
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
			expect(res.errors?.[0]?.message).toContain("did not share your name");
		});

		test("should handle database anomaly - OAuth account without user", async () => {
			const testEmail = `orphaned-${Date.now()}@example.com`;
			const fakeUserId = "00000000-0000-0000-0000-000000000001";

			// Save original drizzleClient
			const originalClient = server.drizzleClient;

			try {
				let selectCallCount = 0;
				const mockClient = {
					...originalClient,
					transaction: vi.fn(async (callback) => {
						const mockTx = {
							...originalClient,
							select: vi.fn(() => ({
								from: vi.fn(() => ({
									where: vi.fn(async () => {
										selectCallCount++;
										// First select: return OAuth account with non-existent user
										if (selectCallCount === 1) {
											return [
												{
													id: "oauth-123",
													userId: fakeUserId,
													provider: "google",
													providerId: "google-orphaned",
													email: testEmail,
												},
											];
										}
										// Second select: return empty (user doesn't exist)
										if (selectCallCount === 2) {
											return [];
										}
										return [];
									}),
								})),
							})),
							insert: vi.fn(() => ({
								values: vi.fn(() => ({
									returning: vi.fn(async () => [{ id: "test-id" }]),
								})),
							})),
							update: vi.fn(() => ({
								set: vi.fn(() => ({
									where: vi.fn(async () => {}),
								})),
							})),
						};
						return callback(mockTx);
					}),
				};
				// Temporarily replace drizzleClient
				server.drizzleClient =
					mockClient as unknown as typeof server.drizzleClient;
				mockProvider.exchangeCodeForTokens.mockResolvedValueOnce({
					access_token: "mock-access-token",
					token_type: "Bearer",
				});
				mockProvider.getUserProfile.mockResolvedValueOnce({
					providerId: "google-orphaned",
					email: testEmail,
					name: "Orphaned User",
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
				expect(res.errors?.[0]?.extensions?.code).toBe("unexpected");
				expect(res.errors?.[0]?.message).toContain("User account not found");
			} finally {
				server.drizzleClient = originalClient;
			}

			// Restore original client
			server.drizzleClient = originalClient;
		});

		test("should handle empty insert result with mock", async () => {
			const testEmail = `mock-empty-${Date.now()}@example.com`;

			// Save original drizzleClient
			const originalClient = server.drizzleClient;

			// Create a mock that simulates empty insert result
			let insertCallCount = 0;
			const mockClient = {
				...originalClient,
				transaction: vi.fn(async (callback) => {
					const mockTx = {
						...originalClient,
						select: vi.fn(() => ({
							from: vi.fn(() => ({
								where: vi.fn(async () => {
									// Return empty array for all selects to simulate new user scenario
									return [];
								}),
							})),
						})),
						insert: vi.fn(() => ({
							values: vi.fn(() => ({
								returning: vi.fn(async () => {
									insertCallCount++;
									// First insert is for user - return empty to trigger error
									if (insertCallCount === 1) {
										return [];
									}
									// Shouldn't get here but return something to avoid further errors
									return [{ id: "test-id" }];
								}),
							})),
						})),
					};
					return callback(mockTx);
				}),
			};

			// Temporarily replace drizzleClient
			server.drizzleClient =
				mockClient as unknown as typeof server.drizzleClient;

			mockProvider.exchangeCodeForTokens.mockResolvedValueOnce({
				access_token: "mock-access-token",
				token_type: "Bearer",
			});

			mockProvider.getUserProfile.mockResolvedValueOnce({
				providerId: "google-empty-insert",
				email: testEmail,
				name: "Empty Insert User",
				emailVerified: true,
			} as OAuthUserProfile);

			try {
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
			} finally {
				// Restore original client
				server.drizzleClient = originalClient;
			}
		});
	});

	describe("edge cases", () => {
		test("should use default refresh token expiry when not configured", async () => {
			const testEmail = `default-expiry-${Date.now()}@example.com`;

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
				const userId = res.data?.signInWithOAuth?.user?.id;
				if (!userId) {
					throw new Error("User ID is undefined");
				}
				// Cleanup
				await server.drizzleClient
					.delete(oauthAccountsTable)
					.where(eq(oauthAccountsTable.userId, userId));
				await server.drizzleClient
					.delete(usersTable)
					.where(eq(usersTable.id, userId));
			} finally {
				// Restore config
				server.envConfig.API_REFRESH_TOKEN_EXPIRES_IN = originalExpiry;
			}
		});

		test("should handle user with unverified email linking verified OAuth account", async () => {
			const testEmail = `unverified-${Date.now()}@example.com`;
			const [existingUser] = await server.drizzleClient
				.insert(usersTable)
				.values({
					emailAddress: testEmail,
					name: "Unverified User",
					passwordHash: "test-hash",
					role: "regular",
					isEmailAddressVerified: false,
				})
				.returning();

			if (!existingUser) {
				throw new Error("Failed to create test user");
			}

			mockProvider.exchangeCodeForTokens.mockResolvedValueOnce({
				access_token: "mock-access-token",
				token_type: "Bearer",
			});

			mockProvider.getUserProfile.mockResolvedValueOnce({
				providerId: "google-verified",
				email: testEmail,
				name: "Unverified User",
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
			expect(res.data?.signInWithOAuth?.user?.isEmailAddressVerified).toBe(
				true,
			);

			// Cleanup
			await server.drizzleClient
				.delete(oauthAccountsTable)
				.where(eq(oauthAccountsTable.userId, existingUser.id));
			await server.drizzleClient
				.delete(usersTable)
				.where(eq(usersTable.id, existingUser.id));
		});

		test("should reset failed login attempts on successful OAuth authentication", async () => {
			const testEmail = `locked-${Date.now()}@example.com`;
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

		test("should reject linking unverified OAuth email to existing user", async () => {
			const testEmail = `verified-${Date.now()}@example.com`;
			const [existingUser] = await server.drizzleClient
				.insert(usersTable)
				.values({
					emailAddress: testEmail,
					name: "Verified User",
					passwordHash: "test-hash",
					role: "regular",
					isEmailAddressVerified: true,
				})
				.returning();

			if (!existingUser) {
				throw new Error("Failed to create test user");
			}

			mockProvider.exchangeCodeForTokens.mockResolvedValueOnce({
				access_token: "mock-access-token",
				token_type: "Bearer",
			});

			mockProvider.getUserProfile.mockResolvedValueOnce({
				providerId: "google-unverified",
				email: testEmail,
				name: "Verified User",
				emailVerified: false,
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
			expect(res.errors?.[0]?.message).toContain(
				"A user with this email already exists. Please verify your email with the OAuth provider",
			);

			// Cleanup
			await server.drizzleClient
				.delete(usersTable)
				.where(eq(usersTable.id, existingUser.id));
		});
	});
});
