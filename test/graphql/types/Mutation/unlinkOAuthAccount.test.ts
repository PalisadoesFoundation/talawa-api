import { faker } from "@faker-js/faker";
import { eq } from "drizzle-orm";
import { initGraphQLTada } from "gql.tada";
import { afterEach, expect, suite, test } from "vitest";
import { oauthAccountsTable } from "~/src/drizzle/tables/oauthAccount";
import { usersTable } from "~/src/drizzle/tables/users";
import type { ClientCustomScalars } from "~/src/graphql/scalars/index";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	Mutation_createUser,
	Mutation_deleteUser,
	Query_signIn,
} from "../documentNodes";
import type { introspection } from "../gql.tada";

const gql = initGraphQLTada<{
	introspection: introspection;
	scalars: ClientCustomScalars;
}>();

export const Mutation_unlinkOAuthAccount =
	gql(`mutation Mutation_unlinkOAuthAccount($provider: OAuthProvider!) {
    unlinkOAuthAccount(provider: $provider) {
        id
        name
        emailAddress
    }
}`);

suite("Mutation unlinkOAuthAccount", () => {
	const cleanupFns: Array<() => Promise<void>> = [];

	afterEach(async () => {
		for (const fn of cleanupFns.reverse()) {
			try {
				await fn();
			} catch (err) {
				console.error("cleanup failed:", err);
			}
		}
		cleanupFns.length = 0;
	});

	test("unlinkOAuthAccount successfully unlinks a provider", async () => {
		// 1. Create admin and regular user
		const adminRes = await mercuriusClient.query(Query_signIn, {
			variables: {
				input: {
					emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
					password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
				},
			},
		});
		assertToBeNonNullish(adminRes.data?.signIn?.authenticationToken);
		const adminToken = adminRes.data.signIn.authenticationToken as string;

		const userRes = await mercuriusClient.mutate(Mutation_createUser, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: {
				input: {
					emailAddress: `${faker.string.uuid()}@test.com`,
					name: faker.person.fullName(),
					password: "password123",
					role: "regular",
					isEmailAddressVerified: false,
				},
			},
		});
		assertToBeNonNullish(userRes.data?.createUser);
		const user = userRes.data.createUser;
		assertToBeNonNullish(user.user?.id);
		const userId = user.user.id;
		const userToken = user.authenticationToken;

		cleanupFns.push(async () => {
			await mercuriusClient.mutate(Mutation_deleteUser, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: { input: { id: userId } },
			});
		});

		// 2. Add an OAuth account directly to DB
		await server.drizzleClient.insert(oauthAccountsTable).values({
			userId: userId,
			provider: "GOOGLE",
			providerId: "google-123",
			email: "google@test.com",
			linkedAt: new Date(),
			lastUsedAt: new Date(),
		});

		// 3. Unlink
		const res = await mercuriusClient.mutate(Mutation_unlinkOAuthAccount, {
			headers: { authorization: `bearer ${userToken}` },
			variables: {
				provider: "GOOGLE",
			},
		});

		// 4. Verify Success
		expect(res.errors).toBeUndefined();
		expect(res.data?.unlinkOAuthAccount?.id).toBe(userId);

		// Check DB to ensure it's gone
		const accounts = await server.drizzleClient
			.select()
			.from(oauthAccountsTable)
			.where(eq(oauthAccountsTable.userId, userId));
		expect(accounts.length).toBe(0);
	});

	test("unlinkOAuthAccount throws error when provider not found", async () => {
		const adminRes = await mercuriusClient.query(Query_signIn, {
			variables: {
				input: {
					emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
					password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
				},
			},
		});
		const adminToken = adminRes.data?.signIn?.authenticationToken as string;

		const userRes = await mercuriusClient.mutate(Mutation_createUser, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: {
				input: {
					emailAddress: `${faker.string.uuid()}@test.com`,
					name: faker.person.fullName(),
					password: "password123",
					role: "regular",
					isEmailAddressVerified: false,
				},
			},
		});
		const userId = userRes.data?.createUser?.user?.id;
		const userToken = userRes.data?.createUser?.authenticationToken;
		assertToBeNonNullish(userId);

		cleanupFns.push(async () => {
			await mercuriusClient.mutate(Mutation_deleteUser, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: { input: { id: userId } },
			});
		});

		const res = await mercuriusClient.mutate(Mutation_unlinkOAuthAccount, {
			headers: { authorization: `bearer ${userToken}` },
			variables: {
				provider: "GITHUB", // Not linked
			},
		});

		expect(res.errors).toBeDefined();
		expect(res.errors?.[0]?.extensions?.code).toBe("not_found");
	});

	test("unlinkOAuthAccount throws error if unlinking last auth method", async () => {
		// Setup user
		const adminRes = await mercuriusClient.query(Query_signIn, {
			variables: {
				input: {
					emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
					password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
				},
			},
		});
		const adminToken = adminRes.data?.signIn?.authenticationToken as string;

		const userRes = await mercuriusClient.mutate(Mutation_createUser, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: {
				input: {
					emailAddress: `${faker.string.uuid()}@test.com`,
					name: faker.person.fullName(),
					password: "password123",
					role: "regular",
					isEmailAddressVerified: false,
				},
			},
		});
		const userId = userRes.data?.createUser?.user?.id;
		const userToken = userRes.data?.createUser?.authenticationToken;
		assertToBeNonNullish(userId);

		cleanupFns.push(async () => {
			await mercuriusClient.mutate(Mutation_deleteUser, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: { input: { id: userId } },
			});
		});

		// Add OAuth account
		await server.drizzleClient.insert(oauthAccountsTable).values({
			userId: userId,
			provider: "GOOGLE",
			providerId: "google-123",
			email: "google@test.com",
			linkedAt: new Date(),
			lastUsedAt: new Date(),
		});

		// REMOVE PASSWORD manually to simulate OAuth-only user
		await server.drizzleClient
			.update(usersTable)
			.set({ passwordHash: "" })
			.where(eq(usersTable.id, userId));

		// Attempt Unlink
		const res = await mercuriusClient.mutate(Mutation_unlinkOAuthAccount, {
			headers: { authorization: `bearer ${userToken}` },
			variables: {
				provider: "GOOGLE",
			},
		});

		expect(res.errors).toBeDefined();
		expect(res.errors?.[0]?.extensions?.code).toBe("forbidden_action");
		expect(res.errors?.[0]?.message).toContain("last authentication method");
	});

	test("unlinkOAuthAccount requires authentication", async () => {
		const res = await mercuriusClient.mutate(Mutation_unlinkOAuthAccount, {
			variables: {
				provider: "GITHUB",
			},
		});

		expect(res.errors).toBeDefined();
		expect(res.errors?.[0]?.extensions?.code).toBe("unauthenticated");
	});

	test("unlinkOAuthAccount successfully unlinks when user has no password but multiple OAuth accounts", async () => {
		// 1. Create user
		const adminRes = await mercuriusClient.query(Query_signIn, {
			variables: {
				input: {
					emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
					password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
				},
			},
		});
		const adminToken = adminRes.data?.signIn?.authenticationToken as string;

		const userRes = await mercuriusClient.mutate(Mutation_createUser, {
			headers: { authorization: `bearer ${adminToken}` },
			variables: {
				input: {
					emailAddress: `${faker.string.uuid()}@test.com`,
					name: faker.person.fullName(),
					password: "password123",
					role: "regular",
					isEmailAddressVerified: false,
				},
			},
		});
		const userId = userRes.data?.createUser?.user?.id;
		const userToken = userRes.data?.createUser?.authenticationToken;
		assertToBeNonNullish(userId);

		cleanupFns.push(async () => {
			await mercuriusClient.mutate(Mutation_deleteUser, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: { input: { id: userId } },
			});
		});

		// 2. Add TWO OAuth accounts
		await server.drizzleClient.insert(oauthAccountsTable).values([
			{
				userId: userId,
				provider: "GOOGLE",
				providerId: "google-123",
				email: "google@test.com",
				linkedAt: new Date(),
				lastUsedAt: new Date(),
			},
			{
				userId: userId,
				provider: "GITHUB",
				providerId: "github-456",
				email: "github@test.com",
				linkedAt: new Date(),
				lastUsedAt: new Date(),
			},
		]);

		// 3. REMOVE PASSWORD
		await server.drizzleClient
			.update(usersTable)
			.set({ passwordHash: "" })
			.where(eq(usersTable.id, userId));

		// 4. Attempt Unlink of ONE account (GOOGLE)
		const res = await mercuriusClient.mutate(Mutation_unlinkOAuthAccount, {
			headers: { authorization: `bearer ${userToken}` },
			variables: {
				provider: "GOOGLE",
			},
		});

		// 5. Verify Success
		expect(res.errors).toBeUndefined();
		expect(res.data?.unlinkOAuthAccount?.id).toBe(userId);

		// Verify GOOGLE is gone but GITHUB remains
		const accounts = await server.drizzleClient
			.select()
			.from(oauthAccountsTable)
			.where(eq(oauthAccountsTable.userId, userId));

		expect(accounts.length).toBe(1);
		expect(accounts[0]?.provider).toBe("GITHUB");
	});
});
