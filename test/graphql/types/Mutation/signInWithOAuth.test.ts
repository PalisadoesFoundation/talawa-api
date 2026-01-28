import { initGraphQLTada } from "gql.tada";
import { expect, suite, test } from "vitest";
import type { ClientCustomScalars } from "~/src/graphql/scalars/index";
import { mercuriusClient } from "../client";
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
        }
    }
}`);

suite("Mutation signInWithOAuth", () => {
	test("signInWithOAuth throws 'unexpected' error since mutation is not yet implemented", async () => {
		const res = await mercuriusClient.mutate(Mutation_signInWithOAuth, {
			variables: {
				input: {
					provider: "GOOGLE",
					authorizationCode: "test-auth-code",
					redirectUri: "http://localhost:3000/callback",
				},
			},
		});

		expect(res.errors).toBeDefined();
		expect(res.errors?.[0]?.extensions?.code).toBe("unexpected");
		expect(res.errors?.[0]?.message).toBe(
			"signInWithOAuth mutation is not yet implemented.",
		);
	});

	test("signInWithOAuth with GITHUB provider throws 'unexpected' error", async () => {
		const res = await mercuriusClient.mutate(Mutation_signInWithOAuth, {
			variables: {
				input: {
					provider: "GITHUB",
					authorizationCode: "github-auth-code",
					redirectUri: "http://localhost:3000/callback",
				},
			},
		});

		expect(res.errors).toBeDefined();
		expect(res.errors?.[0]?.extensions?.code).toBe("unexpected");
		expect(res.errors?.[0]?.message).toBe(
			"signInWithOAuth mutation is not yet implemented.",
		);
	});
});
