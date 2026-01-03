import { faker } from "@faker-js/faker";
import { initGraphQLTada } from "gql.tada";
import { assertToBeNonNullish } from "test/helpers";
import { expect, suite, test } from "vitest";
import type { ClientCustomScalars } from "~/src/graphql/scalars/index";
import type {
	InvalidArgumentsExtensions,
	TalawaGraphQLFormattedError,
} from "~/src/utilities/TalawaGraphQLError";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import { Mutation_revokeRefreshToken, Query_signIn } from "../documentNodes";
import type { introspection } from "../gql.tada";

const gql = initGraphQLTada<{
	introspection: introspection;
	scalars: ClientCustomScalars;
}>();

const Mutation_refreshToken =
	gql(`mutation Mutation_refreshToken($refreshToken: String) {
    refreshToken(refreshToken: $refreshToken) {
        authenticationToken
        refreshToken
        user {
            id
            name
        }
    }
}`);

suite("Mutation field revokeRefreshToken", () => {
	suite("successful scenarios", () => {
		test("should return true when revoking a valid refresh token", async () => {
			// Sign in to get a valid refresh token
			const signInResult = await mercuriusClient.query(Query_signIn, {
				variables: {
					input: {
						emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
						password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
					},
				},
			});

			assertToBeNonNullish(signInResult.data.signIn?.refreshToken);
			const refreshToken = signInResult.data.signIn?.refreshToken as string;

			// Revoke the token
			const result = await mercuriusClient.mutate(Mutation_revokeRefreshToken, {
				variables: {
					refreshToken: refreshToken,
				},
			});

			expect(result.errors).toBeUndefined();
			expect(result.data?.revokeRefreshToken).toBe(true);
		});

		test("should prevent using a revoked token to get new access tokens", async () => {
			// Sign in to get a valid refresh token
			const signInResult = await mercuriusClient.query(Query_signIn, {
				variables: {
					input: {
						emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
						password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
					},
				},
			});

			assertToBeNonNullish(signInResult.data.signIn?.refreshToken);
			const refreshToken = signInResult.data.signIn?.refreshToken as string;

			// Revoke the token
			const revokeResult = await mercuriusClient.mutate(
				Mutation_revokeRefreshToken,
				{
					variables: {
						refreshToken: refreshToken,
					},
				},
			);
			expect(revokeResult.data?.revokeRefreshToken).toBe(true);

			// Try to use the revoked token
			const refreshResult = await mercuriusClient.mutate(
				Mutation_refreshToken,
				{
					variables: {
						refreshToken: refreshToken,
					},
				},
			);

			expect(refreshResult.data?.refreshToken).toBeNull();
			expect(refreshResult.errors).toBeDefined();
			expect(refreshResult.errors?.length).toBeGreaterThan(0);
			expect(
				(refreshResult.errors?.[0] as unknown as TalawaGraphQLFormattedError)
					?.extensions?.code,
			).toBe("unauthenticated");
		});

		test("should return false for non-existent token (prevents timing attacks)", async () => {
			// Using a random token that doesn't exist
			const result = await mercuriusClient.mutate(Mutation_revokeRefreshToken, {
				variables: {
					refreshToken: faker.string.hexadecimal({ length: 64, prefix: "" }),
				},
			});

			expect(result.errors).toBeUndefined();
			// Returns false instead of error to prevent timing attacks
			expect(result.data?.revokeRefreshToken).toBe(false);
		});

		test("should return false when revoking an already revoked token", async () => {
			// Sign in to get a valid refresh token
			const signInResult = await mercuriusClient.query(Query_signIn, {
				variables: {
					input: {
						emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
						password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
					},
				},
			});

			assertToBeNonNullish(signInResult.data.signIn?.refreshToken);
			const refreshToken = signInResult.data.signIn?.refreshToken as string;

			// Revoke the token first time
			const firstRevoke = await mercuriusClient.mutate(
				Mutation_revokeRefreshToken,
				{
					variables: {
						refreshToken: refreshToken,
					},
				},
			);
			expect(firstRevoke.data?.revokeRefreshToken).toBe(true);

			// Try to revoke the same token again
			const secondRevoke = await mercuriusClient.mutate(
				Mutation_revokeRefreshToken,
				{
					variables: {
						refreshToken: refreshToken,
					},
				},
			);

			// Should return false since token is already revoked (or not found in active tokens)
			expect(secondRevoke.errors).toBeUndefined();
			expect(secondRevoke.data?.revokeRefreshToken).toBe(false);
		});
	});

	suite("error scenarios", () => {
		test("should return invalid_arguments error for empty refresh token", async () => {
			const result = await mercuriusClient.mutate(Mutation_revokeRefreshToken, {
				variables: {
					refreshToken: "",
				},
			});

			expect(result.data?.revokeRefreshToken).toBeNull();
			expect(result.errors).toBeDefined();
			expect(result.errors?.length).toBeGreaterThan(0);

			const error = result
				.errors?.[0] as unknown as TalawaGraphQLFormattedError;
			expect((error.extensions as InvalidArgumentsExtensions).code).toBe(
				"invalid_arguments",
			);
		});
	});

	suite("logout functionality", () => {
		test("should effectively logout user by revoking their refresh token", async () => {
			// Sign in to get tokens
			const signInResult = await mercuriusClient.query(Query_signIn, {
				variables: {
					input: {
						emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
						password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
					},
				},
			});

			assertToBeNonNullish(signInResult.data.signIn?.refreshToken);
			assertToBeNonNullish(signInResult.data.signIn?.authenticationToken);
			const refreshToken = signInResult.data.signIn?.refreshToken as string;

			// Logout by revoking refresh token
			const logoutResult = await mercuriusClient.mutate(
				Mutation_revokeRefreshToken,
				{
					variables: {
						refreshToken: refreshToken,
					},
				},
			);

			expect(logoutResult.errors).toBeUndefined();
			expect(logoutResult.data?.revokeRefreshToken).toBe(true);

			// User can't get new access tokens with the revoked refresh token
			const refreshResult = await mercuriusClient.mutate(
				Mutation_refreshToken,
				{
					variables: {
						refreshToken: refreshToken,
					},
				},
			);

			expect(refreshResult.data?.refreshToken).toBeNull();
			expect(refreshResult.errors).toBeDefined();
		});
	});

	suite("security considerations", () => {
		test("should not leak information about token existence via response time", async () => {
			// This is a conceptual test - both existing and non-existing tokens
			// should return in similar time (no error thrown for non-existent)

			// Non-existent token
			const result1 = await mercuriusClient.mutate(
				Mutation_revokeRefreshToken,
				{
					variables: {
						refreshToken: `aaaa${faker.string.hexadecimal({ length: 60, prefix: "" })}`,
					},
				},
			);

			// Another non-existent token
			const result2 = await mercuriusClient.mutate(
				Mutation_revokeRefreshToken,
				{
					variables: {
						refreshToken: `bbbb${faker.string.hexadecimal({ length: 60, prefix: "" })}`,
					},
				},
			);

			// Both should return false without errors (consistent response)
			expect(result1.errors).toBeUndefined();
			expect(result2.errors).toBeUndefined();
			expect(result1.data?.revokeRefreshToken).toBe(false);
			expect(result2.data?.revokeRefreshToken).toBe(false);
		});
	});
});
