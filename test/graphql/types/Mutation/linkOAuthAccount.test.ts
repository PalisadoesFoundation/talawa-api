import { faker } from "@faker-js/faker";
import { hash } from "@node-rs/argon2";
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
import type { OAuthProviderRegistry } from "~/src/utilities/auth/oauth";
import { InvalidAuthorizationCodeError } from "~/src/utilities/auth/oauth/errors";
import type { OAuthUserProfile } from "~/src/utilities/auth/oauth/types";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import { Query_signIn } from "../documentNodes";
import type { introspection } from "../gql.tada";

const gql = initGraphQLTada<{
	introspection: introspection;
	scalars: ClientCustomScalars;
}>();

const Mutation_linkOAuthAccount =
	gql(`mutation Mutation_linkOAuthAccount($input: OAuthLoginInput!) {
    linkOAuthAccount(input: $input) {
        id
        name
        emailAddress
        isEmailAddressVerified
        role
    }
}`);

suite("Mutation linkOAuthAccount", () => {
	let mockProvider: {
		getProviderName: ReturnType<typeof vi.fn>;
		exchangeCodeForTokens: ReturnType<typeof vi.fn>;
		getUserProfile: ReturnType<typeof vi.fn>;
	};
	let authToken: string;
	let testUser: typeof usersTable.$inferSelect;
	let originalRegistry: typeof server.oauthProviderRegistry;

	beforeEach(async () => {
		// Create mock provider
		mockProvider = {
			getProviderName: vi.fn().mockReturnValue("google"),
			exchangeCodeForTokens: vi.fn(),
			getUserProfile: vi.fn(),
		};

		// Save original and replace entire object (safer for parallel execution)
		originalRegistry = server.oauthProviderRegistry;
		server.oauthProviderRegistry = {
			get: vi.fn().mockReturnValue(mockProvider),
			has: vi.fn().mockReturnValue(true),
			listProviders: vi.fn().mockReturnValue(["google"]),
			register: vi.fn(),
			unregister: vi.fn(),
			clear: vi.fn(),
		} as unknown as OAuthProviderRegistry;

		// Create a test user and get auth token
		const testEmail = `linktest-${faker.string.uuid()}@example.com`;
		const testPassword = "testPassword123";

		// Use argon2 to hash password properly
		const passwordHash = await hash(testPassword);

		const [createdUser] = await server.drizzleClient
			.insert(usersTable)
			.values({
				emailAddress: testEmail,
				name: "Test User",
				passwordHash: passwordHash,
				role: "regular",
				isEmailAddressVerified: true,
			})
			.returning();

		if (!createdUser) {
			throw new Error("Failed to create test user");
		}

		testUser = createdUser;

		// Sign in as the test user to get their auth token
		const userSignInResult = await mercuriusClient.query(Query_signIn, {
			variables: {
				input: {
					emailAddress: testEmail,
					password: testPassword,
				},
			},
		});

		if (!userSignInResult.data?.signIn?.authenticationToken) {
			throw new Error("Failed to get authentication token for test user");
		}

		authToken = userSignInResult.data.signIn.authenticationToken;
	});

	afterEach(async () => {
		// Restore original registry
		server.oauthProviderRegistry = originalRegistry;
		vi.clearAllMocks();

		// Cleanup test data
		if (testUser) {
			await server.drizzleClient
				.delete(oauthAccountsTable)
				.where(eq(oauthAccountsTable.userId, testUser.id));
			await server.drizzleClient
				.delete(usersTable)
				.where(eq(usersTable.id, testUser.id));
		}
	});

	describe("successful scenarios", () => {
		test("should link OAuth account to authenticated user", async () => {
			const providerId = `google-${faker.string.uuid()}`;

			// Mock OAuth provider responses
			mockProvider.exchangeCodeForTokens.mockResolvedValueOnce({
				access_token: "mock-access-token",
				token_type: "Bearer",
			});

			mockProvider.getUserProfile.mockResolvedValueOnce({
				providerId: providerId,
				email: testUser.emailAddress,
				name: "Test User",
				emailVerified: true,
			} as OAuthUserProfile);

			const res = await mercuriusClient.mutate(Mutation_linkOAuthAccount, {
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

			expect(res.errors).toBeUndefined();
			expect(res.data?.linkOAuthAccount).toBeDefined();
			expect(res.data?.linkOAuthAccount?.id).toBe(testUser.id);

			// Verify OAuth account was created
			const [linkedAccount] = await server.drizzleClient
				.select()
				.from(oauthAccountsTable)
				.where(eq(oauthAccountsTable.userId, testUser.id));

			expect(linkedAccount).toBeDefined();
			expect(linkedAccount?.providerId).toBe(providerId);
			expect(linkedAccount?.provider).toBe("google");
		});

		test("should link OAuth account with case-insensitive email matching", async () => {
			const providerId = `google-case-${faker.string.uuid()}`;

			// Create OAuth email with different case sensitivity than user email
			const oauthEmail = testUser.emailAddress.toUpperCase(); // Make it uppercase

			// Mock OAuth provider responses
			mockProvider.exchangeCodeForTokens.mockResolvedValueOnce({
				access_token: "mock-access-token",
				token_type: "Bearer",
			});

			mockProvider.getUserProfile.mockResolvedValueOnce({
				providerId: providerId,
				email: oauthEmail, // Different case but same email
				name: "Test User",
				emailVerified: true,
			} as OAuthUserProfile);

			const res = await mercuriusClient.mutate(Mutation_linkOAuthAccount, {
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

			expect(res.errors).toBeUndefined();
			expect(res.data?.linkOAuthAccount).toBeDefined();
			expect(res.data?.linkOAuthAccount?.id).toBe(testUser.id);

			// Verify OAuth account was created
			const [linkedAccount] = await server.drizzleClient
				.select()
				.from(oauthAccountsTable)
				.where(eq(oauthAccountsTable.userId, testUser.id));

			expect(linkedAccount).toBeDefined();
			expect(linkedAccount?.providerId).toBe(providerId);
			expect(linkedAccount?.provider).toBe("google");
			expect(linkedAccount?.email).toBe(oauthEmail); // Should store the OAuth email as-is
		});
	});

	describe("error scenarios", () => {
		test("should throw error when user is not authenticated", async () => {
			const res = await mercuriusClient.mutate(Mutation_linkOAuthAccount, {
				// No authorization header
				variables: {
					input: {
						provider: "GOOGLE",
						authorizationCode: "valid-auth-code",
						redirectUri: "http://localhost:3000/callback",
					},
				},
			});

			expect(res.errors).toBeDefined();
			expect(res.errors?.[0]?.extensions?.code).toBe("unauthenticated");
		});

		test("should throw error when OAuth provider registry is not available", async () => {
			// Temporarily replace with undefined registry
			const tempRegistry = server.oauthProviderRegistry;
			server.oauthProviderRegistry =
				undefined as unknown as OAuthProviderRegistry;

			const res = await mercuriusClient.mutate(Mutation_linkOAuthAccount, {
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
			expect(res.errors?.[0]?.extensions?.code).toBe("unexpected");
			expect(res.errors?.[0]?.message).toContain(
				"OAuth authentication is not available",
			);

			// Restore the registry
			server.oauthProviderRegistry = tempRegistry;
		});

		test("should throw error when OAuth provider is not enabled", async () => {
			// Temporarily replace registry with one that throws error
			const tempRegistry = server.oauthProviderRegistry;
			server.oauthProviderRegistry = {
				get: vi.fn().mockImplementation(() => {
					throw new Error("Provider not found");
				}),
				has: vi.fn().mockReturnValue(true),
				listProviders: vi.fn().mockReturnValue(["google"]),
				register: vi.fn(),
				unregister: vi.fn(),
				clear: vi.fn(),
			} as unknown as OAuthProviderRegistry;

			const res = await mercuriusClient.mutate(Mutation_linkOAuthAccount, {
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
			expect(res.errors?.[0]?.extensions?.code).toBe("invalid_arguments");
			const issues = res.errors?.[0]?.extensions?.issues as
				| Array<{ argumentPath: string[]; message: string }>
				| undefined;
			expect(issues).toBeDefined();
			expect(issues?.[0]?.message).toContain(
				'OAuth provider "google" is not enabled or not found.',
			);

			// Restore the registry
			server.oauthProviderRegistry = tempRegistry;
		});

		test("should throw error when getUserProfile fails", async () => {
			// Mock successful token exchange
			mockProvider.exchangeCodeForTokens.mockResolvedValueOnce({
				access_token: "mock-access-token",
				token_type: "Bearer",
			});

			// Mock getUserProfile to throw an error
			mockProvider.getUserProfile.mockRejectedValueOnce(
				new Error("Failed to fetch user profile"),
			);

			const res = await mercuriusClient.mutate(Mutation_linkOAuthAccount, {
				headers: {
					authorization: `bearer ${authToken}`,
				},
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
				"Failed to retrieve user information from OAuth provider",
			);
		});

		test("should throw error when OAuth provider returns no provider ID", async () => {
			// Mock successful token exchange
			mockProvider.exchangeCodeForTokens.mockResolvedValueOnce({
				access_token: "mock-access-token",
				token_type: "Bearer",
			});

			// Mock getUserProfile to return profile without providerId
			mockProvider.getUserProfile.mockResolvedValueOnce({
				providerId: "", // Empty provider ID
				email: testUser.emailAddress,
				name: "Test User",
				emailVerified: true,
			} as OAuthUserProfile);

			const res = await mercuriusClient.mutate(Mutation_linkOAuthAccount, {
				headers: {
					authorization: `bearer ${authToken}`,
				},
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
				"Invalid user profile received from OAuth provider",
			);
		});

		test("should throw error when authenticated user not found in database", async () => {
			// Create a separate user that will be deleted for this test
			const tempEmail = `temp-${faker.string.uuid()}@example.com`;
			const tempPassword = "tempPassword123";
			const passwordHash = await hash(tempPassword);

			const [tempUser] = await server.drizzleClient
				.insert(usersTable)
				.values({
					emailAddress: tempEmail,
					name: "Temp User",
					passwordHash: passwordHash,
					role: "regular",
					isEmailAddressVerified: true,
				})
				.returning();

			if (!tempUser) throw new Error("Failed to create temp user");

			// Sign in as temp user
			const signInResult = await mercuriusClient.query(Query_signIn, {
				variables: {
					input: { emailAddress: tempEmail, password: tempPassword },
				},
			});
			const tempAuthToken = signInResult.data?.signIn?.authenticationToken;
			if (!tempAuthToken) throw new Error("Failed to get temp auth token");

			// Delete the temp user
			await server.drizzleClient
				.delete(usersTable)
				.where(eq(usersTable.id, tempUser.id));

			// Mock successful OAuth responses
			mockProvider.exchangeCodeForTokens.mockResolvedValueOnce({
				access_token: "mock-access-token",
				token_type: "Bearer",
			});

			mockProvider.getUserProfile.mockResolvedValueOnce({
				providerId: `google-${faker.string.uuid()}`,
				email: tempEmail,
				name: "Test User",
				emailVerified: true,
			} as OAuthUserProfile);

			const res = await mercuriusClient.mutate(Mutation_linkOAuthAccount, {
				headers: {
					authorization: `bearer ${tempAuthToken}`,
				},
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
				"User account not found. Please sign in again",
			);
		});

		test("should throw error when authorization code is invalid", async () => {
			mockProvider.exchangeCodeForTokens.mockRejectedValueOnce(
				new InvalidAuthorizationCodeError("Invalid code"),
			);

			const res = await mercuriusClient.mutate(Mutation_linkOAuthAccount, {
				headers: {
					authorization: `bearer ${authToken}`,
				},
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
			const issues = res.errors?.[0]?.extensions?.issues as
				| Array<{ argumentPath: string[]; message: string }>
				| undefined;
			expect(issues).toBeDefined();
			expect(issues?.[0]?.message).toContain("Invalid or expired");
		});

		test("should throw unexpected error when token exchange fails with non-auth error", async () => {
			// Mock exchangeCodeForTokens to throw a non-InvalidAuthorizationCodeError
			mockProvider.exchangeCodeForTokens.mockRejectedValueOnce(
				new Error("Network timeout"),
			);

			const res = await mercuriusClient.mutate(Mutation_linkOAuthAccount, {
				headers: {
					authorization: `bearer ${authToken}`,
				},
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
				"Failed to link OAuth account due to a temporary problem",
			);
		});
		test("should throw error when OAuth account is already linked to same user", async () => {
			const providerId = `google-duplicate-${faker.string.uuid()}`;

			// First, create an existing OAuth account for this user
			await server.drizzleClient.insert(oauthAccountsTable).values({
				userId: testUser.id,
				provider: "google",
				providerId: providerId,
				email: testUser.emailAddress,
				profile: { name: "Test User" },
			});

			// Mock OAuth provider responses
			mockProvider.exchangeCodeForTokens.mockResolvedValueOnce({
				access_token: "mock-access-token",
				token_type: "Bearer",
			});

			mockProvider.getUserProfile.mockResolvedValueOnce({
				providerId: providerId, // Same provider ID
				email: testUser.emailAddress,
				name: "Test User",
				emailVerified: true,
			} as OAuthUserProfile);

			const res = await mercuriusClient.mutate(Mutation_linkOAuthAccount, {
				headers: {
					authorization: `bearer ${authToken}`,
				},
				variables: {
					input: {
						provider: "GOOGLE",
						authorizationCode: "valid-code",
						redirectUri: "http://localhost:3000/callback",
					},
				},
			});

			expect(res.errors).toBeDefined();
			expect(res.errors?.[0]?.extensions?.code).toBe("invalid_arguments");
			const issues = res.errors?.[0]?.extensions?.issues as
				| Array<{ argumentPath: string[]; message: string }>
				| undefined;
			expect(issues).toBeDefined();
			expect(issues?.[0]?.message).toContain(
				"account is already linked to this user",
			);
		});

		test("should throw error when OAuth account is already linked to different user", async () => {
			const providerId = `google-other-${faker.string.uuid()}`;
			const otherUserEmail = `other-${faker.string.uuid()}@example.com`;

			// Create another user
			const [otherUser] = await server.drizzleClient
				.insert(usersTable)
				.values({
					emailAddress: otherUserEmail,
					name: "Other User",
					passwordHash: await hash("somePassword"),
					role: "regular",
					isEmailAddressVerified: true,
				})
				.returning();

			if (!otherUser) {
				throw new Error("Failed to create other user");
			}

			// Link OAuth account to the other user
			await server.drizzleClient.insert(oauthAccountsTable).values({
				userId: otherUser.id,
				provider: "google",
				providerId: providerId,
				email: otherUserEmail,
				profile: { name: "Other User" },
			});

			// Mock OAuth provider responses
			mockProvider.exchangeCodeForTokens.mockResolvedValueOnce({
				access_token: "mock-access-token",
				token_type: "Bearer",
			});

			mockProvider.getUserProfile.mockResolvedValueOnce({
				providerId: providerId, // Same provider ID as other user
				email: otherUserEmail,
				name: "Other User",
				emailVerified: true,
			} as OAuthUserProfile);

			const res = await mercuriusClient.mutate(Mutation_linkOAuthAccount, {
				headers: {
					authorization: `bearer ${authToken}`,
				},
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
				"account is already linked to another user",
			);

			// Cleanup other user
			await server.drizzleClient
				.delete(oauthAccountsTable)
				.where(eq(oauthAccountsTable.userId, otherUser.id));
			await server.drizzleClient
				.delete(usersTable)
				.where(eq(usersTable.id, otherUser.id));
		});

		test("should throw error when email is different and not verified", async () => {
			const providerId = `google-unverified-${faker.string.uuid()}`;
			const differentEmail = `different-${faker.string.uuid()}@example.com`;

			// Mock OAuth provider responses
			mockProvider.exchangeCodeForTokens.mockResolvedValueOnce({
				access_token: "mock-access-token",
				token_type: "Bearer",
			});

			mockProvider.getUserProfile.mockResolvedValueOnce({
				providerId: providerId,
				email: differentEmail, // Different email
				name: "Test User",
				emailVerified: false, // NOT verified
			} as OAuthUserProfile);

			const res = await mercuriusClient.mutate(Mutation_linkOAuthAccount, {
				headers: {
					authorization: `bearer ${authToken}`,
				},
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
				"OAuth email does not match current user email.",
			);
		});

		test("should throw error when email is different even if verified", async () => {
			const providerId = `google-verified-${faker.string.uuid()}`;
			const differentEmail = `different-verified-${faker.string.uuid()}@example.com`;

			// Mock OAuth provider responses
			mockProvider.exchangeCodeForTokens.mockResolvedValueOnce({
				access_token: "mock-access-token",
				token_type: "Bearer",
			});

			mockProvider.getUserProfile.mockResolvedValueOnce({
				providerId: providerId,
				email: differentEmail, // Different email
				name: "Test User",
				emailVerified: true, // Verified but still different
			} as OAuthUserProfile);

			const res = await mercuriusClient.mutate(Mutation_linkOAuthAccount, {
				headers: {
					authorization: `bearer ${authToken}`,
				},
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
				"OAuth email does not match current user email.",
			);
		});
		test("should throw error when email undefined", async () => {
			const providerId = `google-verified-${faker.string.uuid()}`;

			// Mock OAuth provider responses
			mockProvider.exchangeCodeForTokens.mockResolvedValueOnce({
				access_token: "mock-access-token",
				token_type: "Bearer",
			});

			mockProvider.getUserProfile.mockResolvedValueOnce({
				providerId: providerId,
				email: undefined, // undefined email
				name: "Test User",
			} as OAuthUserProfile);

			const res = await mercuriusClient.mutate(Mutation_linkOAuthAccount, {
				headers: {
					authorization: `bearer ${authToken}`,
				},
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
				"OAuth provider did not provide email. Cannot link account.",
			);
		});
	});
});
