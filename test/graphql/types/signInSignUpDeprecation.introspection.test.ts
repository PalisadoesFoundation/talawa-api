/**
 * Introspection tests for GraphQL signIn/signUp deprecation.
 * Uses shared server (test/server.ts) per project convention for test/graphql/types/.
 * Read-only: no mutable state, no cleanup required.
 */
import { afterEach, beforeEach, expect, suite, test } from "vitest";
import { mercuriusClient } from "./client";

const DEPRECATION_INTROSPECTION_QUERY = `
	query DeprecationIntrospection {
		__schema {
			queryType {
				fields(includeDeprecated: true) {
					name
					deprecationReason
				}
			}
			mutationType {
				fields(includeDeprecated: true) {
					name
					deprecationReason
				}
			}
		}
	}
`;

suite("GraphQL signIn/signUp deprecation (introspection)", () => {
	beforeEach(() => {
		// No setup required: test is read-only introspection.
	});

	afterEach(() => {
		// No teardown required: test does not mutate server or shared state.
	});

	test("signIn and signUp fields expose deprecationReason via schema introspection", async () => {
		const result = await mercuriusClient.query(DEPRECATION_INTROSPECTION_QUERY);

		expect(result.errors).toBeUndefined();
		expect(result.data?.__schema).toBeDefined();

		const queryType = result.data?.__schema?.queryType as
			| { fields?: Array<{ name: string; deprecationReason?: string | null }> }
			| undefined;
		const mutationType = result.data?.__schema?.mutationType as
			| { fields?: Array<{ name: string; deprecationReason?: string | null }> }
			| undefined;

		expect(queryType?.fields).toBeDefined();
		const signInField = queryType?.fields?.find((f) => f.name === "signIn");
		expect(signInField).toBeDefined();
		expect(signInField?.deprecationReason).toBe("Use REST POST /auth/signin");

		expect(mutationType?.fields).toBeDefined();
		const signUpField = mutationType?.fields?.find((f) => f.name === "signUp");
		expect(signUpField).toBeDefined();
		expect(signUpField?.deprecationReason).toBe("Use REST POST /auth/signup");
	});
});
