import { faker } from "@faker-js/faker";
import { initGraphQLTada } from "gql.tada";
import { afterEach, expect, suite, test } from "vitest";
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
        oauthAccounts {
            provider
            email
            linkedAt
            lastUsedAt
        }
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

	test("unlinkOAuthAccount throws 'unexpected' error since mutation is not yet implemented", async () => {
		// Sign in as admin to get auth token
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

		// Create a test user
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
		assertToBeNonNullish(user.user);
		assertToBeNonNullish(user.user.id);
		const userId = user.user.id;
		cleanupFns.push(async () => {
			await mercuriusClient.mutate(Mutation_deleteUser, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: { input: { id: userId } },
			});
		});

		// Try to unlink OAuth account
		const res = await mercuriusClient.mutate(Mutation_unlinkOAuthAccount, {
			headers: { authorization: `bearer ${user.authenticationToken}` },
			variables: {
				provider: "GOOGLE",
			},
		});

		expect(res.errors).toBeDefined();
		expect(res.errors?.[0]?.extensions?.code).toBe("unexpected");
		expect(res.errors?.[0]?.message).toBe(
			"unlinkOAuthAccount mutation is not yet implemented.",
		);
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
});
