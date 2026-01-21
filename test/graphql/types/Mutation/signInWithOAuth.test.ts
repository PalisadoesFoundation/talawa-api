import { expect, suite, test } from "vitest";
import { mercuriusClient } from "../client";
import { Mutation_signInWithOAuth } from "../documentNodes";

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
