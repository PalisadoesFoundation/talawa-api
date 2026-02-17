import { expect, suite, test } from "vitest";
import { mercuriusClient } from "./client";

const DEPRECATION_INTROSPECTION_QUERY = `
	query DeprecationIntrospection {
		__schema {
			types {
				name
				fields {
					name
					deprecationReason
				}
			}
		}
	}
`;

suite("GraphQL signIn/signUp deprecation (introspection)", () => {
	test("signIn and signUp fields expose deprecationReason via schema introspection", async () => {
		const result = await mercuriusClient.query(DEPRECATION_INTROSPECTION_QUERY);

		expect(result.errors).toBeUndefined();
		expect(result.data?.__schema?.types).toBeDefined();

		const types = result.data?.__schema?.types as
			| Array<{
					fields?: Array<{ name: string; deprecationReason?: string | null }>;
					name: string;
			  }>
			| undefined;
		expect(types).toBeDefined();
		expect(Array.isArray(types)).toBe(true);

		const queryType = types?.find((t) => t.name === "Query");
		const mutationType = types?.find((t) => t.name === "Mutation");

		expect(queryType).toBeDefined();
		expect(queryType?.fields).toBeDefined();
		const signInField = queryType?.fields?.find((f) => f.name === "signIn");
		expect(signInField).toBeDefined();
		expect(signInField?.deprecationReason).toBe("Use REST POST /auth/signin");

		expect(mutationType).toBeDefined();
		expect(mutationType?.fields).toBeDefined();
		const signUpField = mutationType?.fields?.find((f) => f.name === "signUp");
		expect(signUpField).toBeDefined();
		expect(signUpField?.deprecationReason).toBe("Use REST POST /auth/signup");
	});
});
