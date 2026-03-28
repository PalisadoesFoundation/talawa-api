import { and, eq } from "drizzle-orm";
import { oauthAccountsTable } from "~/src/drizzle/tables/oauthAccount";
import { usersTable } from "~/src/drizzle/tables/users";
import { builder } from "~/src/graphql/builder";
import { MutationOAuthLoginInput } from "~/src/graphql/inputs/MutationOAuthLoginInput";
import { InvalidAuthorizationCodeError } from "~/src/utilities/auth/oauth/errors";
import type { OAuthProviderRegistry } from "~/src/utilities/auth/oauth/OAuthProviderRegistry";
import type {
	OAuthProviderTokenResponse,
	OAuthUserProfile,
} from "~/src/utilities/auth/oauth/types";
import envConfig from "~/src/utilities/graphqLimits";
import {
	DEFAULT_REFRESH_TOKEN_EXPIRES_MS,
	generateRefreshToken,
	hashRefreshToken,
	storeRefreshToken,
} from "~/src/utilities/refreshTokenUtils";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import type { CurrentClient } from "../../context";
import { AuthenticationPayload } from "../AuthenticationPayload";

/**
 * Sign in using an OAuth provider.
 * Requires a pre-linked OAuth account row in oauthAccountsTable and returns AuthenticationPayload.
 * New OAuth links are created via linkOAuthAccount for authenticated users.
 */
builder.mutationField("signInWithOAuth", (t) =>
	t.field({
		type: AuthenticationPayload,
		complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
		description:
			"Sign in with a pre-linked OAuth account by exchanging an authorization code for tokens. This is sign-in-only and requires an existing oauthAccountsTable record; onboarding/linking is handled via linkOAuthAccount for authenticated users.",
		args: {
			input: t.arg({
				type: MutationOAuthLoginInput,
				required: true,
				description:
					"Input containing OAuth provider details and authorization code.",
			}),
		},
		resolve: async (_parent, args, ctx) => {
			// Prevent already authenticated users from signing in again
			if (ctx.currentClient.isAuthenticated) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "forbidden_action",
					},
					message: "You are already signed in. Please sign out first.",
				});
			}

			// Verify OAuth provider registry is available
			if (!ctx.oauthProviderRegistry) {
				ctx.log.error("OAuth provider registry is not available in context");
				throw new TalawaGraphQLError({
					extensions: {
						code: "unexpected",
					},
					message: "OAuth authentication is not available.",
				});
			}

			// Get the OAuth provider from the registry
			let provider: ReturnType<OAuthProviderRegistry["get"]>;
			try {
				provider = ctx.oauthProviderRegistry.get(
					args.input.provider.toLowerCase(),
				);
			} catch (_error) {
				ctx.log.warn(
					{ provider: args.input.provider.toLowerCase() },
					"OAuth provider not found or not enabled",
				);
				throw new TalawaGraphQLError({
					extensions: {
						code: "invalid_arguments",
						issues: [
							{
								argumentPath: ["input", "provider"],
								message: `OAuth provider "${args.input.provider.toLowerCase()}" is not enabled or not found.`,
							},
						],
					},
				});
			}

			// Exchange authorization code for access token
			let tokenResponse: OAuthProviderTokenResponse;
			try {
				tokenResponse = await provider.exchangeCodeForTokens(
					args.input.authorizationCode,
					args.input.redirectUri,
				);
			} catch (error) {
				ctx.log.error(
					{ error, provider: args.input.provider.toLowerCase() },
					"Failed to exchange authorization code for tokens",
				);
				// Distinguish invalid/expired authorization code from other failures
				if (error instanceof InvalidAuthorizationCodeError) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "invalid_arguments",
							issues: [
								{
									argumentPath: ["input", "authorizationCode"],
									message:
										"Invalid or expired authorization code. Please try signing in again.",
								},
							],
						},
					});
				}
				// For provider/network or other unexpected failures, avoid blaming user input
				throw new TalawaGraphQLError({
					extensions: {
						code: "unexpected",
					},
					message:
						"Failed to sign in with OAuth due to a temporary problem. Please try again.",
				});
			}

			// Fetch user profile from OAuth provider
			let userProfile: OAuthUserProfile;
			try {
				userProfile = await provider.getUserProfile(tokenResponse.access_token);
			} catch (error) {
				ctx.log.error(
					{ error, provider: args.input.provider.toLowerCase() },
					"Failed to fetch user profile from OAuth provider",
				);
				throw new TalawaGraphQLError({
					extensions: {
						code: "unexpected",
					},
					message:
						"Failed to retrieve user information from OAuth provider. Please try again.",
				});
			}

			// Validate that we got essential user information
			if (!userProfile.providerId) {
				ctx.log.error(
					{ provider: args.input.provider.toLowerCase() },
					"OAuth provider did not return a provider ID",
				);
				throw new TalawaGraphQLError({
					extensions: {
						code: "unexpected",
					},
					message:
						"Invalid user profile received from OAuth provider. Please try again.",
				});
			}

			// Use transaction for atomicity: find linked OAuth account and user
			return await ctx.drizzleClient.transaction(async (tx) => {
				// Try to find existing OAuth account
				const [existingOAuthAccount] = await tx
					.select()
					.from(oauthAccountsTable)
					.where(
						and(
							eq(
								oauthAccountsTable.provider,
								args.input.provider.toLowerCase(),
							),
							eq(oauthAccountsTable.providerId, userProfile.providerId),
						),
					);

				let user: typeof usersTable.$inferSelect;

				if (existingOAuthAccount) {
					// Path 1: OAuth account already linked - fetch the user
					const [existingUser] = await tx
						.select()
						.from(usersTable)
						.where(eq(usersTable.id, existingOAuthAccount.userId));

					if (!existingUser) {
						ctx.log.error(
							{ userId: existingOAuthAccount.userId },
							"OAuth account linked to non-existent user",
						);
						throw new TalawaGraphQLError({
							extensions: {
								code: "unexpected",
							},
							message: "User account not found. Please contact support.",
						});
					}

					user = existingUser;

					// Update lastUsedAt for the OAuth account
					await tx
						.update(oauthAccountsTable)
						.set({ lastUsedAt: new Date() })
						.where(eq(oauthAccountsTable.id, existingOAuthAccount.id));
				} else {
					// Throw error if OAuth account is not linked
					throw new TalawaGraphQLError({
						extensions: {
							code: "forbidden_action",
						},
						message: "OAuth account not found.",
					});
				}

				// Reset failed login attempts on successful OAuth authentication
				// This ensures consistency with password-based login flow
				if (
					user.failedLoginAttempts > 0 ||
					user.lockedUntil ||
					user.lastFailedLoginAt
				) {
					await tx
						.update(usersTable)
						.set({
							failedLoginAttempts: 0,
							lockedUntil: null,
							lastFailedLoginAt: null,
						})
						.where(eq(usersTable.id, user.id));

					// Update local user object to reflect changes
					user.failedLoginAttempts = 0;
					user.lockedUntil = null;
					user.lastFailedLoginAt = null;
				}

				// Check for administrator role upgrade (consistent with password sign-in)
				if (user.role === "regular") {
					// Check if the user has administrator role in any organization
					const adminMemberships =
						await tx.query.organizationMembershipsTable.findMany({
							where: (fields, operators) =>
								and(
									operators.eq(fields.memberId, user.id),
									operators.eq(fields.role, "administrator"),
								),
						});

					const isAdmin = adminMemberships.length > 0;
					if (isAdmin) {
						user.role = "administrator";
					}
				}

				// Update authentication context
				ctx.currentClient.isAuthenticated = true;
				ctx.currentClient.user = {
					id: user.id,
				} as CurrentClient["user"];

				// Generate refresh token
				const rawRefreshToken = generateRefreshToken();
				const refreshTokenHash = hashRefreshToken(rawRefreshToken);

				// Calculate refresh token expiry (default 7 days if not configured)
				const refreshTokenExpiresIn =
					ctx.envConfig.API_REFRESH_TOKEN_EXPIRES_IN ??
					DEFAULT_REFRESH_TOKEN_EXPIRES_MS;
				const refreshTokenExpiresAt = new Date(
					Date.now() + refreshTokenExpiresIn,
				);

				// Store refresh token in database
				await storeRefreshToken(
					tx,
					user.id,
					refreshTokenHash,
					refreshTokenExpiresAt,
				);

				// Generate JWT access token
				const accessToken = ctx.jwt.sign({
					user: {
						id: user.id,
					},
				});

				// Set HTTP-Only cookies for web clients if cookie helper is available
				if (ctx.cookie) {
					ctx.cookie.setAuthCookies(accessToken, rawRefreshToken);
				}

				return {
					authenticationToken: accessToken,
					refreshToken: rawRefreshToken,
					user,
				};
			});
		},
	}),
);
