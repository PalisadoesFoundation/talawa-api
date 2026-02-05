import { randomUUID } from "node:crypto";
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
import { InvalidAuthorizationCodeError } from "~/src/utilities/auth/oauth/errors";
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
	let originalRegistry: OAuthProviderRegistry;
	let authToken: string;
	let testUser: typeof usersTable.$inferSelect;

	beforeEach(async () => {
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

		// Create a test user and get auth token
		const testEmail = `linktest-${randomUUID()}@example.com`;
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
			const providerId = `google-${randomUUID()}`;

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

		test("should link OAuth account when email is different but verified", async () => {
			const providerId = `google-diff-${randomUUID()}`;
			const differentEmail = `different-${randomUUID()}@example.com`;

			// Mock OAuth provider responses
			mockProvider.exchangeCodeForTokens.mockResolvedValueOnce({
				access_token: "mock-access-token",
				token_type: "Bearer",
			});

			mockProvider.getUserProfile.mockResolvedValueOnce({
				providerId: providerId,
				email: differentEmail, // Different email
				name: "Test User",
				emailVerified: true, // But verified
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
			expect(res.data?.linkOAuthAccount?.id).toBe(testUser.id);
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
			// Temporarily remove registry
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
		});

		test("should throw error when OAuth provider is not enabled", async () => {
			// Mock registry to throw error when getting provider
			server.oauthProviderRegistry.get = vi.fn().mockImplementation(() => {
				throw new Error("Provider not found");
			});

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
			// Delete the test user from database after getting auth token
			await server.drizzleClient
				.delete(usersTable)
				.where(eq(usersTable.id, testUser.id));

			// Mock successful OAuth responses
			mockProvider.exchangeCodeForTokens.mockResolvedValueOnce({
				access_token: "mock-access-token",
				token_type: "Bearer",
			});

			mockProvider.getUserProfile.mockResolvedValueOnce({
				providerId: `google-${randomUUID()}`,
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
				"User account not found. Please sign in again",
			);

			// Recreate user for cleanup
			const [recreatedUser] = await server.drizzleClient
				.insert(usersTable)
				.values({
					id: testUser.id,
					emailAddress: testUser.emailAddress,
					name: testUser.name,
					passwordHash: testUser.passwordHash,
					role: testUser.role,
					isEmailAddressVerified: testUser.isEmailAddressVerified,
				})
				.returning();

			if (recreatedUser) {
				testUser = recreatedUser;
			}
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
			const providerId = `google-duplicate-${randomUUID()}`;

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
			const providerId = `google-other-${randomUUID()}`;
			const otherUserEmail = `other-${randomUUID()}@example.com`;

			// Create another user
			const [otherUser] = await server.drizzleClient
				.insert(usersTable)
				.values({
					emailAddress: otherUserEmail,
					name: "Other User",
					passwordHash: "other-hash",
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
			const providerId = `google-unverified-${randomUUID()}`;
			const differentEmail = `different-${randomUUID()}@example.com`;

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
				"email address from your OAuth provider is different",
			);
		});
	});
});
