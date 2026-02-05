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

	beforeEach(async () => {
		// Create mock provider
		mockProvider = {
			getProviderName: vi.fn().mockReturnValue("google"),
			exchangeCodeForTokens: vi.fn(),
			getUserProfile: vi.fn(),
		};

		// Spy on registry methods instead of replacing the entire object
		vi.spyOn(server.oauthProviderRegistry, "get").mockReturnValue(mockProvider);
		vi.spyOn(server.oauthProviderRegistry, "has").mockReturnValue(true);
		vi.spyOn(server.oauthProviderRegistry, "listProviders").mockReturnValue([
			"google",
		]);
		vi.spyOn(server.oauthProviderRegistry, "register").mockImplementation(
			() => {},
		);
		vi.spyOn(server.oauthProviderRegistry, "unregister").mockImplementation(
			() => {},
		);
		vi.spyOn(server.oauthProviderRegistry, "clear").mockImplementation(
			() => {},
		);

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
		// Restore all mocks
		vi.restoreAllMocks();

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
			// Temporarily override the registry property to make it undefined
			const originalRegistry = server.oauthProviderRegistry;
			Object.defineProperty(server, "oauthProviderRegistry", {
				value: undefined,
				configurable: true,
				writable: true,
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
			expect(res.errors?.[0]?.extensions?.code).toBe("unexpected");
			expect(res.errors?.[0]?.message).toContain(
				"OAuth authentication is not available",
			);

			// Restore the registry
			Object.defineProperty(server, "oauthProviderRegistry", {
				value: originalRegistry,
				configurable: true,
				writable: true,
			});
		});

		test("should throw error when OAuth provider is not enabled", async () => {
			// Mock registry.get to throw error when getting provider
			vi.spyOn(server.oauthProviderRegistry, "get").mockImplementation(() => {
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
				email: testUser.emailAddress,
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
				"email address from your OAuth provider is different",
			);
		});
	});
});
