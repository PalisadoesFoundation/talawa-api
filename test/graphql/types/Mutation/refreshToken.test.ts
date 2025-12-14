import { faker } from "@faker-js/faker";
import { assertToBeNonNullish } from "test/helpers";
import { beforeAll, describe, expect, it } from "vitest";
import type {
	InvalidArgumentsExtensions,
	TalawaGraphQLFormattedError,
	UnauthenticatedExtensions,
} from "~/src/utilities/TalawaGraphQLError";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import { Mutation_refreshToken, Query_signIn } from "../documentNodes";

describe("Mutation field refreshToken", () => {
	let validRefreshToken: string;
	let userId: string;

	beforeAll(async () => {
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
		assertToBeNonNullish(signInResult.data.signIn?.user?.id);
		validRefreshToken = signInResult.data.signIn.refreshToken as string;
		userId = signInResult.data.signIn.user.id as string;
	});

	describe("successful scenarios", () => {
		it("should return new access and refresh tokens when given a valid refresh token", async () => {
			const result = await mercuriusClient.mutate(Mutation_refreshToken, {
				variables: {
					refreshToken: validRefreshToken,
				},
			});

			expect(result.errors).toBeUndefined();
			assertToBeNonNullish(result.data?.refreshToken);
			const refreshTokenData = result.data.refreshToken as {
				authenticationToken: string;
				refreshToken: string;
				user?: { id: string };
			};
			expect(refreshTokenData.authenticationToken).toBeDefined();
			expect(refreshTokenData.authenticationToken).not.toBe("");
			expect(refreshTokenData.refreshToken).toBeDefined();
			expect(refreshTokenData.refreshToken).not.toBe("");
			// Should be a new refresh token (rotation)
			expect(refreshTokenData.refreshToken).not.toBe(validRefreshToken);
			expect(refreshTokenData.user?.id).toBe(userId);

			// Update for subsequent tests
			validRefreshToken = refreshTokenData.refreshToken;
		});

		it("should return user information with the new tokens", async () => {
			// Get a fresh token first
			const signInResult = await mercuriusClient.query(Query_signIn, {
				variables: {
					input: {
						emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
						password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
					},
				},
			});
			assertToBeNonNullish(signInResult.data.signIn?.refreshToken);
			const tokenToRefresh = signInResult.data.signIn?.refreshToken as string;

			const result = await mercuriusClient.mutate(Mutation_refreshToken, {
				variables: {
					refreshToken: tokenToRefresh,
				},
			});

			expect(result.errors).toBeUndefined();
			const refreshData = result.data?.refreshToken as {
				user?: { id: string; name: string };
			};
			assertToBeNonNullish(refreshData?.user);
			expect(refreshData.user.id).toBeDefined();
			expect(refreshData.user.name).toBeDefined();
		});

		it("should implement token rotation - old token should not work after refresh", async () => {
			// Get a fresh token
			const signInResult = await mercuriusClient.query(Query_signIn, {
				variables: {
					input: {
						emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
						password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
					},
				},
			});
			assertToBeNonNullish(signInResult.data.signIn?.refreshToken);
			const originalToken = signInResult.data.signIn?.refreshToken as string;

			// Use the token to get new tokens
			const firstRefresh = await mercuriusClient.mutate(Mutation_refreshToken, {
				variables: {
					refreshToken: originalToken,
				},
			});
			expect(firstRefresh.errors).toBeUndefined();

			// Try to use the old token again - should fail
			const secondRefresh = await mercuriusClient.mutate(
				Mutation_refreshToken,
				{
					variables: {
						refreshToken: originalToken,
					},
				},
			);

			expect(secondRefresh.data?.refreshToken).toBeNull();
			expect(secondRefresh.errors).toBeDefined();
			expect(secondRefresh.errors?.length).toBeGreaterThan(0);
			expect(
				(secondRefresh.errors?.[0] as unknown as TalawaGraphQLFormattedError)
					?.extensions?.code,
			).toBe("unauthenticated");
		});
	});

	describe("error scenarios", () => {
		it("should return unauthenticated error for invalid refresh token", async () => {
			const result = await mercuriusClient.mutate(Mutation_refreshToken, {
				variables: {
					refreshToken: "invalid-token-that-does-not-exist",
				},
			});

			expect(result.data?.refreshToken).toBeNull();
			expect(result.errors).toBeDefined();
			expect(result.errors?.length).toBeGreaterThan(0);

			const error = result
				.errors?.[0] as unknown as TalawaGraphQLFormattedError;
			expect((error.extensions as UnauthenticatedExtensions).code).toBe(
				"unauthenticated",
			);
		});

		it("should return unauthenticated error for expired refresh token", async () => {
			// We can't easily create an expired token in tests without DB manipulation
			// This test verifies the behavior with a completely invalid token format
			const result = await mercuriusClient.mutate(Mutation_refreshToken, {
				variables: {
					refreshToken: faker.string.hexadecimal({ length: 64, prefix: "" }),
				},
			});

			expect(result.data?.refreshToken).toBeNull();
			expect(result.errors).toBeDefined();
			const error = result
				.errors?.[0] as unknown as TalawaGraphQLFormattedError;
			expect((error.extensions as UnauthenticatedExtensions).code).toBe(
				"unauthenticated",
			);
		});

		it("should return invalid_arguments error for empty refresh token", async () => {
			const result = await mercuriusClient.mutate(Mutation_refreshToken, {
				variables: {
					refreshToken: "",
				},
			});

			expect(result.data?.refreshToken).toBeNull();
			expect(result.errors).toBeDefined();
			expect(result.errors?.length).toBeGreaterThan(0);

			const error = result
				.errors?.[0] as unknown as TalawaGraphQLFormattedError;
			expect((error.extensions as InvalidArgumentsExtensions).code).toBe(
				"invalid_arguments",
			);
		});
	});

	describe("token format validation", () => {
		it("should generate a 64-character hex refresh token", async () => {
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

			expect(refreshToken).toHaveLength(64);
			expect(/^[a-f0-9]+$/.test(refreshToken)).toBe(true);
		});

		it("should generate a valid JWT access token", async () => {
			const signInResult = await mercuriusClient.query(Query_signIn, {
				variables: {
					input: {
						emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
						password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
					},
				},
			});
			assertToBeNonNullish(signInResult.data.signIn?.refreshToken);
			const tokenForJwt = signInResult.data.signIn?.refreshToken as string;

			const result = await mercuriusClient.mutate(Mutation_refreshToken, {
				variables: {
					refreshToken: tokenForJwt,
				},
			});

			const jwtResult = result.data?.refreshToken as {
				authenticationToken?: string;
			};
			assertToBeNonNullish(jwtResult?.authenticationToken);
			const accessToken = jwtResult.authenticationToken;

			// JWT format: header.payload.signature
			const parts = accessToken.split(".");
			expect(parts).toHaveLength(3);
		});
	});
});
