import { faker } from "@faker-js/faker";
import { assertToBeNonNullish } from "test/helpers";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type {
	InvalidArgumentsExtensions,
	TalawaGraphQLFormattedError,
	UnauthenticatedExtensions,
} from "~/src/utilities/TalawaGraphQLError";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	Mutation_refreshToken,
	Mutation_revokeRefreshToken,
	Query_signIn,
} from "../documentNodes";

describe("Mutation field revokeRefreshToken", () => {
	describe("successful scenarios", () => {
		it("should return true when revoking a valid refresh token", async () => {
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
			const refreshToken = signInResult.data.signIn.refreshToken;

			// Revoke the token
			const result = await mercuriusClient.mutate(Mutation_revokeRefreshToken, {
				variables: {
					refreshToken: refreshToken,
				},
			});

			expect(result.errors).toBeUndefined();
			expect(result.data?.revokeRefreshToken).toBe(true);
		});

		it("should prevent using a revoked token to get new access tokens", async () => {
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
			const refreshToken = signInResult.data.signIn.refreshToken;

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
			const refreshResult = await mercuriusClient.mutate(Mutation_refreshToken, {
				variables: {
					refreshToken: refreshToken,
				},
			});

			expect(refreshResult.data?.refreshToken).toBeNull();
			expect(refreshResult.errors).toBeDefined();
			expect(refreshResult.errors?.length).toBeGreaterThan(0);
			expect(
				(refreshResult.errors?.[0] as TalawaGraphQLFormattedError)?.extensions
					?.code,
			).toBe("unauthenticated");
		});

		it("should return false for non-existent token (prevents timing attacks)", async () => {
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

		it("should return false when revoking an already revoked token", async () => {
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
			const refreshToken = signInResult.data.signIn.refreshToken;

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

	describe("error scenarios", () => {
		it("should return invalid_arguments error for empty refresh token", async () => {
			const result = await mercuriusClient.mutate(Mutation_revokeRefreshToken, {
				variables: {
					refreshToken: "",
				},
			});

			expect(result.data?.revokeRefreshToken).toBeNull();
			expect(result.errors).toBeDefined();
			expect(result.errors?.length).toBeGreaterThan(0);

			const error = result.errors?.[0] as TalawaGraphQLFormattedError;
			expect(
				(error.extensions as InvalidArgumentsExtensions).code,
			).toBe("invalid_arguments");
		});
	});

	describe("logout functionality", () => {
		it("should effectively logout user by revoking their refresh token", async () => {
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
			const refreshToken = signInResult.data.signIn.refreshToken;

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
			const refreshResult = await mercuriusClient.mutate(Mutation_refreshToken, {
				variables: {
					refreshToken: refreshToken,
				},
			});

			expect(refreshResult.data?.refreshToken).toBeNull();
			expect(refreshResult.errors).toBeDefined();
		});
	});

	describe("security considerations", () => {
		it("should not leak information about token existence via response time", async () => {
			// This is a conceptual test - both existing and non-existing tokens
			// should return in similar time (no error thrown for non-existent)

			// Non-existent token
			const result1 = await mercuriusClient.mutate(Mutation_revokeRefreshToken, {
				variables: {
					refreshToken: "aaaa" + faker.string.hexadecimal({ length: 60, prefix: "" }),
				},
			});

			// Another non-existent token
			const result2 = await mercuriusClient.mutate(Mutation_revokeRefreshToken, {
				variables: {
					refreshToken: "bbbb" + faker.string.hexadecimal({ length: 60, prefix: "" }),
				},
			});

			// Both should return false without errors (consistent response)
			expect(result1.errors).toBeUndefined();
			expect(result2.errors).toBeUndefined();
			expect(result1.data?.revokeRefreshToken).toBe(false);
			expect(result2.data?.revokeRefreshToken).toBe(false);
		});
	});
});
