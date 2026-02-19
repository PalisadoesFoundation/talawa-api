import { faker } from "@faker-js/faker";
import { hash } from "@node-rs/argon2";
import { eq } from "drizzle-orm";
import { initGraphQLTada } from "gql.tada";
import { afterEach, beforeEach, expect, suite, test, vi } from "vitest";
import { oauthAccountsTable } from "~/src/drizzle/tables/oauthAccount";
import { usersTable } from "~/src/drizzle/tables/users";
import type { ClientCustomScalars } from "~/src/graphql/scalars/index";
import { COOKIE_NAMES } from "~/src/utilities/cookieConfig";
import { assertToBeNonNullish } from "../../../helpers";
import { getAdminAuthViaRest } from "../../../helpers/adminAuthRest";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import { Query_currentUser } from "../documentNodes";
import type { introspection } from "../gql.tada";

const gql = initGraphQLTada<{
	introspection: introspection;
	scalars: ClientCustomScalars;
}>();

const Query_UserOAuthAccounts = gql(`
  query UserOAuthAccounts($input: QueryUserInput!) {
    user(input: $input) {
      oauthAccounts {
        provider
        email
        linkedAt
        lastUsedAt
      }
    }
  }
`);

suite("User field oauthAccounts", () => {
	let testUser: typeof usersTable.$inferSelect;
	let testUserToken: string;
	let otherUser: typeof usersTable.$inferSelect;

	beforeEach(async () => {
		// Create first test user
		const testEmail = `oauth-test-${faker.string.uuid()}@example.com`;
		const testPassword = "testPassword123";
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

		// Sign in as test user via REST to get auth token
		const signInResponse = await server.inject({
			method: "POST",
			url: "/auth/signin",
			payload: { email: testEmail, password: testPassword },
		});
		if (signInResponse.statusCode !== 200) {
			throw new Error(
				`Failed to sign in test user: ${signInResponse.statusCode} ${signInResponse.body}`,
			);
		}
		const accessCookie = signInResponse.cookies.find(
			(c) => c.name === COOKIE_NAMES.ACCESS_TOKEN,
		);
		if (!accessCookie?.value) {
			throw new Error("REST sign-in did not set access token cookie");
		}
		testUserToken = accessCookie.value;

		// Create second test user (for cross-user access tests)
		const otherEmail = `oauth-other-${faker.string.uuid()}@example.com`;
		const otherPassword = "otherPassword123";
		const otherPasswordHash = await hash(otherPassword);

		const [createdOtherUser] = await server.drizzleClient
			.insert(usersTable)
			.values({
				emailAddress: otherEmail,
				name: "Other User",
				passwordHash: otherPasswordHash,
				role: "regular",
				isEmailAddressVerified: true,
			})
			.returning();

		if (!createdOtherUser) {
			throw new Error("Failed to create other test user");
		}

		otherUser = createdOtherUser;
	});

	afterEach(async () => {
		vi.restoreAllMocks();
		// Cleanup OAuth accounts
		if (testUser) {
			await server.drizzleClient
				.delete(oauthAccountsTable)
				.where(eq(oauthAccountsTable.userId, testUser.id));
		}
		if (otherUser) {
			await server.drizzleClient
				.delete(oauthAccountsTable)
				.where(eq(oauthAccountsTable.userId, otherUser.id));
		}

		// Cleanup users
		if (testUser) {
			await server.drizzleClient
				.delete(usersTable)
				.where(eq(usersTable.id, testUser.id));
		}
		if (otherUser) {
			await server.drizzleClient
				.delete(usersTable)
				.where(eq(usersTable.id, otherUser.id));
		}
	});

	test("returns empty array for authenticated user", async () => {
		const { accessToken: adminToken } = await getAdminAuthViaRest(server);
		const currentUserResult = await mercuriusClient.query(Query_currentUser, {
			headers: { authorization: `bearer ${adminToken}` },
		});
		assertToBeNonNullish(currentUserResult.data?.currentUser?.id);
		const adminUserId = currentUserResult.data.currentUser.id;

		const res = await mercuriusClient.query(Query_UserOAuthAccounts, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: {
				input: {
					id: adminUserId,
				},
			},
		});

		expect(res.errors).toBeUndefined();
		expect(res.data.user?.oauthAccounts).toEqual([]);
	});

	test("throws error when user is not authenticated", async () => {
		const res = await mercuriusClient.query(Query_UserOAuthAccounts, {
			// No authorization header
			variables: {
				input: {
					id: testUser.id,
				},
			},
		});

		expect(res.errors).toBeDefined();
		expect(res.errors?.[0]?.extensions?.code).toBe("unauthenticated");
	});

	test("throws error when user tries to access another user's OAuth accounts", async () => {
		const res = await mercuriusClient.query(Query_UserOAuthAccounts, {
			headers: { authorization: `bearer ${testUserToken}` },
			variables: {
				input: {
					id: otherUser.id, // Trying to access other user's accounts
				},
			},
		});

		expect(res.errors).toBeDefined();
		expect(res.errors?.[0]?.extensions?.code).toBe("unauthorized_action");
		expect(res.errors?.[0]?.message).toBe(
			"You can only view your own OAuth accounts.",
		);
	});

	test("returns OAuth accounts for authenticated user with linked accounts", async () => {
		const linkedAt = new Date("2024-01-01T00:00:00Z");
		const lastUsedAt = new Date("2024-01-02T00:00:00Z");

		// Create OAuth accounts for the test user
		await server.drizzleClient.insert(oauthAccountsTable).values([
			{
				userId: testUser.id,
				provider: "google",
				providerId: "google-123",
				email: testUser.emailAddress,
				profile: { name: "Test User" },
				linkedAt: linkedAt,
				lastUsedAt: lastUsedAt,
			},
			{
				userId: testUser.id,
				provider: "github",
				providerId: "github-456",
				email: `github-${testUser.emailAddress}`,
				profile: { name: "Test User GitHub" },
				linkedAt: new Date("2024-01-03T00:00:00Z"),
				lastUsedAt: new Date("2024-01-04T00:00:00Z"),
			},
		]);

		const res = await mercuriusClient.query(Query_UserOAuthAccounts, {
			headers: { authorization: `bearer ${testUserToken}` },
			variables: {
				input: {
					id: testUser.id,
				},
			},
		});

		expect(res.errors).toBeUndefined();
		expect(res.data.user?.oauthAccounts).toHaveLength(2);

		const accounts = res.data.user?.oauthAccounts;

		// Find Google account
		const googleAccount = accounts?.find((acc) => acc.provider === "GOOGLE");
		expect(googleAccount).toBeDefined();
		expect(googleAccount?.email).toBe(testUser.emailAddress);
		expect(googleAccount?.linkedAt).toBe(linkedAt.toISOString());
		expect(googleAccount?.lastUsedAt).toBe(lastUsedAt.toISOString());

		// Find GitHub account
		const githubAccount = accounts?.find((acc) => acc.provider === "GITHUB");
		expect(githubAccount).toBeDefined();
		expect(githubAccount?.email).toBe(`github-${testUser.emailAddress}`);
		expect(githubAccount?.linkedAt).toBe("2024-01-03T00:00:00.000Z");
		expect(githubAccount?.lastUsedAt).toBe("2024-01-04T00:00:00.000Z");
	});

	test("correctly transforms provider names to uppercase", async () => {
		// Insert OAuth account with lowercase provider name
		await server.drizzleClient.insert(oauthAccountsTable).values({
			userId: testUser.id,
			provider: "google", // lowercase in database
			providerId: "test-provider-123",
			email: testUser.emailAddress,
			profile: { name: "Test User" },
			linkedAt: new Date("2024-06-01T00:00:00Z"),
			lastUsedAt: new Date("2024-06-02T00:00:00Z"),
		});

		const res = await mercuriusClient.query(Query_UserOAuthAccounts, {
			headers: { authorization: `bearer ${testUserToken}` },
			variables: {
				input: {
					id: testUser.id,
				},
			},
		});

		expect(res.errors).toBeUndefined();
		expect(res.data.user?.oauthAccounts).toHaveLength(1);
		expect(res.data.user?.oauthAccounts?.[0]?.provider).toBe("GOOGLE"); // Should be uppercase
	});

	test("returns empty string when OAuth account email is null", async () => {
		await server.drizzleClient.insert(oauthAccountsTable).values({
			userId: testUser.id,
			provider: "google",
			providerId: "google-null-email",
			email: null,
			profile: { name: "Test User" },
			linkedAt: new Date("2024-01-01T00:00:00Z"),
			lastUsedAt: new Date("2024-01-02T00:00:00Z"),
		});

		const res = await mercuriusClient.query(Query_UserOAuthAccounts, {
			headers: { authorization: `bearer ${testUserToken}` },
			variables: {
				input: {
					id: testUser.id,
				},
			},
		});

		expect(res.errors).toBeUndefined();
		expect(res.data.user?.oauthAccounts?.[0]?.email).toBe("");
	});

	test("throws error when unknown OAuth provider is encountered", async () => {
		// Insert OAuth account with unsupported provider
		await server.drizzleClient.insert(oauthAccountsTable).values({
			userId: testUser.id,
			provider: "facebook", // Unsupported provider
			providerId: "facebook-123",
			email: testUser.emailAddress,
			profile: { name: "Test User" },
			linkedAt: new Date("2024-01-01T00:00:00Z"),
			lastUsedAt: new Date("2024-01-02T00:00:00Z"),
		});

		const res = await mercuriusClient.query(Query_UserOAuthAccounts, {
			headers: { authorization: `bearer ${testUserToken}` },
			variables: {
				input: {
					id: testUser.id,
				},
			},
		});

		expect(res.errors).toBeDefined();
		expect(res.errors?.[0]?.extensions?.code).toBe("unexpected");
		expect(res.errors?.[0]?.message).toBe("Unknown OAuth provider: facebook");
	});
});
