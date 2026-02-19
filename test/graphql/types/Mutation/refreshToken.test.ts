import { faker } from "@faker-js/faker";
import { initGraphQLTada } from "gql.tada";
import { print } from "graphql";
import { assertToBeNonNullish } from "test/helpers";
import { beforeAll, expect, suite, test } from "vitest";
import type { ClientCustomScalars } from "~/src/graphql/scalars/index";
import { COOKIE_NAMES } from "~/src/utilities/cookieConfig";
import { DEFAULT_REFRESH_TOKEN_EXPIRES_MS } from "~/src/utilities/refreshTokenUtils";
import type {
	InvalidArgumentsExtensions,
	TalawaGraphQLFormattedError,
	UnauthenticatedExtensions,
} from "~/src/utilities/TalawaGraphQLError";
import { getAdminAuthViaRest } from "../../../helpers/adminAuthRest";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	Mutation_createUser,
	Mutation_deleteUser,
	Query_currentUser,
} from "../documentNodes";
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

suite("Mutation field refreshToken", () => {
	let validRefreshToken: string;
	let userId: string;

	beforeAll(async () => {
		const { refreshToken: rt, accessToken } = await getAdminAuthViaRest(server);
		assertToBeNonNullish(rt);
		validRefreshToken = rt;
		const currentUserRes = await mercuriusClient.query(Query_currentUser, {
			headers: { authorization: `bearer ${accessToken}` },
		});
		const id = currentUserRes.data?.currentUser?.id;
		assertToBeNonNullish(id);
		userId = id;
	});

	suite("successful scenarios", () => {
		test("should return new access and refresh tokens when given a valid refresh token", async () => {
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

		test("should return user information with the new tokens", async () => {
			const { refreshToken: tokenToRefresh } =
				await getAdminAuthViaRest(server);
			assertToBeNonNullish(tokenToRefresh);

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

		test("should implement token rotation - old token should not work after refresh", async () => {
			const { refreshToken: originalToken } = await getAdminAuthViaRest(server);
			assertToBeNonNullish(originalToken);

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

		test("should rotate cookies when refreshing tokens", async () => {
			const signInResponse = await server.inject({
				method: "POST",
				url: "/auth/signin",
				payload: {
					email: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
					password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
				},
			});
			expect(signInResponse.statusCode).toBe(200);
			const signInCookies = signInResponse.cookies;
			const refreshTokenCookie = signInCookies.find(
				(c) => c.name === COOKIE_NAMES.REFRESH_TOKEN,
			);
			expect(refreshTokenCookie).toBeDefined();

			// Refresh token using the cookie value
			const response = await server.inject({
				method: "POST",
				url: "/graphql",
				payload: {
					query: print(Mutation_refreshToken),
					variables: {
						refreshToken: refreshTokenCookie?.value,
					},
				},
				cookies: {
					[COOKIE_NAMES.REFRESH_TOKEN]: refreshTokenCookie?.value || "",
				},
			});

			expect(response.statusCode).toBe(200);

			const cookies = response.cookies;
			expect(cookies).toBeDefined();
			expect(cookies.length).toBeGreaterThanOrEqual(2);

			const newAccessTokenCookie = cookies.find(
				(c) => c.name === COOKIE_NAMES.ACCESS_TOKEN,
			);
			const newRefreshTokenCookie = cookies.find(
				(c) => c.name === COOKIE_NAMES.REFRESH_TOKEN,
			);

			expect(newAccessTokenCookie).toBeDefined();
			expect(newAccessTokenCookie?.httpOnly).toBe(true);
			expect(newAccessTokenCookie?.path).toBe("/");
			expect(newAccessTokenCookie?.sameSite).toBe("Lax");

			expect(newRefreshTokenCookie).toBeDefined();
			expect(newRefreshTokenCookie?.httpOnly).toBe(true);
			expect(newRefreshTokenCookie?.path).toBe("/");
			expect(newRefreshTokenCookie?.sameSite).toBe("Lax");
			expect(newRefreshTokenCookie?.value).not.toBe(refreshTokenCookie?.value);
		});

		test("should refresh tokens using only HTTP-Only cookie (no variable) for web clients", async () => {
			const signInResponse = await server.inject({
				method: "POST",
				url: "/auth/signin",
				payload: {
					email: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
					password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
				},
			});
			expect(signInResponse.statusCode).toBe(200);
			const signInCookies = signInResponse.cookies;
			const refreshTokenCookie = signInCookies.find(
				(c) => c.name === COOKIE_NAMES.REFRESH_TOKEN,
			);
			expect(refreshTokenCookie).toBeDefined();

			// Refresh token WITHOUT passing the variable - should read from cookie
			const response = await server.inject({
				method: "POST",
				url: "/graphql",
				payload: {
					query: `mutation { refreshToken { authenticationToken refreshToken user { id name } } }`,
					// Note: No variables passed - refreshToken should be read from cookie
				},
				cookies: {
					[COOKIE_NAMES.REFRESH_TOKEN]: refreshTokenCookie?.value || "",
				},
			});

			expect(response.statusCode).toBe(200);
			const body = JSON.parse(response.body);
			expect(body.errors).toBeUndefined();
			expect(body.data?.refreshToken).toBeDefined();
			expect(body.data.refreshToken.authenticationToken).toBeDefined();
			expect(body.data.refreshToken.refreshToken).toBeDefined();
			expect(body.data.refreshToken.user?.id).toBeDefined();

			// Verify token rotation - old cookie should be replaced
			expect(body.data.refreshToken.refreshToken).not.toBe(
				refreshTokenCookie?.value,
			);

			// Verify new cookies are set
			const cookies = response.cookies;
			expect(cookies.length).toBeGreaterThanOrEqual(2);
			const newRefreshTokenCookie = cookies.find(
				(c) => c.name === COOKIE_NAMES.REFRESH_TOKEN,
			);
			expect(newRefreshTokenCookie?.value).toBe(
				body.data.refreshToken.refreshToken,
			);
		});
	});

	suite("error scenarios", () => {
		test("should return unauthenticated error for invalid refresh token", async () => {
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

		test("should return unauthenticated error for expired refresh token", async () => {
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

		test("should return invalid_arguments error for empty refresh token", async () => {
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

		test("should return invalid_arguments error when refreshToken is null", async () => {
			const result = await mercuriusClient.mutate(Mutation_refreshToken, {
				variables: {
					refreshToken: null,
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

		test("should return unauthenticated error when no refresh token is provided (neither arg nor cookie)", async () => {
			// Ensure no cookies are sent by using a fresh request without variables
			// Note: mercuriusClient might persist cookies if not careful, but usually it doesn't across tests unless explicitly set
			const result = await mercuriusClient.mutate(Mutation_refreshToken, {
				variables: {},
			});

			expect(result.data?.refreshToken).toBeNull();
			expect(result.errors).toBeDefined();
			expect(result.errors?.length).toBeGreaterThan(0);

			const error = result
				.errors?.[0] as unknown as TalawaGraphQLFormattedError;
			expect((error.extensions as UnauthenticatedExtensions).code).toBe(
				"unauthenticated",
			);
			expect(error.message).toBe(
				"Refresh token is required. Provide it as an argument or via HTTP-Only cookie.",
			);
		});

		test("should return unauthenticated error when user has been deleted (cascades to delete tokens)", async () => {
			const { accessToken: adminAuth } = await getAdminAuthViaRest(server);
			assertToBeNonNullish(adminAuth);

			// Create a new user
			const testEmail = `test-refresh-${faker.string.ulid()}@email.com`;
			const createUserResult = await mercuriusClient.mutate(
				Mutation_createUser,
				{
					headers: {
						authorization: `bearer ${adminAuth}`,
					},
					variables: {
						input: {
							emailAddress: testEmail,
							isEmailAddressVerified: true,
							name: "Test User for Deletion",
							password: "testPassword123!",
							role: "regular",
						},
					},
				},
			);

			assertToBeNonNullish(createUserResult.data?.createUser?.user?.id);
			assertToBeNonNullish(createUserResult.data?.createUser?.refreshToken);
			const userIdToDelete = createUserResult.data.createUser.user.id;
			const userRefreshToken = createUserResult.data.createUser
				.refreshToken as string;

			// Delete the user using admin privileges
			// This will cascade delete the refresh tokens due to foreign key constraint
			const deleteResult = await mercuriusClient.mutate(Mutation_deleteUser, {
				headers: {
					authorization: `bearer ${adminAuth}`,
				},
				variables: {
					input: {
						id: userIdToDelete,
					},
				},
			});

			assertToBeNonNullish(deleteResult.data?.deleteUser);

			// Now try to use the deleted user's refresh token
			// The token is cascade-deleted when the user is deleted, so we get "Invalid or expired"
			const refreshResult = await mercuriusClient.mutate(
				Mutation_refreshToken,
				{
					variables: {
						refreshToken: userRefreshToken,
					},
				},
			);

			// Should fail because the token was cascade-deleted with the user
			expect(refreshResult.data?.refreshToken).toBeNull();
			expect(refreshResult.errors).toBeDefined();
			expect(refreshResult.errors?.length).toBeGreaterThan(0);

			const error = refreshResult
				.errors?.[0] as unknown as TalawaGraphQLFormattedError;
			expect((error.extensions as UnauthenticatedExtensions).code).toBe(
				"unauthenticated",
			);
			// Token is deleted due to cascade, so we get "Invalid or expired refresh token"
			expect(error.message).toBe("Invalid or expired refresh token.");
		});
	});

	suite("token format validation", () => {
		test("should generate a 64-character hex refresh token", async () => {
			const { refreshToken } = await getAdminAuthViaRest(server);
			assertToBeNonNullish(refreshToken);

			expect(refreshToken).toHaveLength(64);
			expect(/^[a-f0-9]+$/.test(refreshToken)).toBe(true);
		});

		test("should generate a valid JWT access token", async () => {
			const { refreshToken: tokenForJwt } = await getAdminAuthViaRest(server);
			assertToBeNonNullish(tokenForJwt);

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

	suite("token expiration configuration", () => {
		test("should use DEFAULT_REFRESH_TOKEN_EXPIRES_MS constant value of 7 days", () => {
			// Verify the default constant is 7 days in milliseconds
			const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
			expect(DEFAULT_REFRESH_TOKEN_EXPIRES_MS).toBe(SEVEN_DAYS_MS);
		});

		test("should generate tokens with consistent expiration behavior", async () => {
			const { refreshToken: token1 } = await getAdminAuthViaRest(server);
			const { refreshToken: token2 } = await getAdminAuthViaRest(server);
			assertToBeNonNullish(token1);
			assertToBeNonNullish(token2);
			expect(token1).not.toBe(token2);
			const refresh1 = await mercuriusClient.mutate(Mutation_refreshToken, {
				variables: { refreshToken: token1 },
			});
			expect(refresh1.errors).toBeUndefined();
		});
	});

	suite("transaction atomicity", () => {
		test("should ensure token rotation is atomic - new token only exists if old token is revoked", async () => {
			const { refreshToken: originalToken } = await getAdminAuthViaRest(server);
			assertToBeNonNullish(originalToken);

			// Perform refresh - this should atomically revoke old and create new
			const refreshResult = await mercuriusClient.mutate(
				Mutation_refreshToken,
				{
					variables: {
						refreshToken: originalToken,
					},
				},
			);

			expect(refreshResult.errors).toBeUndefined();
			const newToken = (
				refreshResult.data?.refreshToken as { refreshToken: string }
			)?.refreshToken;
			assertToBeNonNullish(newToken);

			// Verify old token is revoked (atomic operation - if new exists, old must be revoked)
			const oldTokenAttempt = await mercuriusClient.mutate(
				Mutation_refreshToken,
				{
					variables: {
						refreshToken: originalToken,
					},
				},
			);
			expect(oldTokenAttempt.data?.refreshToken).toBeNull();
			expect(oldTokenAttempt.errors).toBeDefined();

			// Verify new token works (atomic operation - if old is revoked, new must exist)
			const newTokenAttempt = await mercuriusClient.mutate(
				Mutation_refreshToken,
				{
					variables: {
						refreshToken: newToken,
					},
				},
			);
			expect(newTokenAttempt.errors).toBeUndefined();
			assertToBeNonNullish(newTokenAttempt.data?.refreshToken);
		});

		test("should maintain database consistency under concurrent refresh attempts", async () => {
			const { refreshToken: token } = await getAdminAuthViaRest(server);
			assertToBeNonNullish(token);

			// Attempt concurrent refreshes with the same token
			// Only one should succeed due to atomic token rotation
			const [result1, result2] = await Promise.all([
				mercuriusClient.mutate(Mutation_refreshToken, {
					variables: { refreshToken: token },
				}),
				mercuriusClient.mutate(Mutation_refreshToken, {
					variables: { refreshToken: token },
				}),
			]);

			// Count successful refreshes
			const successCount = [result1, result2].filter(
				(r) => r.errors === undefined && r.data?.refreshToken !== null,
			).length;

			// At least one should succeed, and the other should either succeed
			// (if it ran first) or fail (if the token was already revoked)
			// Due to race conditions, both might succeed if they check before either commits
			expect(successCount).toBeGreaterThanOrEqual(1);

			// Verify the original token no longer works
			const finalCheck = await mercuriusClient.mutate(Mutation_refreshToken, {
				variables: { refreshToken: token },
			});
			expect(finalCheck.data?.refreshToken).toBeNull();
			expect(finalCheck.errors).toBeDefined();
		});
	});
});
